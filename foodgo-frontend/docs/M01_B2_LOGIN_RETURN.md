# M01-B2 — quay lại sau đăng nhập

> Tài liệu này ghi phạm vi gói M01-B2 trước khi nối M02. Ngày 12/11/2026 đã bổ sung catalog/food/restaurant/cart vào allowlist và nối API thật; xem [bàn giao hiện hành](../../docs/M01_M02_HANDOVER.md) và [demo](M01_M02_DEMO.md). Những mục “chưa có M02” bên dưới là lịch sử gói B2.

Căn cứ: SRS 1.5.1, UC-01 (3.3.5), quyền Guest 3.2.4; đối chiếu bản Requirement_Analysis_Food_Delivery_App_09.docx của nhóm. Không đổi hợp đồng username/password hiện tại để tự diễn giải lại trường email trong tài liệu.

## Hành vi và điểm nối

LoginScreen dùng loginReturn.ts để lọc returnTo trước khi gọi Expo Router. AppProvider.login trả phiên đã xác minh để chọn đích theo role thực tế. Nhà hàng/tài xế luôn về `/` và dùng index.tsx hiện có để phân nhánh công việc.

Allowlist hiện tại: home/account/orders/favorites/inbox (canonical tab group), checkout/review; các route động orders/conversations/calls/reviews với ID chỉ gồm chữ, số, gạch ngang/gạch dưới, tối đa 80 ký tự. Đây là các màn đã tồn tại; API/RequireRole vẫn kiểm tra vai trò/quyền sở hữu, allowlist không cấp quyền dữ liệu.

Không nhận URL ngoài, login, đường dẫn công việc, đường dẫn chưa tồn tại, traversal, encoded path, backslash, fragment, khoảng trắng/control, tham số lặp hoặc query không cho phép. Không tin role, action, giá hay số lượng từ query. Hủy chỉ về home/account công khai, không về đơn/hộp thư/checkout đang được bảo vệ.

Home có lựa chọn bữa demo cố định `selection=demo-meal`: Guest bấm Chuẩn bị giỏ mẫu sẽ mở login với lựa chọn này; Customer quay về preview và phải bấm lại để xác nhận. Lựa chọn không còn hỗ trợ bị bỏ; API mode không giữ lựa chọn demo. Không có thao tác tự thêm giỏ/yêu thích/đơn sau login.

Home, Account và RequireRole mở đăng nhập qua cùng helper. Login có Hủy/nút Quay lại; usePreventRemove của Expo SDK 58 chặn Back/pop để đi về nội dung công khai. Hủy request đang chờ tăng intent của controller, nên response muộn không kích hoạt phiên/lưu token mới. Nếu save đã bắt đầu thì cleanup có điều kiện; lỗi cleanup được báo mà không kích hoạt user đã hủy. Chốt generation/hàng đợi token của M01-B1 tiếp tục dùng.

Một request login đã gửi có thể đã tạo auth session phía server trước khi bị hủy; client không thể khẳng định request mạng đã được rollback. Phạm vi bảo đảm ở đây là không công bố phiên đã hủy và không tự ghi giỏ/yêu thích/đơn; không thay API để giải quyết auth session chưa nhận được.

## Giới hạn M02

Chưa có màn danh mục/chi tiết món, form chọn option/quantity/note hoặc favorite thực tế. Không tạo các màn đó trong gói này. Lựa chọn demo được kiểm tra theo bộ lựa chọn hiện có; chưa thể kiểm tra lại tình trạng món/giá/option từ catalog BE. Khi nối M02 cần bổ sung route allowlist cụ thể, giữ bản nháp công khai chỉ gồm lựa chọn được hỗ trợ, tải lại dữ liệu có thẩm quyền và loại lựa chọn hết hiệu lực trước khi yêu cầu khách xác nhận. Không replay action sau login.

## Kiểm thử thủ công bổ sung

1. Guest ở Trang chủ: bấm Chuẩn bị giỏ mẫu → login → Customer; kiểm tra preview còn lựa chọn, chưa tự chạy thao tác thêm. Bấm lại mới được chuẩn bị giỏ.
2. Hủy bằng nút Hủy, Quay lại, Android Back và browser Back từ login; phải về home/account công khai, không tạo nghiệp vụ ghi.
3. Guest mở Yêu thích/Đơn hàng/Hộp thư → login → Customer; trở về đúng màn. Hủy về home. M02 favorites hiện chỉ là placeholder.
4. Đăng nhập Restaurant/Driver từ cùng lời mời → đúng màn công việc qua index.tsx.
5. Thử returnTo URL ngoài, /login, /driver khi login Customer, duplicate query và lựa chọn demo không tồn tại; phải fallback nội bộ hoặc bỏ lựa chọn.
6. API mode: thử sai mật khẩu, mất mạng, hủy khi response/save đang chờ; không phát sinh thao tác ghi giỏ/đơn và không kích hoạt kết quả cũ. Không gửi credential vào báo cáo.
7. Android/iOS thật: xác minh nút Back/gesture, SecureStore, keyboard và focus. Node test hoặc UI web không thay thế kiểm thử này.

Kết quả chạy theo từng lượt và ảnh UI lưu ngoài repository trong reports; không gắn đường dẫn máy cá nhân vào cấu hình/tài liệu dùng chung này.
