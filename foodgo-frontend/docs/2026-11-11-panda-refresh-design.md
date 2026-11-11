# FoodGo — nhận diện panda và chỉnh giao diện

Người dùng đã chọn bản xem trước ngày 11/11/2026: logo đầu panda cạnh chữ foodgo, bộ biểu cảm cùng một nhân vật, teal/mint/kem/cam, ảnh món và màn công việc gọn. Đây là phần hoàn thiện giao diện đã được đồng ý trong cuộc trò chuyện.

## Phương án

Giữ một sticker duy nhất ít công chỉnh nhưng không thể hiện trạng thái và thiếu logo riêng. Bộ biểu cảm thống nhất cùng logo khuôn mặt làm nhận diện rõ hơn mà vẫn giữ nhân vật đã chốt; người dùng chọn hướng này. Không thêm mascot tràn vào từng thẻ đơn, không thay bố cục/phạm vi M01/M02 hoặc logic đặt/giao/tiền.

## Thực hiện

- Logo bằng mặt panda và chữ foodgo dựng bằng text để nét, đọc rõ ở kích thước nhỏ; icon native dùng mặt panda trên nền teal.
- Sáu hình dùng chung một atlas trong suốt: logo, chào, trống, chờ, thành công, thư. Dùng đúng ngữ cảnh; màn quán/tài xế ưu tiên thông tin.
- Dùng ảnh minh họa cơm gà/cơm nấm cho fixture có mã xác định. Món chưa có ảnh dùng hình thay thế trung tính, không gán nhầm ảnh món khác. Nhãn ảnh mẫu vẫn hiện tại công cụ demo/chat.
- Header có logo ở màn chính; màn con có nút quay lại và logo nhỏ. Nhãn demo giữ rõ nhưng bớt lấn diện tích. Icon tab dùng Expo Symbols SDK 58 đã có sẵn.
- Nền kem #FBFAF6, teal #006C59, mint #E5F3EB, chữ #163B36, điểm nhấn cam. Giữ nút tối thiểu 44, chữ tăng được, logo không tranh chỗ với tiêu đề.
- Không đổi API/state/role; hiển thị thành công đặt đơn vẫn là chờ quán, không biến thành giao thành công.

## Kiểm tra

Kiểm tra hình trong suốt và khung atlas, mobile 360/390 và chữ lớn, khách/quán/tài xế, loading/empty/success, món không có mã ảnh, typecheck/lint/test và export Android/iOS/web. Launcher icon/splash chỉ thấy đầy đủ khi build native, Expo Go có thể giữ icon của Expo Go. Đối chiếu hash trước khi đồng bộ về thư mục đích để giữ chỉnh sửa khác của người dùng.
