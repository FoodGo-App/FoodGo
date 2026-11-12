# Bàn giao backend M01–M02

Đây là bàn giao **khung và code nền**, không phải xác nhận các module đã hoàn tất. Căn cứ nghiệp vụ: SRS 1.5.1 và SDS 2.1.1 của nhóm. Package phân công giữ nguyên như SDS.

## Người nhận bắt đầu ở đâu?

1. Đọc README, chạy health API, kiểm tra kết nối MariaDB cá nhân.
2. Tạo nhánh phát triển M01–M02 trong repository nhóm.
3. Đọc các lớp `account/`, `catalog/`, `cart/` hiện có và migration V1.
4. Đối chiếu SRS/SDS và frontend của A trước khi bổ sung API. Ghi những thay đổi hợp đồng cho thành viên M03–M05.
5. Tạo seed local hoặc fixture kiểm thử có BCrypt và dữ liệu hợp lệ trước khi thử login/cart. Đã có seed local gồm 5 user, catalog, địa chỉ, ưu đãi và giỏ mẫu; xem SEED_DATA.md.

## Phạm vi và trạng thái

| Phần | Đã có trong source | Người nhận cần làm tiếp |
|---|---|---|
| M01 xác thực | Login, me, logout, principal, token hash/expiry/revoke, BCrypt | Kiểm thử HTTP với dữ liệu thật; hoàn thiện các use case M01 còn lại theo SRS và FE |
| M01 địa chỉ | List, create, update, delete có scope customer | Kiểm thử quyền, giới hạn, validation và tương thích màn hình của A |
| M02 catalog | API đọc quán, món, chi tiết món/tùy chọn, ưu đãi | Danh mục, yêu thích, tìm kiếm/lọc/chi tiết quán và API còn thiếu theo SRS; tối ưu phân trang khi cần |
| M02 giỏ | Xem, thêm, sửa, xóa món, xóa giỏ; version và đổi quán | Kiểm thử option, gộp dòng, đổi quán và cạnh tranh cập nhật; thống nhất body với FE |
| M02 pricing | Kiểm tra món/option, giá và quote payload phía server | Hoàn thiện, kiểm thử và giữ interface cho M03 |
| Dữ liệu local | Schema 21 bảng và seed idempotent user/catalog/options/offers/address/cart | Giữ nguyên cơ chế không reset dữ liệu khi bổ sung fixture của M01–M02 |
| M03 | Checkout/attempt/order API, snapshot, hủy/refund, tracking mô phỏng | Giữ interface pricing/cart để phối hợp M03 |
| M04/M05 | Quán, dispatch/tài xế, chat/call mô phỏng, review | Xem API_FLOW_RUNBOOK.md; không thay mã trạng thái dùng chung |

## API nền hiện có

Tất cả đường dẫn dưới đây có tiền tố `/api/v1`. Danh sách này mô tả code nền hiện tại, không thay thế danh sách API đầy đủ trong SDS.

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/health` | Công khai, trả `UP` |
| POST | `/auth/login` | `{username,password}` → `{token,expiresAt,user}` trong `data` |
| GET | `/auth/me` | Bearer token |
| POST | `/auth/logout` | Thu hồi phiên |
| GET/POST | `/addresses` | Customer, body thêm địa chỉ bên dưới |
| PUT/DELETE | `/addresses/{id}` | Chỉ địa chỉ thuộc người dùng |
| GET | `/catalog/restaurants` | `page`, `size` |
| GET | `/catalog/foods` | `page`, `size` |
| GET | `/catalog/foods/{id}` | Có option groups/values |
| GET | `/catalog/offers` | Ưu đãi đang hiệu lực |
| GET/DELETE | `/cart` | DELETE dùng query `expectedVersion` |
| POST | `/cart/items` | Body thêm/sửa món bên dưới |
| PUT | `/cart/items/{id}` | Cùng cấu trúc body |
| DELETE | `/cart/items/{id}` | Query `expectedVersion` |

Body địa chỉ:

```json
{
  "recipientName": "Khách mẫu",
  "recipientPhone": "0900000000",
  "addressText": "Địa chỉ mẫu",
  "label": "Nhà",
  "areaCode": "AREA_A",
  "mapPointCode": "CUSTOMER_A"
}
```

Hiện địa chỉ dùng fixture `AREA_A` và `CUSTOMER_A`/`CUSTOMER_B`, chưa tích hợp bản đồ thật.

Body thêm/sửa món (ID chỉ minh họa, thay bằng dữ liệu thật):

```json
{
  "foodId": "1",
  "optionValueIds": [],
  "note": "Ít cay",
  "quantity": 1,
  "expectedVersion": 0,
  "replaceRestaurant": false
}
```

Lấy version từ `GET /cart`. Nếu món bắt buộc chọn option, lấy các ID tùy chọn từ chi tiết món. Đổi quán phải xác nhận và gửi `replaceRestaurant=true`; không âm thầm trộn hai quán.

## Interface cần giữ cho M03–M05

- `UserPrincipal`: `id()`, `role()`, `restaurantId()`, `dto()`, `requireRole(...)`.
- `CartService`: `lock(UserPrincipal)`, `version(Map, long)`, `clear(Map)`; clear chỉ được gọi trong transaction chốt đơn thành công.
- `PricingService`: `line(...)`, `lines(long cartId)`, `quote(long customerId, Map cart, long addressId, Long offerId, String method)`; xem chữ ký chính xác trong source trước khi gọi.
- Cart version phải tăng khi nội dung giỏ thay đổi; không tin tổng tiền do FE gửi.
- M01–M02 không tự đổi mã role, paymentMethod, orderStatus hoặc kiểu envelope.
- Code query và transaction là phần nền cần kiểm thử thêm, chưa được chứng minh đúng chỉ bằng việc context khởi động.

## Checklist trước bàn giao lại cho nhóm

- [ ] Chạy được trên một máy mới với file local riêng.
- [ ] Có dữ liệu local và tài khoản fixture được tạo bằng BCrypt; không hard-code credential production.
- [ ] Login/me/logout và truy cập trái quyền được kiểm thử.
- [ ] Địa chỉ luôn thuộc đúng customer; dữ liệu không hợp lệ bị từ chối.
- [ ] Catalog/tùy chọn/yêu thích và use case M02 đầy đủ theo SRS.
- [ ] Cart version cũ bị từ chối; tổng tiền và option được tính lại phía server.
- [ ] Có test service/HTTP cho các luồng ghi dữ liệu, không chỉ contextLoads.
- [ ] Migration mới không làm mất dữ liệu và đã chạy trên database kiểm thử.
- [ ] FE của A gọi đúng API, phần checkout của M03 dùng được cart/pricing chung.
- [ ] Không commit file local, token, log, target hoặc dữ liệu runtime.

## Kết quả xác minh nền ngày 11/11/2026

MariaDB 13.0.2 kết nối thành công; Flyway V1 tạo schema; health/catalog đọc thành công; Maven test có 4 test qua (1 context, 3 policy). Đây chưa phải kiểm thử end-to-end M01–M05. MariaDB 13 mới hơn bản Flyway đã xác minh nên có cảnh báo tương thích; lần kiểm tra này migration và startup vẫn thành công.
