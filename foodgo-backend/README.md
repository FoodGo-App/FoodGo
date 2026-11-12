# FoodGo Backend

Spring Boot 4.1.2 · Java 21 · Maven Wrapper · MariaDB · Flyway.

**M01–M02 đã nối FE–BE thật trên DB test riêng: 12 kịch bản UI/API PASS; backend 45 test đạt. Các luồng M01–M02 chính trên Android/Expo Go đã được người dùng trực tiếp nghiệm thu PASS, gồm restore/logout và tách dữ liệu A/B. M03–M05 chưa nghiệm thu API trong phạm vi này.**

Hướng dẫn hiện hành: [bàn giao/chạy lại sau reboot](../docs/M01_M02_HANDOVER.md). Các bước chạy cá nhân dưới đây là ứng dụng thường :8080/fooddriver; test launcher dùng :18080/fooddriver_m01_test, account và cấu hình riêng.

## Chạy trên máy cá nhân

1. Cài JDK 21, mở terminal tại thư mục `foodgo-backend`.
2. Tạo database trên MariaDB nếu chưa có:

   ```sql
   CREATE DATABASE IF NOT EXISTS fooddriver
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Nếu chưa có cấu hình local, sao chép mẫu rồi điền tài khoản MariaDB:

   ```powershell
   Copy-Item application-local.properties.example application-local.properties
   ```

   Giữ nguyên file local nếu đã cấu hình. File này được Git bỏ qua. Mỗi thành viên tự tạo trên máy của mình; không đưa mật khẩu vào file mẫu hoặc `src/main/resources/application.properties`.

4. Khởi động:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

   Trên macOS/Linux: `./mvnw spring-boot:run` (cấp quyền thực thi wrapper nếu cần).

5. Kiểm tra `http://localhost:8080/api/v1/health`, kết quả `{"data":{"status":"UP"}}`.

Flyway tự áp dụng migration khi chạy. V1 tạo 21 bảng nghiệp vụ và bảng hạ tầng `flyway_schema_history`. **Không sửa V1 đã áp dụng**; thay đổi schema dùng migration V2, V3… mới. Không dùng `ddl-auto=create`, `update` hoặc `create-drop` trên database nhóm.

## Cấu trúc và phân công

```text
foodgo-backend/
├── .mvn/wrapper/                 # Maven Wrapper dùng chung
├── docs/
│   ├── ARCHITECTURE.md           # Ranh giới package, giao tiếp chung
│   ├── HANDOFF_M01_M02.md        # Điểm bắt đầu cho thành viên nhận M01–M02
│   └── M03_M04_M05_BACKEND_PLAN.md
├── src/main/java/fit/iuh/foodgobackend/
│   ├── FoodgoBackendApplication.java
│   ├── common/                  # Envelope, lỗi và hỗ trợ persistence
│   ├── config/                  # Security, CORS, cấu hình
│   ├── account/                 # M01: phiên đăng nhập, người dùng, địa chỉ
│   ├── catalog/                 # M02: quán, món, tùy chọn, ưu đãi, tính giá
│   ├── cart/                    # M02: giỏ hàng và version
│   ├── ordering/                # M03: checkout, thanh toán mô phỏng, đơn hàng
│   ├── fulfillment/             # M04: quán xử lý đơn, tài xế giao hàng
│   ├── communication/           # M05: chat, cuộc gọi mô phỏng, đánh giá
│   └── bootstrap/               # Fixture local chỉ chạy khi profile local + opt-in rõ ràng
├── src/main/resources/
│   ├── application.properties   # Cấu hình chung, không chứa mật khẩu thật
│   └── db/migration/            # Schema Flyway
├── src/test/java/fit/iuh/foodgobackend/
│   └── account|catalog|cart|ordering|fulfillment|communication/
├── application-local.properties.example
├── application-local.properties # Chỉ trên máy cá nhân, Git bỏ qua
├── pom.xml
├── mvnw / mvnw.cmd
└── .gitignore
```

Đọc [kiến trúc](docs/ARCHITECTURE.md) và [bàn giao M01–M02](docs/HANDOFF_M01_M02.md) trước khi thêm code.

## Kiểm tra

```powershell
.\mvnw.cmd test
.\mvnw.cmd -DskipTests package
```

Test context/HTTP yêu cầu FOODGO_TEST_DB_URL, FOODGO_TEST_DB_USERNAME, FOODGO_TEST_DB_PASSWORD riêng. Guard chặn trước refresh/Flyway; TestDatabaseProbe kiểm tra account không truy cập được fooddriver. Xem bàn giao trước khi chạy lệnh test bên trên. Bộ backend gần nhất: 45 tests, 0 failures/errors/skipped; không dùng cấu hình local để fallback test.

## Tích hợp Expo

API dùng tiền tố `/api/v1`, cổng mặc định `8080`. Điện thoại dùng IP LAN của máy chạy backend, ví dụ `http://<IP_LAN>:8080/api/v1`; `localhost` trên điện thoại trỏ về chính điện thoại. Expo Go gọi backend qua HTTP; chỉ backend kết nối MariaDB.

M01/M02 có API auth, địa chỉ, catalog, yêu thích và giỏ. Catalog có thể trống trên schema mới; không có tài khoản đăng nhập triển khai được nhúng trong gói. Fixture local cần profile local và foodgo.seed-enabled=true rõ ràng; mặc định tắt. Không tự seed fooddriver. TestServerLauncher tạo fixture riêng trong database test và ghi metadata không chứa password/token. Wallet/call thuộc phần nhóm M03–M05.

## Đưa lên Git

Đưa source, `pom.xml`, wrapper, migration, tài liệu và file `.example` lên Git. Không đưa `application-local.properties`, `.env`, `target/`, `.idea/`, log hay dữ liệu runtime lên Git. Nếu file chứa mật khẩu từng được theo dõi trước đó, `.gitignore` không tự gỡ nó khỏi lịch sử Git.

Chưa tự tạo commit hoặc push repository; người phụ trách nhóm chọn repository và nhánh bàn giao.
