# FoodGo Backend

Spring Boot 4.1.2 · Java 21 · Maven Wrapper · MariaDB · Flyway.

**Trạng thái: khung dự án và phần nền ban đầu để nhóm tiếp tục phát triển. Chưa hoàn tất nghiệp vụ M01–M05.**

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
│   └── bootstrap/               # Dành cho seed local, hiện chưa có seed chạy
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

Test context cần MariaDB chạy và cấu hình local hợp lệ. Test context sẽ chạy migration trên database cấu hình; dùng database riêng cho kiểm thử khi thêm test ghi dữ liệu. Hiện có 4 test: khởi tạo Spring context và 3 test quy tắc trạng thái/COD. Chưa có bộ kiểm thử đầy đủ theo module.

## Tích hợp Expo

API dùng tiền tố `/api/v1`, cổng mặc định `8080`. Điện thoại dùng IP LAN của máy chạy backend, ví dụ `http://<IP_LAN>:8080/api/v1`; `localhost` trên điện thoại trỏ về chính điện thoại. Expo Go gọi backend qua HTTP; chỉ backend kết nối MariaDB.

Health và catalog hiện có API đọc; catalog trống khi chưa nạp dữ liệu. **Chưa có tài khoản mẫu được seed; không có tài khoản đăng nhập sẵn.** Các thuộc tính `foodgo.seed-*`, `foodgo.wallet-scenario`, `foodgo.call-scenario` trong cấu hình là chỗ dành cho phần triển khai tiếp theo, chưa kích hoạt chức năng đó.

## Đưa lên Git

Đưa source, `pom.xml`, wrapper, migration, tài liệu và file `.example` lên Git. Không đưa `application-local.properties`, `.env`, `target/`, `.idea/`, log hay dữ liệu runtime lên Git. Nếu file chứa mật khẩu từng được theo dõi trước đó, `.gitignore` không tự gỡ nó khỏi lịch sử Git.

Chưa tự tạo commit hoặc push repository; người phụ trách nhóm chọn repository và nhánh bàn giao.
