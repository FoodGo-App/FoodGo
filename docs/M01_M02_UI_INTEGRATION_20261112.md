# Tích hợp UI M01–M02 của A

Nguồn: FoodGo_M01_M02_UI_Integration_Candidate_20261112.zip, baseline 0531bca. Đã kiểm tra toàn bộ SHA256 theo manifest và phạm vi 39 file frontend được tạo/sửa bởi gói. Không chạy CLI apply có sẵn; dùng các hàm chuyển đổi đã đọc, kiểm tra đủ điểm chèn trước khi ghi, lưu hash và bản sao trước tích hợp.

## Phân biệt hai bộ màn hình

Ảnh “Thiết kế đề xuất cho Module M01–M02” có 11 màn/trạng thái thuộc phần A: đăng nhập, tài khoản, danh sách địa chỉ, thêm/sửa địa chỉ; Home, danh sách món, tìm kiếm/lọc, chi tiết quán, chi tiết món, yêu thích và giỏ hàng. Danh sách và tìm kiếm dùng chung CatalogScreen; địa chỉ/thêm sửa dùng chung AddressesScreen.

Đây là bộ khác với GUI-01–13 của giảng viên trong SRS. Không dùng số thứ tự trong ảnh A để thay thế GUI-06–13 đã hoàn thiện. Giữ nguyên mã màn và nghiệp vụ M03–M05, bao gồm checkout, trạng thái đơn, theo dõi, chat, đánh giá, gọi và ảnh cũ của các caller không truyền tên món.

## Thay đổi được nhận

- Thêm ảnh món minh họa, FoodCard/RestaurantCard, ánh xạ ảnh theo mã hoặc tên mẫu tường minh. Mã lạ dùng placeholder.
- Home có tìm kiếm và danh sách khám phá; quán có thực đơn; chi tiết món/giỏ/yêu thích có ảnh; tài khoản/địa chỉ được bổ sung trình bày.
- Đăng nhập có nút hiện/ẩn mật khẩu và giữ lựa chọn món khi quay lại sau đăng nhập.
- Demo catalog là phần xem trước, không tạo món giả trong giỏ thật. Chế độ API vẫn dùng services, authentication, cart journal và giá từ BE hiện có.
- Chỉnh câu chữ kỹ thuật mới trong UI; sửa chiều cao thanh danh mục và reset trạng thái catalog demo khi đổi route.
- TypeScript bỏ qua thư mục build/backup dist-* như ESLint để không kiểm tra bản sao source trong artifact.

Gói A là candidate, code không tái hiện hoàn toàn từng chi tiết/pixel của ảnh 11 màn. Kết quả này tích hợp các thay đổi code của gói; không tuyên bố ảnh thiết kế chính là ảnh app đã chạy. Các ảnh JPEG trong gói là minh họa do A cung cấp, không phải ảnh chụp quán; không phát sinh ảnh AI mới trong lần tích hợp.

## Kiểm chứng

125 tests PASS, 0 FAIL, 0 SKIP; TypeScript và ESLint PASS; export Android/iOS/web PASS. Kiểm tra trình duyệt 390×844 với BE riêng 18086, FE 18088 và schema fooddriver_it_m01_m05, không bật seed và không dùng DB fooddriver.

Đã thử: Home đọc catalog; tìm cơm gà; xem ảnh và tùy chọn món; guest chuyển đăng nhập với size/topping/số lượng giữ nguyên; hiện/ẩn mật khẩu rồi đăng nhập customer-2; thêm 2 phần vào giỏ; xem thực đơn quán; lưu và xem yêu thích; xem/sửa form địa chỉ; giỏ nối sang checkout hiện tại, tổng 230.000 + 15.000 = 245.000. Không đặt thêm đơn hoặc thay địa chỉ trong lần QA này. Mã các màn M03–M05 được đối chiếu hash với project gốc trước khi phát hành.

Đã phát hành 40 file frontend và báo cáo vào project gốc ổ D sau khi kiểm tra nội dung M03–M05 trùng nhau (bỏ qua khác biệt CRLF/LF), đối chiếu baseline và hash sau sao chép. Có bản sao lưu tại .runtime/m01-m02-before-publish trong worktree triển khai.

Ảnh kiểm tra tại output/m01-m02-integration trong worktree triển khai. Chưa thử lại trên Expo Go thiết bị thật. Không sửa BE, migration, local secrets hoặc push Git.
