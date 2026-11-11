# Kế hoạch frontend M03 M04 M05

Ngày 10/11/2026. Đích bàn giao: `D:/TrenLop/Mobile/DeTai/Nop/FoodGoApp/foodgo-frontend`. Cơ sở: SRS 1.5.1, SDS chi tiết 2.1.1, mẫu UI G2 của A và mẫu panda đã duyệt. Repo hiện là Expo SDK 58 starter, chưa có backend/M01/M02. Làm trong bản sao riêng để kiểm tra trước khi đồng bộ về đích; không thay file người dùng sửa trong lúc làm.

## Thiết kế thực hiện

Giữ Expo SDK 58 và route trong src/app theo AGENTS.md. Dùng React Native, Expo Router, SafeArea và Reanimated đã có; bổ sung SecureStore và AsyncStorage theo SDK cho phiên/bản nháp. Feature: account (cầu nối phiên), checkout, orders, delivery, communication. Shared: theme, components, API, storage, types, hooks. Không viết lại đầy đủ M01/M02; có giỏ/địa chỉ mẫu trong chế độ demo và hợp đồng nối các API M01/M02 thực.

Hai transport cùng giao diện: demo có nhãn rõ và lưu dữ liệu diễn tập; HTTP gọi /api/v1 theo SDS, không fallback khi lỗi. Không có backend nên kiểm chứng API thực sẽ là hạng mục tích hợp sau, không báo giả là đã hoàn thành end-to-end với MariaDB. Chuyển vai trò chỉ ở màn công cụ demo; ở API, vai trò đến từ đăng nhập và /auth/me.

Nhận diện: nền #FBFAF6, chữ #163B36, teal #006C59, mint #E5F3EB, cam nhấn. Chữ hệ thống dễ đọc; nội dung canh trái, khoảng cách 4/8/12/16/20/24, bo góc 12/14/20. Panda xuất hiện ở lời chào, empty và success; form và màn công việc ưu tiên dữ liệu. Bản đồ và gọi luôn ghi mô phỏng, không yêu cầu vị trí/mic/camera.

## 1 Nền tảng và hợp đồng

- Tạo shared/types cho user, cart, quote, attempt, order, dispatch, conversation/message/review.
- Tạo HTTP client timeout, Bearer token, error envelope, phân trang và cấu hình API base URL.
- Tạo transport demo riêng, ID và dữ liệu xác định; test quy tắc tiền, state, ownership, retry trước khi cài đặt.
- Phiên RESTORING/GUEST/AUTHENTICATED; bảo vệ route theo role. AsyncStorage cho draft theo user, SecureStore cho token native; web chỉ phiên bộ nhớ khi cần.
- UI kit nút/text/input/card/chip/loading/empty/error, panda và map mô phỏng. Hook query chỉ cập nhật/poll khi màn focus và AppState active; cleanup khi rời.

## 2 M03 Đặt và theo dõi đơn UC08 UC09 UC10

- Checkout: snapshot giỏ từ API-18, địa chỉ API-04, ưu đãi API-14; chọn tối đa một offer, COD/MOCK_WALLET, quote API-23.
- Quote đổi/hết hạn cần xác nhận lại; UI hiển thị tiền từ quote server. Chặn bấm lặp, lưu key trước request, tra API-26 sau timeout; không tạo key mới khi kết quả chưa rõ.
- Pending ví đọc/resolve/cancel qua API-25/27/28; chưa có order khi PENDING/FAILED/CANCELLED.
- Danh sách đơn có filter và phân trang API-29. Chi tiết API-30 và tracking API-33; phân biệt trạng thái nấu, tìm tài xế, giao và payment.
- Hủy API-31 chỉ trước nhận; tìm lại API-32 giữ orderId khi NO_DRIVER. Giữ giỏ khi đặt chưa thành công, hiển thị stale/last updated khi mất mạng.

## 3 M04 Xử lý và giao UC11 UC12 UC13

- Hàng đợi quán API-34, chi tiết và accept/reject/prepare/ready API-35–38. Từ chối bắt buộc lý do; xử lý 409 bằng tải lại dữ liệu.
- Offers API-39 chỉ có quán/khu vực/COD; accept/decline API-40/41. Không lộ khách trước khi nhận.
- Công việc tài xế API-51; pickup API-42 chỉ khi READY + assigned; deliver API-43 chỉ khi đang giao, checkbox COD theo phương thức.
- Ghi trở ngại API-50 với key, không tự delivered/paid. Khi xác nhận giao thành công cần thao tác xác nhận; không dùng animation/timer để đổi nghiệp vụ.

## 4 M05 Liên hệ và đánh giá UC14 UC15 UC16

- Inbox nối orders có hội thoại; quyền conversation API-47, lịch sử cursor API-48, tin text/ảnh mẫu API-49. Mỗi tin UUID, retry cùng key, không nhân đôi.
- Tin nháp theo user+order, phục hồi sau mở lại; terminal chỉ đọc và không gửi nháp tự động. Theo dõi quyền khi poll.
- Call API-44 trước mở; mô phỏng DIALING/CONNECTED/NO_ANSWER/FAILED/ENDED, mic/loa local, timer chỉ khi kết nối và cleanup. Kiểm tra quyền định kỳ, dừng khi đơn kết thúc/rời màn/background.
- Review API-46/45: đúng chủ delivered, sao 1–5, tag allowlist, note <=300, một review/order; retry đọc lại tránh tạo lại. Không gửi customerId/driverId từ app.

## 5 Kiểm chứng và bàn giao

- Unit/contract tests bằng Node test cho demo engine và HTTP adapter: tiền chuẩn, quote/idempotency, hủy/nhận, privacy offers, COD, issue, terminal chat/call, review, no fake API fallback.
- Typecheck, lint theo AGENTS.md; Expo export web và Android/iOS để bắt lỗi route/import/tài nguyên.
- Kiểm tra UI ở khung mobile: checkout, order, restaurant queue, driver offers/task, chat/call/review, Guest/role gate và lỗi/rỗng.
- README, env example, hướng dẫn demo liên vai trò, bảng UC/GUI và giới hạn tích hợp/thiết bị. Không tuyên bố đã chạy Android/iPhone thật nếu chỉ kiểm được bundle/web.
- Đồng bộ file đã kiểm chứng về đích với bản sao lưu file thay đổi và kiểm tra baseline hash, không ghi đè chỉnh sửa đồng thời; giữ .git và AGENTS.md.

## Nhật ký

- Đã đọc AGENTS.md và tài liệu Expo SDK 58/Router/SecureStore/Reanimated, nguồn UI A, API-23–51 SDS.
- Quyết định: demo là công cụ diễn tập có nhãn, không biến role picker thành quyền API; cầu nối M01/M02 giới hạn dữ liệu đầu vào cho M03.
- Đã triển khai nền tảng và các phần M03, M04, M05 trong phạm vi frontend/demo và wiring HTTP mô tả ở trên.
- Kiểm chứng cuối: typecheck và lint đạt; 19/19 test đạt; export web/Android/iOS đạt. Luồng demo đã thử xuyên vai trò và kiểm tra tách dữ liệu khi đổi khách.
- Chi tiết kết quả nằm trong VERIFICATION.md; truy vết UC/GUI/API và phần tích hợp còn lại nằm trong M03_M04_M05_HANDOFF.md. Backend thật và thiết bị Android/iOS thật chưa được kiểm chứng.
