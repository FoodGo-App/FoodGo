# FoodGo — Frontend M03, M04, M05

Ứng dụng React Native / Expo Router SDK 58. Giao diện chuyển thể từ mẫu custom G2 của A: nền kem, xanh teal, thẻ bo tròn, panda mũm mĩm. Căn cứ SRS 1.5.1 và SDS 2.1.1 đã cập nhật panda.

Ngày 11/11/2026 bổ sung logo mặt panda + chữ foodgo, sáu hình theo ngữ cảnh, icon launcher, ảnh món minh họa và màn đặt đơn thành công riêng. Tài nguyên/prompt trong `docs/BRAND_ASSETS.md`, kết quả kiểm chứng bản mới trong `docs/PANDA_REFRESH_VERIFICATION.md`. Có thể Reload Expo Go để xem giao diện; launcher icon cần bản build native.

## Chạy ứng dụng

Yêu cầu Node.js 22.13+ (Node 24 để chạy bộ test TypeScript trực tiếp) và npm.

```powershell
npm ci
npm start
```

Quét QR bằng Expo Go có hỗ trợ SDK 58; điện thoại và máy tính cùng Wi-Fi. Không dùng `localhost` làm địa chỉ backend trên điện thoại. Có thể xem web bằng `npm run web`. Khi Metro báo quá nhiều file mở, chạy `npm start -- --max-workers 2` và tránh chạy đồng thời nhiều tiến trình export.

Không cần backend để diễn tập: mặc định `EXPO_PUBLIC_DATA_MODE=demo`. Chế độ demo có nhãn rõ; không gọi API thật, chuyển tiền, thu âm hoặc xin GPS.

## Cấu trúc

```text
src/
  app/                     # Route Expo Router, file mỏng
  providers/               # Phiên đăng nhập, transport, dữ liệu demo
  features/
    account/               # Cầu nối M01/M02: đăng nhập, home, tài khoản
    checkout/              # M03: báo giá, đặt đơn, kết quả ví chờ
    orders/                # M03: danh sách, chi tiết, theo dõi, hủy/tìm lại
    delivery/              # M04: hàng đợi quán, đề xuất/công việc tài xế
    communication/         # M05: hộp thư, chat, gọi mô phỏng, đánh giá
  shared/
    api/                   # HTTP, chuẩn hóa DTO SDS, demo server riêng
    components/            # UI kit, panda, bản đồ mô phỏng
    config/                # Môi trường chạy
    hooks/                 # Resource khi focus, bản nháp theo tài khoản
    storage/               # AsyncStorage và SecureStore
    theme/                 # Màu, khoảng cách, nhãn trạng thái
    types/                 # Mô hình miền
    utils/                 # UUID yêu cầu
assets/images/mascot/      # Panda FoodGo
tests/                     # Quy tắc nghiệp vụ demo và hợp đồng HTTP/DTO
docs/                      # Kế hoạch, truy vết, kiểm chứng, bàn giao
```

`features/account` chỉ cung cấp đầu vào để thử M03–M05; chưa phải M01/M02 đầy đủ. Yêu thích và danh mục món chưa triển khai đầy đủ trong đợt này. Các thành phần starter gốc giữ lại để nhóm tham khảo, không dùng làm màn chính.

## Diễn tập cùng một đơn

1. Đăng nhập demo `customer-1` → Trang chủ → chuẩn bị giỏ mẫu → Xem giỏ / thanh toán. Chọn địa chỉ, tối đa một ưu đãi và COD hoặc ví mô phỏng → Xem báo giá → Xác nhận đặt.
2. Tài khoản → Đổi tài khoản demo → `restaurant-1` → mở đơn → Nhận đơn → Bắt đầu chuẩn bị → Món đã sẵn sàng.
3. Đổi sang `driver-1` → Đề xuất → Nhận đơn giao. Đề xuất hết hạn sau 30 giây; nếu quá hạn, khách mở đơn và Tìm lại tài xế rồi chuyển sang tài xế. Trước khi nhận, đề xuất chỉ hiển thị quán, khu vực và COD.
4. Sau khi quán sẵn sàng, tài xế Đã lấy món tại quán. Có thể mở hội thoại, gửi tin chữ/ảnh mẫu và gọi mô phỏng. Với COD, chọn xác nhận đã thu đủ tiền → Xác nhận giao thành công → Xác nhận.
5. Đổi về `customer-1` → Đơn hàng → chi tiết → Xem / đánh giá tài xế. Đơn kết thúc chỉ xem lại hội thoại; mỗi đơn có một đánh giá.

Trong Tài khoản có kịch bản ví thành công/thất bại và gọi kết nối/không trả lời/lỗi. Dữ liệu demo được lưu để đổi vai trò cùng diễn tập. Phiên demo không tự khôi phục khi mở ứng dụng mới; chọn lại tài khoản, các đơn vẫn được giữ.

## Kết nối Spring Boot

Sao chép `.env.example` thành `.env` và đặt:

```dotenv
EXPO_PUBLIC_DATA_MODE=api
EXPO_PUBLIC_API_URL=http://DIA_CHI_LAN_CUA_MAY:8080/api/v1
```

Khởi động lại Expo sau khi đổi biến môi trường. Đăng nhập bằng tài khoản do backend cấp; vai trò lấy từ token/`/auth/me`, không có chọn quyền. Token native lưu SecureStore; token web chỉ nằm trong bộ nhớ. HTTP lỗi sẽ được hiển thị, không chuyển ngầm sang dữ liệu demo.

Backend cần thực hiện đúng API SDS, kiểm tra quyền và khóa chống gửi trùng phía server. `src/shared/api/adapters.ts` chuyển DTO của SDS (vd. `cartVersion`, `lines`, `recipient`, `amounts`, `sentAt`, phân trang `data + meta`) sang kiểu dùng trong màn hình. Chi tiết và các điểm cần phối hợp có trong `docs/M03_M04_M05_HANDOFF.md`.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
npm test
npm run export:web -- --max-workers 2
npm run export:native -- --max-workers 2
```

Export xác nhận bundle web/Android/iOS tạo được, không thay thế kiểm thử thiết bị thật. Chưa có backend Spring Boot chạy cùng để xác nhận tích hợp với MariaDB.
