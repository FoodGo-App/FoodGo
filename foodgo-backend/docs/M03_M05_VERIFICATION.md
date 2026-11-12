# Hoàn thiện M03–M05 — 12/11/2026

## Hành vi đã sửa

- Checkout tự lấy báo giá khi mở màn hình, đổi địa chỉ, mã hoặc phương thức thanh toán; bỏ bước “Xem giá”. Debounce ngắn, chặn phản hồi cũ và tự làm mới báo giá hết hạn. Trong lúc tính lại, không cho đặt theo số tiền cũ.
- Mã giảm giá hiển thị điều kiện và lý do chưa áp dụng được. Bỏ mã hoặc đổi thanh toán đều tính lại bằng giá từ BE.
- Giỏ vẫn đọc/xóa được món không còn bán hoặc tùy chọn không hợp lệ; checkout yêu cầu xử lý các dòng này trước. BE từ chối số lượng thập phân và số vượt giới hạn.
- Khôi phục phiên thanh toán đang chờ theo tài khoản, kể cả thiết bị khác; đọc trạng thái không tự thanh toán. Retry sau lỗi mạng giữ đúng khóa và nội dung yêu cầu.
- Hủy đơn yêu cầu lý do rõ ràng. Báo trở ngại giao hàng, gửi tin và đánh giá giữ nội dung đã lưu khi thử lại; không tạo thao tác trùng khi mất phản hồi.
- Chat hợp nhất lịch sử và tin mới, tải nối tiếp nhiều trang, không bỏ qua tin chưa tải khi người dùng vừa gửi. Cuộc trò chuyện ban đầu trống vẫn nhận được tin mới qua `afterId=0`.
- Giờ SQL native và giờ gắn từ Java cùng được đọc đúng UTC; sửa cấu hình Hibernate thay vì cộng/trừ giờ hay viết lại dữ liệu. Có kiểm tra báo giá vừa hết hạn.
- Chữ giao diện chuyển sang tiếng Việt gần gũi; lịch sử đơn hiển thị sự kiện có nghĩa thay cho mã enum. Giữ nhãn minh bạch cho ví, cuộc gọi và vị trí mô phỏng.
- Motion dùng chung: nhấn nút/chọn mã, thay đổi giá/trạng thái, tin nhắn và panda khi thành công; có hỗ trợ giảm chuyển động và dọn animation khi rời màn hình. Không thêm thư viện native mới.

## Bằng chứng kiểm chứng

- FE: 44 test đạt; `npm run lint`, `npm run typecheck` đạt; xuất web, Android và iOS thành công.
- BE: 74 test đạt, 0 lỗi, 0 bỏ qua; đóng gói JAR thành công. Chạy với `-Dfoodgo.integration=true`, MariaDB riêng `fooddriver_it_2026111204`; kết quả cuối xem log `backend-final-clean-db.log` trong bản kiểm chứng workspace.
- Regression gồm phân quyền, vòng đời đơn, ví/COD, hủy/nhận đồng thời, hai lần đặt cùng giỏ, một tài xế nhận hai đơn, rollback, thay đổi giá/địa chỉ/mã/tùy chọn khi chờ thanh toán, cart không hợp lệ, số lượng không hợp lệ, giờ UTC, chat và đánh giá.
- QA trình duyệt khung 390×844 với BE/MariaDB thật: áp TRUA10 tự đổi 155.000đ → 141.000đ; bỏ mã về 155.000đ; chọn ví và VIFREESHIP thành 140.000đ; đặt đơn thành công; hủy có lý do và hiển thị hoàn tiền.
- Ảnh giao diện thành công: `foodgo-frontend/docs/qa/checkout-success.png`.
- Review độc lập sau tích hợp; kiểm tra hồi quy cho lỗi timer chỉ xuất hiện trên browser và cursor chat bằng 0 trước khi sửa.

## Chạy và nghiệm thu

1. Khởi động lại BE từ IDE để nhận mã/cấu hình mới. Nếu cổng 8080 đang có BE cũ, dừng đúng phiên chạy đó trong IDE trước; không chạy hai bản cùng cổng.
2. Tại thư mục FE, chạy `npx expo start -c`. Giữ cấu hình API/IP LAN và MariaDB local của máy.
3. Trên Android: thử đổi mã/địa chỉ/thanh toán nhanh, mất mạng rồi thử lại, mở lại app khi ví đang chờ; xác nhận giá và đơn không trùng.
4. Dùng tài khoản khách/nhà hàng/tài xế để demo đặt → nhận → chuẩn bị → lấy món → giao → thu COD nếu có → hoàn tất → đánh giá; thử hủy và báo trở ngại ở trạng thái cho phép.
5. Kiểm tra chat hai thiết bị và tùy chọn giảm chuyển động trên hệ điều hành.

Chưa nghiệm thu trên điện thoại Android/iPhone thật trong lượt này. Bundle native thành công không thay thế kiểm thử thiết bị. Ví, cuộc gọi và GPS hiện vẫn theo phạm vi mô phỏng của đồ án; chưa tích hợp cổng thanh toán/cuộc gọi/bản đồ sản xuất. Không thay đổi dữ liệu database `fooddriver` trong đợt kiểm thử này.

## Tài liệu animation đã đối chiếu

Đã đọc `Chuong11_Animation_Reanimated_Gesture.pdf` và mẫu `ch11-animation.zip`; chọn chuyển động ngắn, gắn với thao tác thay vì hiệu ứng lặp. Đối chiếu API với Expo SDK58, React Native Animated và AccessibilityInfo:

- https://docs.expo.dev/versions/v58.0.0/
- https://reactnative.dev/docs/animated
- https://reactnative.dev/docs/accessibilityinfo
