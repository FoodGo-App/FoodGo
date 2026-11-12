# Dữ liệu demo mở rộng FoodGo — 12/11/2026

> Bản tích hợp: mọi seed runner cần profile `local` và opt-in tương ứng (`foodgo.seed-enabled`/`foodgo.rich-seed-enabled`), mặc định tắt và loại mọi test profile. Lệnh seed dưới đây chỉ dùng sau khi người vận hành chọn rõ môi trường riêng; không tự seed/reset fooddriver. Test flow dùng [chốt DB riêng](../../docs/INTEGRATION_M01_M05.md).

Đã nạp vào database `fooddriver`. Đây là dữ liệu hư cấu có tên món, mức giá và tình huống giao hàng hợp lý để demo; không phải quán/khách/số điện thoại/giao dịch có thật. Quán mới có tiền tố `[Mẫu]`.

## Số lượng thực tế sau khi nạp

| Bảng/nhóm | Tổng trong fooddriver |
|---|---:|
| users |65 (5 cũ +30 khách +20 tài xế +10 quản lý quán mới)|
| restaurants |11|
| categories |9|
| foods |106|
| option_groups / option_values |203 /606|
| offers |25|
| addresses |62|
| favorites |120|
| carts / cart_items |32 /64|
| orders / order_items |120 /240|
| order_events |909|
| driver_offers |2031|
| messages |416|
| driver_reviews |56|
| checkout_quotes / checkout_attempts |121 /120|

Đơn gồm:84 DELIVERED,12 CANCELLED,12 REJECTED,3 PENDING_CONFIRMATION,3 CONFIRMED đang NO_DRIVER,2 PREPARING,2 READY_FOR_PICKUP và2 OUT_FOR_DELIVERY. Sáu đơn đã có tài xế đang thực hiện; một đơn đang giao có trở ngại chưa xử lý để thử flow tiếp. Hai hội thoại có32 tin để thử phân trang.

Các dòng lịch sử trải trong khoảng45 ngày trước thời điểm nạp, gồm COD/ví, hoàn ví cho đơn hủy/từ chối, option snapshot, sự kiện và đánh giá sau giao. Quán/tài xế được thao tác qua service thật rồi chỉ lùi thời gian trên những record mẫu mới.

## Tài khoản demo

Mật khẩu của tài khoản mẫu mới: **`FoodGo@123`** (hoặc giá trị `foodgo.seed-password` lúc tạo). Không đổi mật khẩu tài khoản đã có.

| Nhóm | Username |
|---|---|
|30 khách|`sample.customer01` đến `sample.customer30`|
|10 quản lý quán|`sample.restaurant01` đến `sample.restaurant10`|
|20 tài xế|`sample.driver01` đến `sample.driver20`|

Bộ ba đã kiểm tra qua API, cùng tham gia đơn đang giao:

- `sample.customer29`: thấy4 đơn, có đơn đang giao, lịch sử đã giao và đã hủy; có giỏ mới2 món.
- `sample.restaurant09`: quán **[Mẫu] Ăn Vặt Góc Phố**, thấy12 đơn gồm đơn mới chờ nhận và đơn đang giao.
- `sample.driver05`: thấy5 đơn, trong đó có đơn đang giao cho khách29.

`sample.customer30`/`sample.restaurant10`/`sample.driver06` có đơn đang giao gặp trở ngại. `sample.driver03` và `sample.driver04` có đơn quán đã sẵn sàng để thử nhận món.

Tài khoản `customer-1`, `customer-2`, `restaurant-1`, `driver-1`, `driver-2` vẫn giữ nguyên dữ liệu cũ. **Đăng nhập tài khoản `sample.*` để xem bộ đơn lịch sử mới**, không chờ các đơn này xuất hiện ở `customer-1`.

## Thực đơn và ưu đãi

10 quán: Bếp Tre Xanh, Phở Sáng Mai, Bún Bò Gió Nội, Bánh Mì Góc Nhỏ, Cơm Tấm Hạt Nắng, Mì Nhà Mây, Bếp Chay An Nhiên, Trà Sữa Mộc Miên, Ăn Vặt Góc Phố, Bún Đậu Mẹt Tre. Mỗi quán có10 món, gồm món lẻ/combo, khẩu phần/topping và ghi chú.

Giá mẫu từ10.000 đến169.000đ. Offer `MAUALL10` giảm10% toàn hệ thống, tối đa30.000đ; `MAU01`–`MAU20` là ưu đãi riêng theo quán, một số yêu cầu dùng ví. Offer cũ giữ nguyên.

Ảnh: FE hiện có2 ảnh món local (cơm gà và cơm nấm). Món khác dùng mã SAMPLE_FOOD để hiện icon món ăn có sẵn; bộ nạp không giả danh ảnh thực tế của từng món. Bản đồ vẫn dùng fixture AREA_A, không phải định vị/GPS thật.

## Cơ chế an toàn và chạy lại

`RichDemoSeedService` dùng tài khoản riêng, tạo đơn qua Cart/Checkout/Restaurant/Driver/Communication service. Toàn bộ thao tác nằm trong một transaction; marker `SAMPLE_DATA_READY` với UUID ổn định xác nhận bộ v1 đã hoàn thành. Gọi lại khi marker còn sẽ không thêm đơn, đổi password hay nạp lại giỏ bị người dùng sửa.

Không drop/truncate/reset schema. Đã đối chiếu hash của **48 dòng có sẵn trên21 bảng** trước/sau: không dòng nào bị sửa hoặc mất. Chỉ thêm record mới. Dispatch tuân theo service nên các tài xế cũ đang rảnh có thể có offer lịch sử cho đơn mẫu; tất cả các offer đó đã REVOKED/EXPIRED, không gán đơn hay giữ bận tài xế cũ.

Seed mở rộng **mặc định tắt**, không tự chạy khi mở IDE. Để tạo cùng bộ dữ liệu trên máy thành viên khác, build backend rồi chạy từ thư mục backend:

```powershell
.\mvnw.cmd '-DskipTests' package
java -jar target/foodgo-backend-0.0.1-SNAPSHOT.jar --foodgo.seed-enabled=false --foodgo.rich-seed-enabled=true --foodgo.rich-seed-exit=true --foodgo.wallet-scenario=SUCCEEDED --server.address=127.0.0.1 --server.port=18081
```

Giữ đầy đủ các cờ trên cho lần nạp one-shot. File cấu hình local phải có URL/user/password MariaDB của máy đó. Tiến trình tạm tự đóng sau khi nạp. Database này đã nạp xong, không cần chạy lệnh lại để xem dữ liệu.

## Kiểm chứng

- Test seed trên MariaDB riêng: số lượng, tiền bằng tổng dòng, refund, quyền người gửi, review/driver đúng đơn, thời điểm offer và nhận giao, không có active offer/assignment mới cho tài xế cũ, chạy lại không nhân đôi, dữ liệu cũ không đổi.
- Regression suite **61 test qua**,0 lỗi.
- Đã thử API login/catalog/cart/orders/messages của bộ tài khoản ở trên thành công.
- Lần chạy lại trên fooddriver thật được so fingerprint toàn bộ dữ liệu sau nạp; không thêm hoặc sửa record.
- Công cụ test tạm không dùng cổng8080 và đã được tắt; bro tiếp tục mở backend trong IDE như bình thường, rồi tải lại màn hình FE.
