# Kiểm chứng nhận diện panda v2 — 11/11/2026

Bản triển khai theo concept đã duyệt: logo mặt panda + chữ foodgo, bộ hình theo trạng thái, ảnh món và icon native. Code được kiểm tra trong bản sao riêng trước khi đồng bộ; không đổi SDK hay API.

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| TypeScript | `npm run typecheck` đạt, không lỗi |
| Lint | `npm run lint` đạt, exit 0 |
| Test | 20/20 đạt: 19 test nghiệp vụ/HTTP/DTO cũ và 1 test giữ imageCode qua cart/order snapshot |
| Web export | Đạt, `dist-brand` |
| Android/iOS export | Đạt, cả hai Hermes bundles trong `dist-brand-native` |
| PNG atlas | 1536×1024 RGBA; góc và ranh giới ô mẫu alpha=0; các hình được clip đúng ô |
| Icon Android | Foreground riêng, bán kính pixel alpha>16 lớn nhất 282,03px, nhỏ hơn bán kính an toàn 418px |
| UI web mobile | Đã kiểm tra 360×800 và 390×844; ảnh lưu tại `preview/panda-v2/` |

## Luồng đã thử trong giao diện

- Guest/Home/login có logo panda + foodgo; khác với header chỉ có chữ trước đây.
- Customer-1 chuẩn bị giỏ, xem hai ảnh món, lấy quote và tạo đơn COD FG-16 tổng 155.000đ.
- Màn đặt thành công có panda riêng, trạng thái chờ quán, ảnh/tóm tắt đơn và hai hành động. Theo dõi đơn mở chi tiết đúng FG-16; không tự thay trạng thái giao/tiền.
- Customer-2 xem hộp thư trống với panda ôm thư. Đổi tài khoản và các tab hoạt động.
- Quán xem danh sách đơn có ảnh; không có tab của khách. Tài xế xem các nhóm đang giao/đề xuất/lịch sử với hình trống đúng ngữ cảnh.
- Sửa nhãn tab bị co chiều cao: kiểm tra DOM cho thấy nhãn hiện đủ 16px theo line-height, không còn bị co còn 11,2px. Tab bar tính thêm safe-area và fontScale.

## Rà soát và giới hạn

Một lượt review độc lập phát hiện foreground icon Android dùng chung ảnh vuông có thể cắt tai panda. Đã tạo ảnh foreground có khoảng trống riêng và kiểm tra hình học pixel như bảng trên. Không có lỗi quan trọng khác được báo trong lượt review.

Metro của phiên thử riêng từng báo EMFILE trên Windows. Đã tách cache npm khỏi thư mục dự án thử, dùng một worker và mở lại; sau đó kiểm tra được màn tài xế và các màn khách. Các export cuối chạy tuần tự với một worker đều đạt. Không thay đổi Expo cổng 8081 hoặc tường lửa của người dùng trong đợt chỉnh giao diện này.

Chưa có kiểm tra trực tiếp phiên bản giao diện mới trên Android/iPhone thật hoặc launcher của bản build native. Kiểm tra chữ lớn, xoay máy và mask launcher thực tế còn thuộc QA thiết bị. Các ảnh ở đây là ảnh chụp web mobile và ảnh minh họa AI; không xem là bằng chứng giao dịch thật hay tích hợp Spring Boot/MariaDB.

## Xem bản mới

Reload trong Expo Go hoặc nhấn `r` tại terminal Expo của dự án. Nếu cần khởi động lại, giữ cổng 8081 đã cấu hình: `npx expo start --port 8081 --max-workers 2`. Launcher icon mới dùng khi đóng gói bản app native; logo trong màn hình có thể xem ngay bằng Expo Go.
