# Kiến trúc backend và quy ước làm việc

Giữ package gốc `fit.iuh.foodgobackend` để Spring Boot quét component. Cấu trúc theo nghiệp vụ bám SDS 2.1.1; M01 là `account`, M02 là `catalog` và `cart`, M03 là `ordering`, M04 là `fulfillment`, M05 là `communication`.

## Tổ chức bên trong một module

Với số lượng lớp hiện tại, đặt các lớp ngay trong package nghiệp vụ:

```text
account/
  AuthController.java       # HTTP, validation đầu vào, trả envelope
  AuthService.java          # Transaction và quy tắc xác thực
  AccountRepository.java    # Truy vấn dữ liệu
  UserPrincipal.java        # Người dùng đã xác thực từ server
  AddressController.java
  AddressService.java
  package-info.java
```

Thêm DTO bằng record/lớp có tên rõ nghĩa khi cần. Khi module lớn, có thể tách `controller/`, `dto/`, `service/`, `repository/`, `entity/` bên trong chính module đó. Chưa tạo hàng loạt lớp hoặc tầng rỗng. Không tạo một thư mục `service/` chung gom nghiệp vụ của cả năm module.

## Phụ thuộc

- Controller gọi service; service giữ transaction, kiểm tra quyền và gọi repository. Không gọi controller module khác.
- `account` cung cấp `UserPrincipal`, `AuthService`, `AddressService`.
- `catalog` cung cấp `CatalogService`, `PricingService`; `cart` sử dụng cùng bộ tính giá.
- M03 sử dụng giỏ/version và pricing của M02, không tự viết một bộ tính giá khác.
- M03/M04 dùng chung `OrderPolicy`. M05 cần kiểm tra quyền theo đơn từ phần ordering khi triển khai.
- `JpaSql` là hỗ trợ EntityManager cho native SQL và khóa dòng. Phần nền hiện tại có truy vấn trực tiếp trong service; khi mở rộng, chuyển truy vấn vào repository của module, giữ nguyên API service đang dùng.
- `common` không chứa nghiệp vụ đơn hàng. `config` chỉ chứa cấu hình ứng dụng. `bootstrap` chỉ dành cho dữ liệu khởi tạo local có điều kiện.

## Hợp đồng dùng chung

| Nội dung | Quy ước |
|---|---|
| URL | `/api/v1/...` |
| Thành công | `{"data": ...}` |
| Danh sách phân trang | `{"data": [], "meta": {"page": 0, "size": 20, "hasNext": false}}` |
| Lỗi | `{"error": {"code": "...", "message": "..."}}` |
| ID JSON | Chuỗi; ID trong database là BIGINT |
| Tiền | Số nguyên VND; giá được tính lại ở server |
| Thời gian | Lưu UTC; JSON theo ISO 8601 |
| Phân quyền | Lấy người dùng từ `@AuthenticationPrincipal`, không tin userId/role từ body |
| Xác thực | Bearer token ngẫu nhiên; database chỉ giữ token hash; mật khẩu BCrypt |
| Ghi dữ liệu | Service có transaction; payload idempotency và version theo SRS/SDS |

`SecurityConfig` hiện cho phép health, login và catalog công khai; các API còn lại yêu cầu token. Bổ sung API đăng ký/khôi phục mật khẩu nếu SRS yêu cầu phải cập nhật quyền truy cập tương ứng và kiểm thử, không mở công khai toàn bộ `/api/v1/**`.

## Database và phối hợp nhóm

V1 đã được áp dụng thành công vào `fooddriver`. Không chỉnh V1 hoặc tắt kiểm tra checksum. Thống nhất số migration trước khi làm song song để tránh trùng V2. Sửa schema bằng migration mới, không sửa trực tiếp database rồi quên cập nhật source.

`users.restaurant_id`, `users.driver_area_code`, `users.active_order_id` phục vụ M04; `orders` giữ trạng thái thanh toán/giao hàng. M01 không được xóa các cột này khi sửa user. Không thêm các bảng payments, assignments hoặc conversations khác với SDS mà chưa thống nhất lại thiết kế.

Thành viên M01–M02 làm nhánh `feature/be-m01-m02`; thành viên M03–M05 làm nhánh riêng. Đổi interface dùng chung, migration hoặc `SecurityConfig` cần trao đổi trong nhóm trước khi merge. Mỗi PR ghi API thay đổi và lệnh kiểm thử đã chạy.
