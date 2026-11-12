# Review và tích hợp FoodGo M01–M05 — 12/11/2026

## Quyết định

Nhận phần M01–M02 của A qua bản ghép đã có, sau review và kiểm chứng lại. Không merge lại nhánh feature từ đầu, không lấy nguyên file của một bên khi có khác biệt hành vi.

| Nhánh/commit | Nội dung | Đánh giá |
|---|---|---|
| `feature/m01-m02-huu` / `a7993b8` | Auth/session, địa chỉ, catalog/tùy chọn, yêu thích, giỏ và màn hình chọn món | Phù hợp để bổ sung phần đầu hành trình đặt món |
| `main` / `eafeadf` | Checkout tự báo giá, đơn, fulfillment, communication, retry, motion và dữ liệu mẫu | Giữ các hành vi và regression đã có |
| `integration/m01-m05-20261112_080541` / `8972709` | Merge có cả hai commit trên làm cha, đã giải quyết xung đột, đánh dấu WIP DB pending | Dùng làm ứng viên, chưa coi kiểm thử của hai nhánh riêng là kết quả của bản ghép |

Review độc lập FE/BE không tìm thấy regression P0/P1 trong các chỗ ghép đã kiểm tra. Đã kiểm tra user/cart locks, expectedVersion, quyền địa chỉ, lựa chọn món, strict quote, cart invalid recovery DTO, session generation, resource combine/chat, retry draft, UTC và từ chối số thập phân cho ID/số lượng.

## Phát hiện và xử lý

1. **Bản nháp địa chỉ chưa sẵn sàng vẫn chọn được ghim:** `AddressesScreen.tsx` dùng `useDraft` mới nhưng Chip chưa khóa khi đọc lỗi/đang tải, có thể ghi đè bản nháp chưa đọc. Đã khóa cả UI và handler theo `draft.ready`, thêm tải lại bản nháp khi đọc lỗi.
2. **Preflight thiếu quyền cho test rollback:** hướng dẫn/kiểm tra ALTER chưa đủ cho `orderItemWriteFailureRollsBackWholeCheckout`, vì test tạo trigger tạm trên `order_items`. Đã thêm kiểm tra TRIGGER trong preflight và regression từ chối quyền thiếu. Chỉ cấp quyền cần thiết trên bảng của database test; không cấp trên `fooddriver`. Regression mới đã thất bại trước sửa và đạt sau sửa.
3. **Khách mới thiếu đường đi thêm địa chỉ từ checkout:** thêm nút mở `/addresses` ở chế độ API, khóa khi đặt đơn/đang phục hồi thanh toán. Quay lại checkout sẽ tải lại context và báo giá bằng địa chỉ mới.
4. **Copy từ phần giỏ còn lộ Version/backend:** đổi các nhãn nhìn thấy thành hướng dẫn gần gũi; giữ nguyên version/journal nội bộ và thao tác thử lại có xác nhận. Nút tùy chọn đã ngừng bán/đang xử lý có trạng thái disabled rõ ràng.
5. **Bản đồ mẫu ghi cố định Bếp Nhà:** truyền tên quán từ đơn để các quán mới của M02 không hiện sai điểm xuất phát. Giữ nhãn bản đồ/GPS mô phỏng; không thêm dịch vụ bản đồ hoặc cuộc gọi thật trong đợt merge này.

Trong lúc chỉnh copy có phát sinh lỗi thay thế ký tự làm sai tên hàm ở bản đang làm; đã phát hiện qua QA browser, khôi phục file gốc và áp lại thay đổi cụ thể. `cartService.ts` không có thay đổi hành vi so với bản ghép A. Kết quả dưới thuộc bản sau khắc phục.

## Kiểm chứng bản ghép

- BE: **126 tests, 0 failures/errors/skipped**, Maven package thành công, Java21.
- Hai schema `fooddriver_m01_test` và `fooddriver_it_m01_m05` chưa tồn tại trên máy kiểm chứng; tạo mới, mỗi schema một account riêng. Hai probe xác minh không truy cập được database ứng dụng/schema của policy khác trước khi chạy test. Migration V1 thành công; không sửa V1, không reset/repair database có sẵn.
- Test BE gồm M01/M02 auth/address/catalog/cart, test guard/preflight, Flow/JPA/seed thật, cạnh tranh trạng thái, rollback và toàn bộ regression M03–M05.
- FE: **94 tests đạt**, lint và TypeScript đạt. Xuất web, Android và iOS thành công; không thêm dependency hay đổi lockfile.
- QA trình duyệt khung **390×844**, BE/MariaDB thật ở cổng/schema kiểm thử riêng: tìm Combo Panda, chọn nước cam +5.000đ, nhập 2 phần/ghi chú, đăng nhập và quay lại đúng lựa chọn; thêm giỏ, sửa thành 3 phần; thêm địa chỉ và chọn lại ở checkout; tổng 300.000đ, áp TRUA10 tự về **271.500đ**, đặt thành công đơn kiểm thử #143.
- Tiếp tục chính đơn #143 bằng HTTP API: `restaurant1` nhận/chuẩn bị/sẵn sàng; `driver1` nhận/lấy/giao và xác nhận thu COD; khách–tài xế gửi được 2 tin, khách đánh giá 5 sao. Kết quả **DELIVERED / PAID**, tổng giữ 271.500đ. Đơn xuất phát từ món/tùy chọn của M02, không phải fixture đặt thẳng của M03.
- Ảnh giao diện: [đặt đơn thành công](../foodgo-frontend/docs/qa/integration-order-success.png).

Các bước chọn món/giỏ/địa chỉ/checkout được thử trực tiếp trên giao diện; bước fulfillment/chat/review của chính đơn được xác nhận bằng HTTP API. Không suy ra toàn bộ màn hình mobile đã nghiệm thu từ kết quả API.

## Chạy bản tích hợp trên máy nhóm

Project chính vẫn dùng MariaDB `fooddriver` và file local sẵn có. Giữ nguyên `application-local.properties`, `.env.local`; dừng đúng phiên BE cũ trong IDE rồi chạy lại, FE chạy `npx expo start -c`. Không chạy hai BE cùng cổng8080. FE API URL trên điện thoại phải là IP LAN của máy BE.

Tài khoản cũ `customer-1`, `customer-2`, `restaurant-1`, `driver-1`, `driver-2` và `sample.*` vẫn giữ nguyên nếu đã có. Màn mới dùng được với tài khoản khách cũ; không bắt buộc tạo lại database hoặc tài khoản.

Máy mới cần dữ liệu local thì tạo `fooddriver`, cấu hình credential riêng, chạy một phiên seed có chủ ý:

```powershell
cd foodgo-backend
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=local' '-Dspring-boot.run.arguments=--foodgo.seed-enabled=true'
```

Fixture thêm thiếu theo thứ tự M01 → M02 → bộ cơ bản, không đổi password/record cũ. Namespace của A là `customer1`, `restaurant1`, `driver1` (khác các tên có dấu gạch). Mật khẩu của account mẫu mới mặc định `FoodGo@123`, trừ khi người chạy đã cấu hình seed-password khác. Seed mặc định tắt; không bật thường trực chỉ để khởi động app. Bộ dữ liệu mở rộng opt-in theo `foodgo-backend/docs/RICH_SAMPLE_DATA.md`.

Chạy toàn bộ BE test có DB:

1. Thiết lập `FOODGO_TEST_DB_*` và `FOODGO_FLOW_TEST_DB_*` cho hai schema test đúng policy, bằng credential riêng.
2. Account flow cần SELECT/INSERT/UPDATE/DELETE/CREATE, ALTER cho V1, và TRIGGER trên `order_items` cho regression rollback; không dùng account ứng dụng/root.
3. Chạy `TestDatabaseProbe` và `FlowTestDatabaseProbe`, sau đó `mvnw.cmd -o '-Dfoodgo.integration=true' test`. Không fallback sang `fooddriver`, không tự repair schema có failed migration.

## Giới hạn

Chưa nghiệm thu trực tiếp Android/iOS của bản ghép trong lượt này. Bundle native không thay thế kiểm thử thiết bị. Map/GPS, ví và cuộc gọi vẫn mô phỏng; cuộc gọi thật và bản đồ thật là phạm vi nâng cấp riêng đã trao đổi với người dùng. Không sửa dữ liệu ứng dụng `fooddriver`, cấu hình riêng hay server8080 khi review. Nhánh feature và bản WIP của A được giữ nguyên để đối chiếu.
