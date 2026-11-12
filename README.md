# FoodGo

Ứng dụng đặt và giao đồ ăn của nhóm, gồm frontend Expo/React Native và backend Spring Boot/MariaDB.

| Thư mục | Nội dung |
|---|---|
| [foodgo-frontend](foodgo-frontend/README.md) | Ứng dụng mobile và giao diện các vai trò, mascot panda, chế độ demo và lớp gọi API |
| [foodgo-backend](foodgo-backend/README.md) | API M03–M05, nền M01–M02, schema MariaDB và seed local |

## Trạng thái bàn giao

M01–M02 giữ kết quả nghiệm thu riêng (backend45, FE67, web12 và Android do người dùng thao tác). Main đã bổ sung API checkout/order/fulfillment/communication M03–M05. Bản worktree tích hợp đang được kiểm tra độc lập; kết quả các nhánh trước không tự chứng minh FE–BE/DB/mobile của bản tích hợp đã đạt.

Đọc [bàn giao M01–M02](docs/M01_M02_HANDOVER.md), [runbook main](foodgo-backend/docs/API_FLOW_RUNBOOK.md), và [cách ly DB tích hợp](docs/INTEGRATION_M01_M05.md).

Thành viên nhận backend M01–M02 đọc [hướng dẫn bàn giao](foodgo-backend/docs/HANDOFF_M01_M02.md) và [kiến trúc](foodgo-backend/docs/ARCHITECTURE.md). M01 thuộc `account`, M02 thuộc `catalog` và `cart`; M03–M05 lần lượt thuộc `ordering`, `fulfillment`, `communication`.

## Frontend

```powershell
cd foodgo-frontend
npm ci
npx expo start
```

Mặc định dùng demo. Xem `.env.example` và README frontend khi cấu hình chế độ API. Điện thoại dùng địa chỉ LAN của máy chạy backend, không dùng `localhost`. Không đưa secret vào biến `EXPO_PUBLIC_*` vì chúng được đóng gói vào ứng dụng.

## Backend

Cần JDK 21+ và MariaDB (phiên nghiệm thu dùng JDK 22, pom target 21). Tạo database `fooddriver`; sao chép `application-local.properties.example` thành `application-local.properties` trong thư mục backend và điền tài khoản MariaDB cá nhân. Không ghi đè file local đã cấu hình.

```powershell
cd foodgo-backend
.\mvnw.cmd spring-boot:run
```

Kiểm tra `http://localhost:8080/api/v1/health`. Flyway áp dụng migration khi chạy. Không sửa V1 đã áp dụng; thay đổi schema bằng migration mới.

## Kiểm tra trước khi gửi thay đổi

Frontend: `npm test`, `npm run lint`, `npm run typecheck`.

Backend: bộ test context/HTTP bắt buộc database `fooddriver_m01_test` và account riêng qua guard/probe. Thiết lập đúng ba biến `FOODGO_TEST_DB_*` theo [bàn giao](docs/M01_M02_HANDOVER.md) trước khi chạy `mvnw.cmd test`; cấu hình local của ứng dụng không thay thế cấu hình test.

## Làm việc nhóm

Tạo nhánh riêng theo phần việc, ví dụ `feature/be-m01-m02`. Thống nhất API, mã trạng thái và migration trước khi merge. Không commit mật khẩu, `.env`, file cấu hình local, `node_modules`, `target`, log hoặc dữ liệu runtime. Mỗi thành viên tự thiết lập cấu hình local từ file mẫu.
