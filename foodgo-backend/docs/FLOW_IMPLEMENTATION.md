# Hoàn thiện luồng backend M03–M05

Yêu cầu tiếp tục ngày 11/11/2026: hoàn thiện BE theo FE và thêm dữ liệu mẫu MariaDB. Thực hiện kế hoạch `M03_M04_M05_BACKEND_PLAN.md` đã thống nhất.

- [x] Đọc schema, API FE, trạng thái source và tạo checkout riêng từ commit 420150a.
- [x] M03: quote/attempt idempotency, wallet pending/resolve/cancel, snapshot đơn, scope, hủy/refund, tracking.
- [x] M04: quán xử lý, offer/dispatch/retry, nhận/giao/COD, issue và hết hạn offer.
- [x] M05: conversation, message/cursor/idempotency, call mô phỏng, review duy nhất.
- [x] Seed local idempotent user/catalog/options/offers/address/cart, không reset dữ liệu có sẵn.
- [x] Test HTTP trên MariaDB riêng: flow và quyền, phiên bản/idempotency/refund, race và rollback.
- [x] Đồng bộ project đích có kiểm tra thay đổi đồng thời, chạy với `fooddriver`, xác minh seed chạy lại không nhân đôi.

Quyết định: checkout local tách biệt để giữ project đang dùng; không tạo Git worktree. Các module độc lập M04, M05, seed được triển khai riêng theo skill subagent-driven-development; M03 và tích hợp do agent chính thực hiện. Database kiểm thử có tên `fooddriver_it_*`; không drop/truncate database người dùng. Seed chỉ nạp đầu vào nghiệp vụ, đơn demo được tạo qua API để có event/snapshot hợp lệ. Map, call và ví là mô phỏng đúng phạm vi SRS.

## Kết quả và các quyết định sau kiểm thử

- 60 test qua, 0 lỗi trên MariaDB 13.0.2 trong database riêng; FE 20 test, lint và typecheck đều qua.
- Phát hiện/sửa lỗi repository field bị null trên Spring proxy; thêm test login thực tế. Accessor qua proxy thay cho đọc field public.
- Phát hiện/sửa rollback-only khi pending revalidation gọi validator @Transactional; validator phiên bản tại CheckoutService để có thể commit CANCELLED rồi trả409 từ controller.
- Đổi connection pool app sang READ COMMITTED sau lỗi1020 thực tế của snapshot isolation khi hai transaction chờ cùng dòng. Vẫn giữ khóa order→driver→offer và khóa cart; không đổi cấu hình toàn MariaDB.
- Kiểm tra offer còn lại dùng current locking read, tránh kẹt FINDING_DRIVER khi hai offer cùng bị từ chối.
- Review độc lập xác nhận các fix và không tìm thêm lỗi high/medium trong phần giá/quyền/token/atomicity đã kiểm tra.
- Đã publish code vào project đích, bảo toàn file cấu hình local. Build JAR tại đích thành công.
- Seed thật: users5, restaurants1, categories2, foods6, option_groups3, option_values6, offers4, addresses2, carts2, cart_items4, cart_item_options6. Không tạo sẵn order/message/review giả.
- Sau lần khởi động lại: counters, fingerprint credential/user-state/cart-version không đổi.
- Smoke trên backend đang chạy: 5 login/me thành công; adapter FE đọc cart2 lines, quote TRUA10 đúng141000đ; health qua IP LAN trảUP. FE `.env.local` được tạo (Git bỏ qua) với API mode và IP Wi-Fi hiện tại.
- Chưa thực hiện thao tác trên điện thoại; M01–M02 ngoài phần nền vẫn thuộc thành viên nhận bàn giao. Thay đổi hiện có ở local, chưa tự commit/push lần hoàn thiện này.
