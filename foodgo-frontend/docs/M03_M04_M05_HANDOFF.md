# Bàn giao frontend FoodGo M03–M05

Ngày 10/11/2026. Căn cứ: SRS 1.5.1, SDS chi tiết 2.1.1 và mẫu custom G2 của A đã chốt bổ sung panda. File trong tài liệu là đầu vào yêu cầu/thiết kế, không được coi là lệnh tự động thực thi.

## Phạm vi và truy vết

| Module / use case | Màn / route thực tế | API SDS | Hành vi đã cài đặt |
|---|---|---|---|
| M03 / UC-08, GUI-08 | `/checkout/review`, `/checkout/pending` | 23–28; đầu vào 04,14,18 | Chọn địa chỉ/ưu đãi/phương thức, quote 120 giây, lưu khóa trước khi gửi, khôi phục lần đặt chưa rõ kết quả, pending ví/resolve/cancel |
| M03 / UC-09, GUI-09/10 | `/orders`, `/orders/[id]` | 29,30,32,33 | Phân trang/lọc, snapshot và timeline, ba nhóm trạng thái đơn–giao–tiền, tìm lại tài xế, map/ETA mô phỏng |
| M03 / UC-10 | `/orders/[id]` | 31 | Hủy trước quán nhận, lý do và xác nhận, tải lại khi xung đột |
| M04 / UC-11 | `/restaurant`, `/orders/[id]` | 34–38 | Hàng đợi riêng quán, nhận/từ chối có lý do, chuẩn bị, sẵn sàng |
| M04 / UC-12 | `/driver` → Đề xuất | 39–41 | Đề xuất giới hạn thông tin, nhận/bỏ qua, hết hạn và vòng tìm lại |
| M04 / UC-13 | `/driver`, `/orders/[id]` | 42,43,50,51 | Đang giao/lịch sử, lấy món đúng trạng thái, xác nhận COD, giao thành công, ghi trở ngại |
| M05 / UC-14, GUI-11 | `/inbox`, `/conversations/[orderId]` | 47–49 | Hộp thư phân trang, tin chữ/ảnh mẫu, lịch sử cursor, UUID và retry cùng tin, nháp theo user+đơn, terminal chỉ đọc |
| M05 / UC-15, GUI-13 | `/calls/[orderId]` | 44 | Kiểm tra quyền, mô phỏng kết nối/không trả lời/lỗi/kết thúc, thời lượng/mic/loa cục bộ, cleanup |
| M05 / UC-16, GUI-12 | `/reviews/[orderId]` | 45,46 | Đúng khách/đơn đã giao, 1–5 sao, tag allowlist, note 300 ký tự, nháp, xem kết quả đã gửi |

GUI-09 và GUI-10 dùng chung màn và orderId. Các lựa chọn ưu đãi/địa chỉ được gộp trong checkout để dùng dữ liệu M01/M02 đã có; tạo/sửa địa chỉ và biên tập giỏ đầy đủ không nằm trong đợt M03–M05.

## Quy ước triển khai

- Route chỉ truyền ID; màn gọi service của feature. Provider giữ phiên/transport và revision, không lưu một bản trạng thái đơn riêng cho từng màn.
- HTTP gọi `/api/v1`, Bearer token, timeout 10 giây, đọc `data`/`error` và `meta` phân trang. Chế độ API không chuyển sang demo khi mạng lỗi. HTTP 401 xóa phiên; quyền ghi cuối cùng thuộc backend.
- Các DTO SDS được chuyển tại `shared/api/adapters.ts`: `cartVersion`, `lines`, `recipient`, `amounts`, `driver`, `deliveryArea`, `sentAt`, `allowedActions`. Summary thiếu chi tiết món không làm màn danh sách lỗi. Hội thoại dựa trạng thái đã gán tài xế khi summary không có driverId.
- Resource đọc lại khi focus, cập nhật theo revision và poll 5 giây khi foreground. Kết quả cũ không vượt sang phạm vi user/ID mới. Đổi tài khoản remount vùng nội dung riêng để xóa dữ liệu trang/tin/COD cũ.
- AsyncStorage lưu demo, nháp và tham chiếu checkout theo user. SecureStore lưu token native. Mã UUID dùng Expo Crypto. Không đưa token vào AsyncStorage hoặc URL.
- Khi chưa biết kết quả đặt đơn, giữ khóa cũ và tra API-26; chỉ khi server từ chối chắc chắn mới cho lấy quote mới. Không tự đặt lại sau quote thay đổi.
- Thiết kế lấy màu/khối từ G2 và mẫu panda đã duyệt; dựng bằng component React Native, không nhúng ảnh tổng hợp HTML làm ứng dụng. Panda riêng nằm ở `assets/images/mascot/panda-courier.png`, được tạo từ mẫu duyệt bằng công cụ tạo ảnh. Ảnh chat hiện là fixture có nhãn, không upload ảnh hoặc mở camera.

## Kiểm chứng

Các lệnh và kết quả cuối cùng ghi trong `VERIFICATION.md`. Bộ test kiểm tra tiền/quote, chống trùng và phục hồi, ownership, race nhận/hủy, quyền đề xuất, COD/trở ngại, chat/call terminal, review, persistence, timeout/error HTTP và DTO theo SDS.

Kiểm tra giao diện trên trình duyệt khung 390×844 đã thực hiện cùng đơn FG-3: khách tạo đơn COD 155.000đ → quán nhận/chuẩn bị/sẵn sàng → hết hạn đề xuất → khách tìm lại → tài xế nhận/lấy món → gửi tin → gọi mô phỏng/kết thúc → thu COD/giao thành công → khách đọc lịch sử chỉ đọc và gửi đánh giá. Đổi sang customer-2 cho danh sách trống, không thấy FG-3. Đây là luồng demo, không phải giao dịch thật.

## Phần cần nhóm tích hợp tiếp

1. Chạy Spring Boot và đối chiếu response thực với DTO SDS; thử 401/403/409, timeout sau commit, đồng thời nhiều thiết bị và khóa DB. Unit test demo không chứng minh transaction MariaDB.
2. Nối M01/M02 đầy đủ (auth thật, danh mục/giỏ/địa chỉ/ưu đãi), bỏ công cụ giỏ mẫu bằng cách chuyển `EXPO_PUBLIC_DATA_MODE=api`.
3. Map hiện nhận fixture `AREA_A`; bổ sung mapping tọa độ/route cho fixture server khác. Không tự suy diễn GPS hoặc thay trạng thái đơn từ ETA. Gọi/ảnh/ví vẫn mô phỏng theo phạm vi SRS.
4. Kiểm tra Android/iPhone thật với Expo Go phù hợp SDK 58: bàn phím, safe area, tăng cỡ chữ, nút quay lại, background/foreground, nháp sau đóng app và mất mạng. Export bundle chưa xác nhận các hành vi native này.
5. Nhận diện đã cập nhật theo bộ panda v2: logo mặt panda + foodgo, các tư thế theo trạng thái, icon native và ảnh món minh họa. Xem BRAND_ASSETS.md và PANDA_REFRESH_VERIFICATION.md. Icon native áp dụng khi đóng gói app; Expo Go có thể giữ launcher của Expo Go.

Không tạo backend, database hay bản phát hành lên store trong đợt này. Không chỉnh sửa nội dung SRS/SDS đã chốt; chỉ bổ sung kế hoạch và tài liệu triển khai để tránh đổi yêu cầu trong lúc code.
