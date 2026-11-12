# Hoàn thiện trải nghiệm M03–M05 — 12/11/2026

Người dùng yêu cầu review, lập plan và làm ngay: FE/BE đúng SRS/SDS, giá tự cập nhật khi chọn mã/địa chỉ/thanh toán, sửa các lỗi review, chữ tự nhiên và animation theo chương11. Giữ phong cách FoodGo/panda và nội dung người dùng vừa sửa; không viết lại M01–M02 ngoài các đầu vào tối thiểu để M03 hoạt động.

## Thiết kế

- Giữ nền sáng, xanh FoodGo và điểm nhấn cam; dùng token/typography hiện có. Tổng thanh toán và nút Đặt món luôn ở vị trí dễ thấy.
- Báo giá tự lấy sau lựa chọn và tự làm mới khi hết hạn; xử lý request chậm bằng generation/identity, không cho confirm snapshot cũ. Giá là giá server; đang tính thì khóa đặt món, không tự cộng trừ phía client để giả số tiền đã xác nhận.
- Ưu đãi có trạng thái áp dụng/không đủ điều kiện, bỏ mã và đổi thanh toán đều cập nhật; lỗi cho phép thử lại, không yêu cầu bấm Xem giá ở luồng bình thường.
- Khôi phục đơn/phiên thanh toán và báo trở ngại bằng UUID+payload đã lưu; phân biệt từ chối chắc chắn với kết quả chưa biết do mạng.
- Motion ngắn theo hành động: phản hồi nút/chip, tổng giá cập nhật, tin nhắn mới, đặt/giao thành công. Có reduced-motion; không animation giấu lỗi, trì hoãn thao tác hoặc nhấp nháy liên tục.

## Công việc và tiêu chí kiểm chứng

- [x] Review đối chiếu SRS/SDS và bảy lỗi trong FoodGo_Review_GiaiDoan4_2026-11-11.md; đọc PDF/zip chương11 và docs Expo58/RN0.88.
- [x] BE: cart đọc/sửa được khi dòng không còn hợp lệ, quote vẫn kiểm tra nghiêm; từ chối số thập phân/overflow; phục hồi attempt pending theo tài khoản; phản hồi pending202; hủy/issue/role/state thống nhất.
- [x] FE checkout: tự quote có debounce/race guard/TTL refresh, mã không phù hợp có lý do, tổng tiền cập nhật ngay sau phản hồi; pending multi-device khôi phục; không còn bước Xem giá; test request chậm/đổi lựa chọn/hết hạn/lỗi mạng.
- [x] FE chat: hợp nhất trang/cursor/poll không rơi tin; retry UUID giữ payload; issue draft lưu bền; lý do hủy thống nhất UI/BE.
- [x] Chữ người dùng: bỏ M02/module/API/version/idempotency/key và tiêu đề debug khỏi màn hình người dùng; giữ thông tin mô phỏng cần thiết để không hiểu nhầm thanh toán/cuộc gọi/GPS thật.
- [x] Animation: component dùng chung có reduced-motion, phản hồi chọn mã/giá/nút; không thêm dependency native ngoài Expo Go đã có.
- [x] Regression BE: khác key cùng giỏ,1driver2orders, hủy-vs-nhận, thay đổi giá/option/address/offer khi pending, rollback ghi dở, invalid cart, fractional; dùng DB fooddriver_it_* riêng.
- [x] Regression FE unit + screen interaction phù hợp, lint/typecheck, export web/native; QA ảnh chụp web mobile và hạn chế thiết bị ghi rõ.
- [x] Review độc lập sau tích hợp; publish có baseline/hash/concurrent-edit guard, bảo toàn file local và dữ liệu mẫu; không dừng IDE, không mở server nền8080.

## Cấu trúc triển khai

Checkout agent sở hữu checkout screens/services/helpers; backend agent sở hữu BE và tests. Agent motion/copy sở hữu component motion, UI chung và copy màn account/favorites/home/work. Agent chính sở hữu chat/order detail, integration và kiểm chứng. Chỉ agent chính chạy build BE theo thứ tự để tránh shared target race; các test/thiết kế được bổ sung trước sửa code.
