# Phiếu kiểm thử Android — bản bàn giao FoodGo

**Trạng thái: người dùng báo đã chạy luồng chính trên Android, không gặp lỗi.** Đây là kết quả người dùng tự báo, chưa có video/log/mã đơn để đối chiếu và không xác nhận từng ca bên dưới. Không điền PASS chỉ vì lệnh build hoặc web test thành công.

Thiết bị: chưa cung cấp · Android: chưa cung cấp · Expo Go: chưa cung cấp · SDK project: 58 · Ngày ghi nhận: 12/11/2026 · Mã đơn: chưa cung cấp.

Người dùng trả lời “phiên bản 58”; chỉ ghi nhận liên quan SDK của project, không dùng làm phiên bản hệ điều hành. Luồng được báo thành công: chọn món/tùy chọn → đăng nhập → sửa giỏ → áp mã/tổng tự đổi → COD → quán nhận/chuẩn bị → tài xế nhận/giao → chat → đánh giá. Các tình huống lỗi, font lớn, Back/bàn phím, ví và gọi mô phỏng vẫn cần kiểm tra riêng.

Chuẩn bị: chạy BE một lần trên cổng 8080, FE ở chế độ api với IP LAN máy BE, điện thoại cùng mạng và mở được `http://IP_LAN:8080/api/v1/health`. Chạy FE bằng `npx expo start -c`. Giữ nguyên DB/config đã dùng; không bật seed hoặc khôi phục DB trong lúc nghiệm thu.

Để demo nhanh, giữ khách trên điện thoại, dùng hai phiên trình duyệt riêng trên laptop cho quán và tài xế nếu có thể. Nếu đổi vai trò trên một thiết bị, cần nhớ mã đơn và nhận đề xuất trước khi hết hạn. Mật khẩu mặc định tài khoản mẫu mới là `FoodGo@123` trừ khi đã đổi. Quán [Mẫu] Mì Nhà Mây: `sample.restaurant06`. Tài xế không gắn cố định theo quán: dùng tài khoản đang rảnh, có đề xuất của đúng đơn. Nếu hết hạn, dùng tìm lại khi hệ thống cho phép.

| ID | Thao tác | Kết quả mong đợi | Kết quả thực tế / PASS-FAIL |
|---|---|---|---|
| A01 | Mở QR trên Expo Go | App mở, không lỗi tải bundle | Chờ |
| A02 | Home, catalog, tìm/lọc; thử từ khóa không tồn tại | Danh sách chiếm phần chính, không tràn chữ; trạng thái trống rõ | Chờ |
| A03 | Guest chọn size/topping/số lượng, đăng nhập, hiện/ẩn mật khẩu | Không mất lựa chọn; mật khẩu không đổi | Chờ |
| A04 | Thêm món, tăng/giảm, sửa ghi chú và mở lại giỏ | Giá/lượng đúng, không nhân đôi vì bấm liên tục | Chờ |
| A05 | Thử món từ quán khác, chọn giữ giỏ cũ | Không tự xóa giỏ cũ | Chờ |
| A06 | Yêu thích, đổi tab món/quán, tìm và bỏ một mục | Dữ liệu đúng tài khoản, thao tác rõ | Chờ |
| A07 | Thêm/sửa địa chỉ; thử thiếu tên/sai số điện thoại; đóng/mở form | Validation đúng; form riêng; draft không mất ngoài dự kiến | Chờ |
| A08 | Checkout chọn địa chỉ, phương thức và mã phù hợp/không phù hợp | Tổng tự cập nhật; không cần bấm xem giá | Chờ |
| A09 | Đặt COD một lần, ghi mã đơn | Một đơn, tổng bằng tiền món + phí - giảm; giỏ cập nhật đúng | Chờ |
| A10 | Quán đúng tài khoản nhận → chuẩn bị → sẵn sàng | Chỉ thấy/được xử lý đơn của quán đó; khách cập nhật trạng thái | Chờ |
| A11 | Tài xế rảnh nhận đề xuất đúng đơn → lấy món → xác nhận COD → giao | Không lấy món trước sẵn sàng; không hoàn tất COD khi chưa xác nhận thu tiền | Chờ |
| A12 | Khách/tài xế gửi tin theo đơn; mở bàn phím, nhập nhiều dòng | Tin hiển thị ở hai bên, ô nhập/nút gửi không bị che | Chờ |
| A13 | Gọi mô phỏng, tắt/bật nút, kết thúc; đưa app ra nền | Nhãn mô phỏng rõ; không xin micro; phiên dừng phù hợp khi ra nền | Chờ |
| A14 | Theo dõi giao hàng | Tên quán/khách/tài xế đúng; bản đồ/ETA có nhãn mẫu | Chờ |
| A15 | Giao xong, khách đánh giá sao/tag/note rồi mở lại | Lưu một lần; đánh giá đã gửi ở trạng thái chỉ đọc | Chờ |
| A16 | Đơn chưa được quán nhận: hủy; sau khi nhận: thử tìm nút hủy | Chỉ hủy khi trạng thái cho phép; không tự hủy sau quán nhận | Chờ |
| A17 | Ví mô phỏng thành công/thất bại/hủy theo dữ liệu demo hỗ trợ | Không giao dịch thật; kết quả/giỏ/refund theo trạng thái | Chờ |
| A18 | Tắt Wi-Fi khi đang đọc; bật lại và cập nhật | Lỗi dễ hiểu; có cách thử lại; không hiển thị giá cũ như giá mới | Chờ |
| A19 | Mất mạng khi gửi/đặt: bật lại, kiểm tra trước khi gửi lại | Không tạo đơn/tin trùng; giữ tham chiếu thao tác chưa rõ kết quả | Chờ |
| A20 | Đăng xuất/đổi khách rồi mở đơn, giỏ, nháp cũ | Không lộ dữ liệu tài khoản trước | Chờ |
| A21 | Cuộn danh sách, mở/đóng modal, phím Back Android, xoay nếu cho phép | Không bị kẹt; Back đúng màn; không có vùng cuộn nhỏ khó dùng | Chờ |
| A22 | Tăng cỡ chữ hệ thống, thử màn hình/keyboard thấp | Không mất nút quan trọng; có thể cuộn tới nội dung | Chờ |

Nếu lỗi: ghi ID ca, tài khoản/vai trò (không gửi mật khẩu), mã đơn, bước tái hiện, kết quả mong đợi/thực tế và thời điểm. Ảnh/video bổ sung khi có. Không đánh dấu toàn bộ PASS chỉ từ một luồng thành công.

**Chốt:** số PASS ___ / FAIL ___ / chưa chạy ___; lỗi chặn còn mở ___; người kiểm tra ___ . iOS vật lý: chưa kiểm tra.
