# FoodGo

Ứng dụng đặt và giao đồ ăn của nhóm, gồm frontend Expo/React Native và backend Spring Boot/MariaDB.

| Thư mục | Nội dung |
|---|---|
| [foodgo-frontend](foodgo-frontend/README.md) | Ứng dụng mobile và giao diện các vai trò, mascot panda, chế độ demo và lớp gọi API |
| [foodgo-backend](foodgo-backend/README.md) | Khung backend theo module, code nền, schema MariaDB và hướng dẫn chạy |

## Trạng thái bàn giao

Frontend có các luồng M03–M05 ở chế độ demo và phần gọi API. Backend hiện là **khung và code nền**, chưa hoàn tất nghiệp vụ M01–M05; chưa có seed tài khoản/dữ liệu mẫu. Chưa thể coi đây là một hệ thống FE–BE hoàn chỉnh.

Thành viên nhận backend M01–M02 đọc [hướng dẫn bàn giao](foodgo-backend/docs/HANDOFF_M01_M02.md) và [kiến trúc](foodgo-backend/docs/ARCHITECTURE.md). M01 thuộc `account`, M02 thuộc `catalog` và `cart`; M03–M05 lần lượt thuộc `ordering`, `fulfillment`, `communication`.

## Frontend

```powershell
cd foodgo-frontend
npm ci
npx expo start
```

Mặc định dùng demo. Xem `.env.example` và README frontend khi cấu hình chế độ API. Điện thoại dùng địa chỉ LAN của máy chạy backend, không dùng `localhost`. Không đưa secret vào biến `EXPO_PUBLIC_*` vì chúng được đóng gói vào ứng dụng.

## Backend

Cần JDK 21 và MariaDB. Tạo database `fooddriver`; sao chép `application-local.properties.example` thành `application-local.properties` trong thư mục backend và điền tài khoản MariaDB cá nhân. Không ghi đè file local đã cấu hình.

```powershell
cd foodgo-backend
.\mvnw.cmd spring-boot:run
```

Kiểm tra `http://localhost:8080/api/v1/health`. Flyway áp dụng migration khi chạy. Không sửa V1 đã áp dụng; thay đổi schema bằng migration mới.

## Kiểm tra trước khi gửi thay đổi

Frontend: `npm test`, `npm run lint`, `npm run typecheck`.

Backend: `mvnw.cmd test` (cần MariaDB và cấu hình local). Dùng database kiểm thử riêng khi bổ sung test ghi dữ liệu.

## Làm việc nhóm

Tạo nhánh riêng theo phần việc, ví dụ `feature/be-m01-m02`. Thống nhất API, mã trạng thái và migration trước khi merge. Không commit mật khẩu, `.env`, file cấu hình local, `node_modules`, `target`, log hoặc dữ liệu runtime. Mỗi thành viên tự thiết lập cấu hình local từ file mẫu.
