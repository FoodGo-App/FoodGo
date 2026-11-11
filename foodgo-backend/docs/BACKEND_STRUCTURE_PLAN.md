# Kế hoạch đưa khung backend vào project nhóm

Yêu cầu: người dùng cần thấy cấu trúc BE trong thư mục `foodgo-backend` ở ổ D để tự đưa lên Git và giao M01–M02. Giữ thiết kế package theo nghiệp vụ đã thống nhất trong SDS, không thay framework hoặc xây lại chức năng.

- [x] Đọc trạng thái project đích, so hash baseline, kiểm tra không có AGENTS.md áp dụng ở các thư mục cha.
- [x] Chuẩn bị README, kiến trúc, hướng dẫn bàn giao M01–M02 và cấu hình mẫu không có secret.
- [x] Đưa code nền đã kiểm tra và các package scaffold vào project đích; giữ nguyên cấu hình local/IDE.
- [x] Chạy test từ project đích với MariaDB đã cấu hình, kiểm tra các file publish khớp bản nguồn.
- [x] Kiểm tra file cấu hình local được Git bỏ qua; báo trạng thái thực tế, không tự commit/push.

Các package nhỏ giữ lớp trực tiếp trong module; không tạo controller/service giả cho các nghiệp vụ chưa làm. Package chưa có nghiệp vụ dùng `package-info.java`; thư mục test dùng `.gitkeep` để tồn tại sau clone.

Kết quả: đã publish và so hash 51 file; hash cấu hình local trước/sau không đổi. Chạy `mvnw.cmd -B test` ngay tại project đích: 4 tests, 0 failures, 0 errors, BUILD SUCCESS. Xác minh bằng Git trong fixture riêng: 7 đường dẫn local/build bị bỏ qua, 6 đường dẫn source/mẫu được phép theo dõi. Không tạo repository, commit hoặc push thay người dùng.
