# Bộ dữ liệu demo mở rộng — 12/11/2026

Yêu cầu: bổ sung nhiều dữ liệu thực tế để demo FoodGo; không sửa các lỗi UI đang được review ở lượt trước.

- Thêm 10 quán hư cấu gắn nhãn [Mẫu], mỗi quán10 món Việt giá hợp lý, tùy chọn và ưu đãi.
- Thêm tài khoản riêng:30 khách,20 tài xế,10 quản lý quán. Không đổi credential/giỏ/đơn của tài khoản có sẵn.
- Tạo120 đơn bằng Cart/Checkout/Restaurant/Driver/Communication service, đủ các trạng thái và tiền/option snapshot. Lịch sử giả lập có mốc thời gian nhất quán; không coi là giao dịch thật.
- Dữ liệu có tin nhắn hai chiều, đánh giá sau giao thành công, lý do hủy/từ chối và trở ngại đã xử lý.
- Seed mở rộng là tùy chọn one-shot, mặc định tắt. Một transaction toàn bộ dữ liệu và marker ổn định, chạy lại không thêm bản sao hoặc phục hồi giỏ đã bị người dùng sửa.
- Test trên database `fooddriver_it_*` trước, so fingerprint dữ liệu cũ ở `fooddriver` sau khi nạp, đọc kiểm tra qua API đang chạy.
- Không reset/drop/truncate hay thay schema. Chỉ đưa thêm class seed và tài liệu vào project đích; không dừng IDE đang chạy.

Kết quả: đã nạp120 đơn và các bảng liên quan vào fooddriver; đối soát48 dòng cũ giữ nguyên; regression61 tests qua. Đã kiểm tra API tài khoản sample.customer29/sample.restaurant09/sample.driver05. Chi tiết số lượng/tài khoản/lệnh nạp lại ở RICH_SAMPLE_DATA.md.

Quyết định sau review: dùng code MAUALL10 riêng để tránh trùng MAU10 theo quán; gán timestamp nhận offer bằng assigned_at, EXPIRED sau expires_at. Dispatch vẫn theo nghiệp vụ thật nên có thể thêm offer lịch sử REVOKED/EXPIRED tham chiếu tài xế cũ, nhưng không đổi record cũ/active_order_id hoặc để lại offer còn hiệu lực cho họ.
