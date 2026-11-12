# Chạy luồng FoodGo M03–M05 với MariaDB

> Bản tích hợp: mọi seed runner cần profile `local` và opt-in tương ứng (`foodgo.seed-enabled`/`foodgo.rich-seed-enabled`), mặc định tắt và loại mọi test profile. Lệnh seed dưới đây chỉ dùng sau khi người vận hành chọn rõ môi trường riêng; không tự seed/reset fooddriver. Test flow dùng [chốt DB riêng](../../docs/INTEGRATION_M01_M05.md).

## Chạy backend và tài khoản local

Mở terminal tại `foodgo-backend`, giữ file `application-local.properties` riêng rồi chạy:

```powershell
.\mvnw.cmd spring-boot:run
```

Mặc định cổng 8080, API `/api/v1`. Flyway kiểm tra V1; seed thêm dữ liệu thiếu sau khi schema sẵn sàng. Không sửa V1 đã áp dụng, không reset hoặc tự nạp lại giỏ đã thanh toán.

| Vai trò | Username | Mật khẩu local mặc định |
|---|---|---|
| Khách 1 | customer-1 | FoodGo@123 |
| Khách 2 | customer-2 | FoodGo@123 |
| Quán Bếp Nhà | restaurant-1 | FoodGo@123 |
| Tài xế 1 | driver-1 | FoodGo@123 |
| Tài xế 2 | driver-2 | FoodGo@123 |

Chỉ tài khoản mới dùng mật khẩu này; seed không đổi mật khẩu hoặc vai trò của username đã có. `FOODGO_SEED_ENABLED=false` tắt seed, `FOODGO_SEED_PASSWORD` đổi mật khẩu cho lần tạo tài khoản mới.

## Nối FE

Trong thư mục FE, tạo `.env.local` (Git bỏ qua):

```dotenv
EXPO_PUBLIC_DATA_MODE=api
EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_MAY>:8080/api/v1
```

Khởi động lại Metro bằng `npx expo start -c`, mở Expo Go và đăng nhập bằng tài khoản ở trên. Điện thoại dùng IP LAN của máy chạy backend. Expo web trên cùng máy có thể dùng `http://localhost:8080/api/v1`.

FE hiện có màn M03–M05. Phần catalog/giỏ đầy đủ thuộc M02 đang bàn giao; giỏ mẫu giúp thử checkout lần đầu. Sau khi mua/xóa giỏ, thêm món qua API M02 hiện có hoặc phần UI M02 khi thành viên phụ trách hoàn thiện. Seed không tự phục hồi giỏ mỗi lần khởi động.

## Luồng thử

1. Khách đăng nhập → xem `/cart`, `/addresses`, `/catalog/offers`. Giỏ mới có 2 cơm gà đã chọn option giá 50.000 và 1 cơm nấm 40.000.
2. `POST /checkout/quotes` với addressId, offerId TRUA10, COD/MOCK_WALLET và expectedCartVersion mới nhất. Tổng mẫu: 140.000 − 14.000 + 15.000 = 141.000đ.
3. `POST /checkout/attempts` với quoteId/expectedCartVersion và header `Idempotency-Key` UUID. COD thành công ngay; ví PENDING, chưa có order. Dùng GET attempt/by-key để phục hồi khi mất mạng. Cùng key/cùng body trả kết quả cũ; khác body trả 409.
4. Với ví: resolve tạo order khi fixture thành công; cancel giữ giỏ. Quote hết 120 giây sau khi đã vào PENDING không tự làm thất bại thanh toán; thay đổi giỏ/giá/địa chỉ/offer vẫn được kiểm tra lại. Resolve không hợp lệ kết thúc attempt CANCELLED và giữ giỏ.
5. Quán đăng nhập → nhận đơn → chuẩn bị → sẵn sàng. Từ chối khi chưa nhận sẽ hoàn ví; COD chưa thu tiền.
6. Tài xế đăng nhập → nhận offer trong 30 giây → nhận món khi quán sẵn sàng → giao. Chỉ một tài xế thắng; tài xế bận không nhận thêm đơn. COD phải xác nhận đã thu tiền, ví không thu COD.
7. Khi có tài xế, khách và tài xế xem/gửi chat hoặc mở cuộc gọi mô phỏng. Sau terminal chỉ đọc chat; gửi lại UUID tin đã thành công vẫn trả tin cũ.
8. Sau DELIVERED, khách đánh giá tài xế 1 lần. Gửi lại cùng nội dung trả đánh giá cũ, khác nội dung trả 409.

Offer hết hạn/tất cả từ chối → NO_DRIVER; khách tìm lại trên cùng order, dispatchRound tăng. Trở ngại giao dùng UUID riêng và lưu event; giao thành công thêm ISSUE_RESOLVED tham chiếu event gốc.

## API nghiệp vụ

Mọi đường dẫn dưới đây có tiền tố `/api/v1`; cần Bearer token trừ login/catalog/health.

| Phần | API |
|---|---|
| Checkout | POST `/checkout/quotes`, POST `/checkout/attempts`, GET `/checkout/attempts/{id}`, GET `/checkout/attempts/by-key/{key}`, POST `/checkout/attempts/{id}/resolve`, POST `/checkout/attempts/{id}/cancel` |
| Đơn khách | GET `/orders`, GET `/orders/{id}`, POST `/orders/{id}/cancel`, POST `/orders/{id}/dispatch-retries`, GET `/orders/{id}/tracking` |
| Quán | GET `/restaurant/orders`, POST `/restaurant/orders/{id}/accept`, `/reject`, `/prepare`, `/ready` |
| Tài xế | GET `/driver/offers`, POST `/driver/offers/{id}/accept`, `/decline`, GET `/driver/orders?scope=active|history`, POST `/driver/orders/{id}/pickup`, `/deliver`, `/issues` |
| Hội thoại | GET `/orders/{id}/conversation`, GET/POST `/orders/{id}/messages`, POST `/orders/{id}/call-access` |
| Đánh giá | GET/POST `/orders/{id}/driver-review` |

Message body: UUID `clientMessageId`, `kind=TEXT` và text 1–1000 ký tự; hoặc `kind=IMAGE` và `assetCode=MEAL_SAMPLE`. Cursor tin nhắn dùng `beforeId` hoặc `afterId`, `limit` 1–50. Review: stars nguyên 1–5, tags trong `SERVICE`, `FRIENDLY`, `DELIVERY`, không trùng; note tối đa 300 ký tự.

M03/M04 giữ trạng thái/tiền ở server; không nhận driverId, tổng tiền hay trạng thái thanh toán từ app. Đối với sai quyền dùng 403 hoặc 404 theo phạm vi. Lỗi cạnh tranh 409 cho phép tải lại/tra cứu và gửi lại cùng UUID.

## Mô phỏng và cấu hình

- `FOODGO_WALLET_SCENARIO=SUCCEEDED|FAILED|CANCELLED|PENDING`: fixture do server quyết định, được lưu vào attempt lúc bắt đầu. Mặc định SUCCEEDED sau bước resolve.
- `FOODGO_CALL_SCENARIO=CONNECTED|NO_ANSWER|FAILED`: cuộc gọi mô phỏng, không truyền âm thanh.
- Tracking trả map/ETA mẫu, không có GPS hay dịch vụ bản đồ thật.
- `FOODGO_OFFER_SECONDS` mặc định 30, `FOODGO_QUOTE_SECONDS` mặc định 120.
- Connection pool app dùng READ COMMITTED và khóa dòng rõ ràng để xử lý cạnh tranh; không thay đổi isolation toàn server. MariaDB 13 đã trả lỗi snapshot 1020 khi thử REPEATABLE READ với các transaction cùng chờ một dòng. Xem [tài liệu transaction MariaDB](https://mariadb.com/docs/server/reference/sql-statements/administrative-sql-statements/set-commands/set-transaction).

## Test

Unit và context: `mvnw.cmd test` (context cần MariaDB cấu hình local).

Tạo database thử riêng, ví dụ `fooddriver_it_local`, rồi chạy trên PowerShell:

```powershell
.\mvnw.cmd '-Dfoodgo.integration=true' '-Dspring.datasource.url=jdbc:mariadb://127.0.0.1:3306/fooddriver_it_local' test
```

Test tích hợp từ chối ghi dữ liệu nếu tên database không bắt đầu bằng `fooddriver_it_`. Không dùng database có dữ liệu thật để chạy suite này. Đã xác minh 60 test, 0 lỗi, gồm HTTP lifecycle, quyền, đồng thời checkout/nhận offer/từ chối offer, pending/expiry/revalidation, refund và seed idempotency thực trên MariaDB 13.0.2.

M01–M02 ngoài phần nền vẫn do thành viên phụ trách hoàn thiện; kiểm thử điện thoại thực trên mạng LAN cần thực hiện trên thiết bị của nhóm.
