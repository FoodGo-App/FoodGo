# Kế hoạch backend M03–M05 FoodGo

Ngày 11/11/2026. Database người dùng chọn: **fooddriver**. Căn cứ SRS 1.5.1, SDS 2.1.1 (21 bảng) và FE hiện tại. Người dùng đã yêu cầu lập kế hoạch rồi thực hiện trong `D:/TrenLop/Mobile/DeTai/Nop/FoodGoApp/foodgo-backend`.

## Kiến trúc và cấu trúc

Giữ Java 21 và Spring Boot 4.1.2 của starter. Dùng Spring Security, JPA/EntityManager, MariaDB InnoDB, Flyway. Chia package theo nghiệp vụ; controller nhận DTO, service giữ transaction/quyền, repository chứa truy vấn. Native SQL trong repository phục vụ khóa và DTO, không tạo bảng JSON tổng hợp thay 21 bảng. Không sửa SRS/SDS.

```text
fit.iuh.foodgobackend/
  common/          # envelope, lỗi, thời gian, JSON, hỗ trợ persistence
  config/          # CORS, cấu hình môi trường
  account/         # phiên token hash, BCrypt, địa chỉ và seed user
  catalog/         # đầu vào M02, thực đơn/ưu đãi và pricing
  cart/            # giỏ/version/option/signature
  ordering/        # M03 quote, attempt, order policy/snapshot/tiền
  fulfillment/     # M04 quán, dispatch/offers, giao/COD/issues
  communication/   # M05 tin nhắn, call-access, review
  bootstrap/       # seed local và fixture server
resources/db/migration/  # Flyway 21 bảng, index/FK/CHECK
test/                    # kiểm tra quy tắc và HTTP–MariaDB thật
```

## 1. Nền tảng và đầu vào tích hợp

- Tạo envelope `{data,meta?}` và `{error:{code,message}}`, validation, 400/401/403/404/409, lỗi deadlock retryable.
- Bearer token ngẫu nhiên 32 byte, chỉ lưu SHA-256, hết hạn 24h và thu hồi logout; BCrypt, quyền từ user DB.
- CORS cho Expo web local; mobile dùng IP LAN cổng 8080, database chỉ backend kết nối.
- Flyway đúng 21 bảng SDS, không có payments/assignments/conversations riêng; giữ FK và unique idempotency/review/tin.
- Seed local idempotent: 2 khách, quán, 2 tài xế, catalog/option/ưu đãi, địa chỉ. Tài khoản demo FE chỉ dùng khi DATA_MODE=demo; API phải đăng nhập thật.
- Cung cấp auth/địa chỉ/catalog/giỏ tối thiểu đủ thử M03; không mở API tự chọn role hay endpoint `/demo/*` trên API thực.

## 2. M03 — UC08/09/10, API23–33

- Pricing phía server: option/availability/quantity, 15.000 phí, tối đa 1 offer và số nguyên VND. Ca 140.000−14.000+15.000=141.000.
- Quote snapshot/hash bất biến, hạn 120s; xác minh lại cart/address/offer/giá khi chốt.
- Attempt UUID và request hash; trả lại kết quả cũ trước kiểm tra quote hết hạn. Khóa cart chống hai key cùng tạo đơn; pending ví chưa tạo order.
- Fixture ví do server cấu hình; resolve/cancel lặp ổn định. Resolve không áp hạn quote sau khi PENDING nhưng kiểm tra lại payload; lỗi mất hợp lệ kết thúc attempt, giữ giỏ.
- Lưu orders/order_items/options JSON và events trong cùng transaction, xóa giỏ/tăng version chỉ khi có order; rollback không lưu thành công độc lập.
- Danh sách/phân trang/filter, chi tiết theo actor, allowedActions, tracking mẫu. Hủy chỉ trước quán nhận; hoàn ví atomically, COD giữ UNPAID.

## 3. M04 — UC11/12/13, API34–43/50/51

- Quán đúng restaurant nhận/từ chối/chuẩn bị/sẵn sàng; lặp đúng kết quả trả hiện tại, trạng thái sai 409.
- Dispatch hữu hạn theo khu vực và driver rảnh; offer 30s, vòng tăng trên cùng order, trả summary không lộ khách.
- Nhận giao khóa order → driver user → offer, chống hai driver/đơn và một driver/hai đơn; thu hồi offer còn lại.
- Quét hết hạn và accept kiểm tra hạn độc lập; hết ứng viên sang NO_DRIVER; khách được tìm lại khi hợp lệ.
- Pickup chỉ READY + assigned; deliver chỉ OUT_FOR_DELIVERY. COD bắt buộc true, ví false; giải phóng driver và đóng issue bằng event.
- Issue dùng UUID/hash, không tự delivered/paid; cùng key khác nội dung 409.

## 4. M05 — UC14/15/16, API44–49

- Hội thoại suy từ order, chỉ customer/driver được gán; tin có cursor và ID/sender/time do server.
- UUID unique theo sender; tìm tin cũ trước read-only, cùng key khác payload lỗi; khóa order khi ghi để tránh gửi mới sau terminal. Text 1–1000, ảnh allowlist.
- Call-access chỉ cấp fixture mô phỏng khi đúng người tham gia và đơn active; không âm thanh/GPS thật.
- Review chỉ chủ đơn DELIVERED, tài xế suy từ DB; sao 1–5, tag allowlist, note≤300; unique/order, retry cùng nội dung trả cũ.

## 5. Kiểm chứng và bàn giao

- Build bằng Maven wrapper; test HTTP với database MariaDB tách biệt, không reset database có sẵn.
- Thử pricing, quote/attempt retry, pending/cancel/refund, ownership, race nhận/hủy/driver, COD/issue, terminal chat/call, review duy nhất, transaction rollback.
- Thử endpoint/DTO với FE adapter; giữ id string ở JSON để an toàn JavaScript.
- Chạy server local, smoke đầy đủ ba vai trò bằng HTTP, hướng dẫn FE chuyển API và tạo giỏ qua API tối thiểu.
- Đồng bộ có hash và sao lưu starter; không ghi đè file cấu hình local người dùng. Ghi rõ những phần đã chạy thực và QA điện thoại còn lại.

## Điều kiện môi trường

MariaDB dịch vụ 3306 đang chạy, root cần mật khẩu. Đã yêu cầu người dùng cung cấp cấu hình local không đưa mật khẩu vào chat/Git. Có thể dùng instance MariaDB thử riêng để kiểm tra trong lúc chờ; không thay đổi mật khẩu/tài khoản hoặc dữ liệu có sẵn.
