# Kiểm chứng frontend M03–M05

Đây là kiểm chứng bản triển khai ban đầu. Bản nhận diện panda v2 ngày 11/11/2026 có kết quả cập nhật trong `PANDA_REFRESH_VERIFICATION.md`.

Kiểm tra ngày 10–11/11/2026 trên Windows, Node.js 24 và Expo SDK 58. Mã được kiểm tra trong bản sao làm việc trước khi đồng bộ; bước đồng bộ so sánh SHA-256 từng file và sao lưu các file gốc thay đổi.

| Kiểm tra | Kết quả quan sát |
|---|---|
| `npm run typecheck` | Đạt, không lỗi TypeScript |
| `npm run lint` | Đạt, exit code 0 |
| `npm test` | 19/19 đạt; 0 thất bại, 0 bỏ qua |
| Expo export web, 2 workers | Đạt; 24 web bundles, có tài nguyên panda và favicon |
| Expo export Android/iOS, 2 workers | Đạt; Android 1.851 modules / Hermes 4,3 MB; iOS 1.746 modules / Hermes 4,1 MB |
| UI web 390×844, transport demo | Đã thử xuyên vai trò trên cùng đơn FG-3; xem các bước bên dưới |
| Spring Boot/MariaDB thực | Chưa kiểm chứng: chưa có backend chạy cùng |
| Android/iPhone thật | Chưa kiểm chứng: chưa kết nối thiết bị |

## Luồng UI đã quan sát

1. Khách customer-1 xem quote và tạo đơn COD 155.000đ; đơn chuyển sang chờ quán.
2. Quán restaurant-1 xem đúng đơn, nhận, chuẩn bị và báo sẵn sàng.
3. Đề xuất hết hạn không còn nhận được; khách tìm lại tài xế, orderId giữ FG-3.
4. Tài xế driver-1 chỉ thấy quán/khu vực/COD trước nhận; sau nhận mới thấy thông tin khách, bản đồ mẫu và liên hệ.
5. Tài xế lấy món, gửi tin chữ, mở gọi mô phỏng có thời lượng, kết thúc và trở về đơn.
6. Tài xế chọn đã thu COD, xác nhận giao hai bước; đơn DELIVERED, tiền PAID và COD còn thu 0đ.
7. Chuyển customer-2: không thấy FG-3 trong danh sách. Chuyển lại customer-1: thấy đúng đơn.
8. Hội thoại đơn đã giao chỉ đọc, thấy tin cũ; khách gửi đánh giá và xem kết quả đã lưu, không có nút gửi lần hai.

Ảnh giao diện: `preview/foodgo-home-mobile.jpg`.

## Nội dung bộ test

- 10 test demo: số tiền chuẩn SRS; một order cho key lặp; ví pending/resolve/cancel; quote hết hạn; phạm vi tài khoản; nhận đơn cạnh tranh/hủy; lấy món/COD/trở ngại; chat/call terminal và review duy nhất; lưu/phục hồi; đề xuất hết hạn/vòng cũ.
- 3 test HTTP: token/key/envelope; lỗi mạng không trả thành công giả; giữ mã lỗi 409.
- 6 test DTO: quote `cartVersion/lines`; summary thiếu lines và detail lồng nhau; trang ưu đãi/giá dự tính; `sentAt/deliveryArea`; từ chối chắc chắn so với kết quả chưa rõ; `allowedActions` chữ hoa.

## Ghi chú môi trường

Node in cảnh báo `MODULE_TYPELESS_PACKAGE_JSON` khi chạy các test TS trực tiếp; test vẫn đạt. Giữ cấu hình CommonJS của Expo/ESLint thay vì đổi toàn dự án sang ESM chỉ để tắt cảnh báo này.

Trong lúc chỉnh nhanh nhiều file và export song song, Metro từng gặp giới hạn file mở và Fast Refresh giữ context cũ. Đã khởi động lại, dùng 2 workers và kiểm tra lại luồng UI. Hai bản export cuối chạy tuần tự đều đạt. Khi phát triển trên Windows, nên tránh mở nhiều Metro/export đồng thời.

Đã rà soát và sửa các điểm: chuẩn hóa DTO API đúng SDS; giải phóng tham chiếu đặt đơn khi quote bị từ chối chắc chắn; giữ key khi kết quả chưa rõ; xóa trạng thái riêng khi đổi tài khoản; kiểm tra thời hạn/vòng của đề xuất demo; phân trang hộp thư. Không có thay đổi code sau các kiểm tra build cuối.
