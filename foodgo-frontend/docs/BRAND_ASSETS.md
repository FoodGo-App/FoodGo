# FoodGo — tài nguyên nhận diện panda v2

Ngày 11/11/2026. Cơ sở: ảnh `foodgo-panda-approved.png` đã chốt và board mở rộng logo/biểu cảm được người dùng đồng ý trong chat. Tất cả hình mới tạo bằng công cụ image_gen tích hợp; không tải ảnh món từ nguồn bên ngoài. Ảnh món là ảnh minh họa AI, không phải ảnh chụp món thật của một nhà hàng.

## Tài nguyên đang dùng

| File trong assets/images | Mục đích |
|---|---|
| brand/panda-atlas-v2.png | Atlas PNG alpha 1536×1024, sáu ô 512×512: logo/chào/trống ở hàng trên, chờ/thành công/thư ở hàng dưới |
| brand/panda-icon-v2.png | Icon vuông opaque 1254×1254, khuôn mặt panda trên nền teal; app icon iOS/Android và favicon |
| brand/panda-adaptive-foreground-v2.png | Lớp mặt panda trong suốt có padding riêng, dùng adaptive icon Android; không dùng icon vuông tràn nền làm foreground |
| food/chicken-rice.png | Ảnh minh họa cơm gà nướng, mã CHICKEN_RICE |
| food/mushroom-rice.png | Ảnh minh họa cơm nấm kho chay, mã MUSHROOM_RICE |
| mascot/panda-courier.png | Giữ hình v1 cho splash và tương thích tài nguyên cũ |

Panda.tsx hiển thị đúng một ô bằng View clipping và Image 3×2, không cắt sửa file nguồn. Brand.tsx ghép mặt panda với chữ foodgo bằng Text để rõ ở kích thước nhỏ. FoodThumbnail.tsx chỉ nhận mã ảnh đã biết; chỉ trong demo mới dùng food-1/food-2 làm fallback cho dữ liệu cũ đã lưu. Trong API, món chưa có mã ảnh được hỗ trợ sẽ có biểu tượng dao nĩa trung tính. Không đoán ảnh từ tên món hoặc tải URL tùy ý.

## Bộ prompt tạo tài nguyên

- **Atlas:** một atlas trong suốt thật, tỷ lệ 3:2 và lưới vô hình 3 cột × 2 hàng bằng nhau. Giữ nhân vật panda 2D mũm mĩm của mẫu duyệt: đầu/bụng trắng tròn, tai/tay/chân đen, má hồng, túi chéo teal. Sáu ô lần lượt là mặt logo, vẫy tay, ngồi với túi trống, ngồi cạnh đồng hồ, cầm túi giao món vui vẻ, ngồi ôm phong bì. Mỗi hình nằm trong ô riêng với khoảng trống, không chữ, đường lưới hoặc nền màu.
- **Icon:** một icon vuông, nền teal #006C59 tràn bốn góc, opaque; mặt panda cười đơn giản theo logo duyệt. Tai và mặt nằm trong vùng giữa để phù hợp mask adaptive. Không chữ, không thân người hoặc khung điện thoại. Công cụ trả kích thước 1254px vuông, lớn hơn mức nguồn 1024px đề xuất.
- **Adaptive foreground:** giữ khuôn mặt icon, bỏ nền thành alpha và tăng khoảng trống; toàn bộ mặt/tai nằm trong vòng tròn giữa có đường kính 54% canvas để không bị mask launcher cắt. Đây là một ảnh riêng cho Android, đã kiểm tra bán kính pixel có alpha nhìn thấy nằm trong vùng an toàn.
- **Cơm gà:** ảnh photorealistic vuông của một đĩa cơm gà nướng Việt Nam, gà xém cạnh, cơm trắng, dưa leo/cà chua/rau và chén nước chấm; đĩa trắng, nền bàn trung tính, ánh sáng tự nhiên; không người, chữ hoặc logo.
- **Cơm nấm:** ảnh photorealistic vuông của một đĩa cơm nấm kho chay, nấm hương/nấm đùi gà sốt nâu, cơm trắng, cải thìa/dưa leo/đồ chua; cùng ánh sáng và nền với cơm gà; không thịt, trứng, hải sản, chữ hoặc logo.

## Lưu ý dùng trong Expo Go

Logo và biểu cảm trong màn hình có thể xem bằng Reload. Launcher icon và native splash được áp dụng khi đóng gói bản native; Expo Go vẫn có nhận diện launcher của Expo Go. Chỉnh nhận diện không đổi SDK, scheme, backend hay các trạng thái đơn/thanh toán.
