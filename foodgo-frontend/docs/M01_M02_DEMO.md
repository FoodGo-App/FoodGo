# Chạy và demo M01–M02 bằng API thật

## Cấu hình đã kiểm tra ngày 12/11/2026

- Backend `TestServerLauncher`: `http://127.0.0.1:18080/api/v1`, profile `m01-test`, database `fooddriver_m01_test`. Launcher kiểm tra database/quyền bằng `TestDatabaseProbe` trước khi chạy ứng dụng và tạo fixture riêng.
- Dùng launcher đã có, đợi `TEST_DB_PRECHECK_OK` và `CONTROLLED_TEST_SERVER_READY`. Giữ tiến trình backend đang chạy; không mở thêm backend cùng cổng. JDK 22 chỉ đặt trong phiên launcher; pom vẫn target 21.
- Metadata lần đang chạy nằm trong `FoodGo_Artifacts/reports/M01M02_Live_*/live-fixture.json`, gồm ID món/quán và tên tài khoản A/B; không có mật khẩu/token. Chọn đúng metadata của launcher còn hoạt động. Kết quả kiểm tra ngày này dùng lượt `M01M02_Live_20261112_043505`.
- Đăng nhập ứng dụng bằng username/otherUsername trong metadata và mật khẩu fixture `M01M02TestData.PASSWORD` trong test source, xem riêng trên máy. Không chép mật khẩu vào báo cáo, lịch sử lệnh hoặc chat.
- Health: `Invoke-RestMethod http://127.0.0.1:18080/api/v1/health` phải có `data.status = UP`.

Mở PowerShell riêng tại Git root, chạy FE bằng CLI đã cài:

```powershell
$foodgoArtifacts = Join-Path (Split-Path (Get-Location).Path -Parent) 'FoodGo_Artifacts'
$env:TEMP = Join-Path $foodgoArtifacts 'tmp'
$env:TMP = $env:TEMP
$env:EXPO_NO_DOTENV = '1'
$env:EXPO_NO_TELEMETRY = '1'
$env:EXPO_PUBLIC_DATA_MODE = 'api'
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:18080/api/v1'
Set-Location foodgo-frontend
.\node_modules\.bin\expo.cmd start --localhost --port 8093
```

Mở `http://127.0.0.1:8093`. CORS của test launcher cho phép localhost/127.0.0.1:8093. Các biến chỉ áp dụng cho phiên PowerShell; không sửa `.env.local`. Dừng FE bằng Ctrl+C ở cửa sổ này. Web giữ token trong bộ nhớ: tải lại toàn trang sẽ cần đăng nhập lại; mobile vẫn dùng SecureStore.

## Checklist demo theo thứ tự

1. **Guest/catalog:** mở `/catalog`, tìm món fixture; lọc danh mục, sắp xếp giá; mở chi tiết món → quán → thực đơn. Đánh giá, khoảng cách, ETA được ghi rõ là mẫu.
2. **Quay lại sau login:** Guest chọn cỡ Lớn, 2 phần, ghi chú rồi đăng nhập A. Lựa chọn còn giữ; giỏ chỉ thay đổi sau nút xác nhận. Thử Hủy đăng nhập: trở về món công khai, giữ lựa chọn và không ghi giỏ.
3. **Địa chỉ:** A mở Địa chỉ giao hàng; thử điện thoại sai, thêm địa chỉ hợp lệ, sửa, xóa có xác nhận. Tối đa 10; user khác không thấy địa chỉ A. Snapshot địa chỉ đơn cũ được kiểm bằng backend test, không tạo đơn giả từ FE.
4. **Yêu thích:** lưu/bỏ món và quán; xem `/favorites`. Lời mời đăng nhập không tự lưu. Đổi sang B kiểm tra danh sách riêng.
5. **Giỏ:** bắt buộc chọn cỡ; Lớn có giá server 45.000đ/phần, 2 phần tổng 90.000đ. Sửa sang Vừa, đổi số lượng/ghi chú; giá và tổng cập nhật theo server. Xóa dòng, xóa toàn giỏ đều cần xác nhận.
6. **Đổi quán:** thêm món của quán thứ hai trong metadata. Trước xác nhận, giỏ cũ giữ nguyên; Giữ giỏ cũ không ghi; Xác nhận đổi quán mới thay giỏ.
7. **Xung đột:** hai phiên trình duyệt đăng nhập cùng A và đọc cùng version; phiên thứ nhất sửa giỏ. Phiên thứ hai gửi bản sửa cũ phải nhận 409, báo giỏ thay đổi và không tự gửi lại. Đọc lại rồi khách xác nhận bản sửa mới.
8. **Đổi người dùng:** đăng xuất A, vào giỏ/yêu thích/địa chỉ phải được yêu cầu đăng nhập; B chỉ thấy dữ liệu B. Kết thúc kiểm tra tại giỏ đã lưu.

## Bằng chứng và giới hạn

Chrome/CDP đã chạy với API thật, viewport 430×932: danh mục/tìm/lọc/chi tiết, CRUD địa chỉ và validation, lựa chọn sau login/hủy, yêu thích món/quán, giỏ CRUD/giá/version/đổi quán, đăng xuất và dữ liệu theo user. Ảnh và kết quả chi tiết nằm ngoài repository trong `FoodGo_Artifacts/reports/M01M02_E2E_*`.

Chưa kiểm tra UI khi một món đang trong giỏ bị đổi khả dụng: API không có thao tác quản trị khả dụng để tạo tình huống này. Backend test `cartReadKeepsUnavailableLineRemovable` thuộc bộ 45 test đã đạt kiểm tra GET vẫn trả dòng `valid=false` và DELETE được dòng đó. Không dùng mock response để nhận là FE–BE thật đã đạt.

Nghiệm thu 12/11/2026: người dùng trực tiếp thao tác trên Android/Expo Go, xác nhận PASS catalog/yêu thích/giỏ, địa chỉ, restore A sau đóng/mở lại, logout rồi mở lại vẫn Guest và login B không thấy dữ liệu riêng A. Restore/tách dữ liệu là xác nhận chuỗi thao tác của người dùng, không suy ra từ ảnh tĩnh. iOS chưa kiểm tra. `127.0.0.1` trên điện thoại là chính điện thoại; cấu hình thiết bị/LAN cần được xác minh riêng.

Đơn hàng và Hộp thư CUSTOMER hiện cùng phụ thuộc GET /orders (HTTP500/INTERNAL_ERROR đã đối chiếu, /auth/me200); backend thiếu controller M03, các service/màn liên quan giữ nguyên baseline. Đây là hạn chế tích hợp M03–M05, không phải hồi quy M01–M02. Xem [phân loại](../../docs/M01_M02_HANDOVER.md#giới-hạn-tích-hợp-đơn-hàng-và-hộp-thư). M03–M05 và API checkout/đơn/thanh toán do thành viên tương ứng hoàn thiện. Nút chuyển sang kiểm tra đơn giữ điểm nối hiện có; buổi demo M01–M02 không nhận đặt đơn thành công. Không bật fixture phát triển hoặc seed vào database ứng dụng khi chạy checklist này.

Hướng dẫn bổ sung: [bàn giao/chạy source sau reboot](../../docs/M01_M02_HANDOVER.md), [checklist mobile/SecureStore](../../docs/M01_M02_MOBILE.md).
