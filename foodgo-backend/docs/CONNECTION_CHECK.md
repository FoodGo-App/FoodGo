# Kiểm tra MariaDB — 11/11/2026

- Đọc cấu hình local do người dùng điền tại thư mục backend đích; không sao chép hoặc ghi log mật khẩu.
- Kết nối JDBC thành công với MariaDB 13.0.2 trên máy. Lần đầu báo 1049 vì thiếu database.
- Đã tạo `fooddriver` với utf8mb4, không thay đổi database khác.
- Bản backend đang phát triển build thành công (`package`, bỏ qua tests ở bước build).
- Chạy bản thử nghiệm trên loopback cổng 18080; Flyway V1 chạy thành công, 21 bảng nghiệp vụ + `flyway_schema_history`.
- `GET /api/v1/health`: 200, `data.status=UP`.
- `GET /api/v1/catalog/foods`: 200, envelope phân trang đúng, dữ liệu trống.
- Maven `test` với cấu hình local: 4 tests, 0 failures, 0 errors (context MariaDB + 3 quy tắc trạng thái/COD). Chưa có test end-to-end M03–M05.

## Phạm vi hiện tại

Đây là kiểm tra nền kết nối và schema, chưa phải kiểm chứng hoàn tất M03–M05. Chưa có seed và các service/controller checkout, fulfillment, communication đầy đủ. Khung và code nền được đưa vào project đích theo yêu cầu bàn giao M01–M02; file cấu hình local ở đích được giữ nguyên. Xem `HANDOFF_M01_M02.md` để biết chính xác phần đã có và còn thiếu.

MariaDB 13 mới hơn phiên bản Flyway đã xác minh (11.7); Flyway có cảnh báo nhưng V1 và khởi động đã thành công. Không hạ cấp database hoặc sửa dịch vụ MariaDB của người dùng.
