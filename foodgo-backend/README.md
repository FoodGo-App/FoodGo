# FoodGo Backend

Spring Boot 4.1.2 · Java 21 · Maven Wrapper · MariaDB · Flyway.

**Worktree tích hợp M01–M05: giữ nghiệp vụ M01–M02 và API M03–M05 từ main; chưa nghiệm thu DB/FE–BE/mobile của bản tích hợp.**

Xem [cách ly DB và kiểm tra](../docs/INTEGRATION_M01_M05.md). Kết quả M01–M02 trước tích hợp vẫn được lưu riêng trong [bàn giao](../docs/M01_M02_HANDOVER.md).

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
│   └── bootstrap/               # Fixture/seed idempotent, chỉ local + opt-in, tắt trong mọi test profile
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

Test M01 dùng fooddriver_m01_test; Flow/JPA/Seed integration của main dùng fooddriver_it_m01_m05 riêng. Cùng chốt trước refresh/DataSource/Flyway, không import local hoặc fallback fooddriver. Chỉ chạy test DB khi probe đúng policy đã đạt. Xem [hướng dẫn tích hợp](../docs/INTEGRATION_M01_M05.md).

## Tích hợp Expo

API dùng tiền tố `/api/v1`, cổng mặc định `8080`. Điện thoại dùng IP LAN của máy chạy backend, ví dụ `http://<IP_LAN>:8080/api/v1`; `localhost` trên điện thoại trỏ về chính điện thoại. Expo Go gọi backend qua HTTP; chỉ backend kết nối MariaDB.

M01/M02 có API auth, địa chỉ, catalog, yêu thích và giỏ. Catalog có thể trống trên schema mới; không có tài khoản đăng nhập triển khai được nhúng trong gói. Fixture local cần profile local và foodgo.seed-enabled=true rõ ràng; mặc định tắt. Không tự seed fooddriver. TestServerLauncher tạo fixture riêng trong database test và ghi metadata không chứa password/token. Wallet/call thuộc phần nhóm M03–M05.

Seed tự thêm dữ liệu mẫu khi `foodgo.seed-enabled=true`: `customer-1`, `customer-2`, `restaurant-1`, `driver-1`, `driver-2`, mật khẩu local mặc định `FoodGo@123`. Dữ liệu/credential đã có được giữ nguyên. Xem [dữ liệu mẫu](docs/SEED_DATA.md) và [hướng dẫn chạy luồng API](docs/API_FLOW_RUNBOOK.md). Ví, cuộc gọi và tracking dùng mô phỏng theo SRS.

## Đưa lên Git

Đưa source, `pom.xml`, wrapper, migration, tài liệu và file `.example` lên Git. Không đưa `application-local.properties`, `.env`, `target/`, `.idea/`, log hay dữ liệu runtime lên Git. Nếu file chứa mật khẩu từng được theo dõi trước đó, `.gitignore` không tự gỡ nó khỏi lịch sử Git.

Repository nhóm: https://github.com/HonaJnh/FoodGo. Thay đổi mới cần được review theo nhánh trước khi tích hợp.
