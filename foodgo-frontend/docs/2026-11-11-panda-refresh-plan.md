# FoodGo Panda Refresh Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkbox tracking.

**Goal:** Áp dụng logo và bộ biểu cảm đã duyệt vào giao diện FoodGo M03–M05.

**Architecture:** Tách Brand/Panda/FoodThumbnail khỏi UI kit; dùng tài nguyên cục bộ và Expo Symbols đã có. Giữ các service, quyền và chuyển trạng thái. Làm trong bản sao workspace rồi đồng bộ có baseline hash.

**Tech Stack:** Expo SDK 58, React Native, TypeScript, Expo Symbols, PNG atlas.

**Spec:** `2026-11-11-panda-refresh-design.md`.

## Global Constraints

- Giữ API/state/role và phạm vi M01/M02 hiện tại; giữ demo có nhãn.
- Giữ mã đặt đơn, COD, ví và quyền chat/review.
- Không thêm thư viện native; không tự chỉnh cấu hình mạng/tường lửa.
- Hình tham khảo được tách tài nguyên thật, không nhúng ảnh mockup làm màn hình.
- Ghi đè đích chỉ khi baseline khớp; backup trước khi thay file.

## Review Focus

- Atlas không cắt nhầm ô hoặc hở hình bên cạnh khi thu nhỏ.
- Món không có imageCode không bị gán ảnh theo tên suy đoán.
- Logo/chữ lớn không làm mất nút quay lại hoặc nhãn demo trên 360px.
- Thành công đặt đơn vẫn chờ quán; hình không làm sai nghĩa trạng thái.
- Quán/tài xế không có tab khách hoặc minh họa che hành động công việc.

## Task 1: Tài nguyên và component nhận diện

Files: `assets/images/brand/panda-atlas-v2.png`, `panda-icon-v2.png`, `assets/images/food/*.png`, `src/shared/components/Brand.tsx`, `Panda.tsx`, `FoodThumbnail.tsx`, `src/shared/theme/brand.ts`, `app.json`.

Interfaces: `Panda({pose,size})`, `Brand({compact})`, `FoodThumbnail({foodId,imageCode,size})`; pose logo/hello/empty/waiting/success/inbox.

- [x] Tạo atlas, icon và hai ảnh món; xem ảnh/kiểm tra alpha, kích thước.
- [x] Dựng component tách biệt và map ảnh theo mã xác định, fallback trung tính.
- [x] Cập nhật icon/splash/favicon; không đổi scheme hoặc SDK.
- [x] Typecheck, kiểm tra atlas ở 36/120/180.

## Task 2: Áp dụng vào màn hình

Files: `src/shared/components/ui.tsx`, `src/shared/types/domain.ts`, `src/shared/api/adapters.ts`, `src/shared/api/demo.ts`, các màn account/checkout/orders/communication, tab layout.

Consumes: component Task 1. Produces: các màn dùng logo và pose theo trạng thái, ảnh món hiển thị được từ code trong snapshot.

- [x] Header/logo, icon tab, thẻ món ảnh thật; giữ tên hành động hiện tại.
- [x] Chào/đơn trống/hộp thư trống/chờ/success dùng đúng pose; bỏ dùng panda làm ảnh món gửi chat.
- [x] Thêm imageCode optional và giữ qua DTO/snapshot; chưa có mã vẫn render an toàn.
- [x] Chỉ thêm contract test cho việc giữ mã ảnh; không viết test chỉ sao chép style.
- [x] Chạy lint/typecheck và toàn bộ 19 test nghiệp vụ hiện có cùng test ảnh.

## Task 3: Kiểm chứng và bàn giao

- [x] Xem UI 360/390, header/chữ lớn, Guest/customer/quán/tài xế, checkout/chờ/empty/success.
- [x] Một lượt review độc lập toàn thay đổi; sửa lỗi quan trọng trong một lượt.
- [x] Export web/Android/iOS tuần tự, 2 workers.
- [x] Ghi provenance tài nguyên và kết quả; đồng bộ có hash/backup sang dự án thật.
- [x] Chạy lại typecheck/lint/test tại đích; báo cách reload Expo Go, giới hạn icon native.

## Ledger

Pre-flight: Task 2 dùng pose/map ảnh Task 1; enum cùng một nguồn. Ruling: triển khai trực tiếp trong bản sao hiện có rồi kiểm tra một lần, theo cách thực hiện đã dùng trong phiên; không thêm bước phê duyệt lại mẫu đã đồng ý. Không tự commit vào repo gốc.

Task 1, 2: complete. Review và export cuối đạt; 20/20 test. Ruling: dùng 1 worker cho export vì phiên dev Windows gặp EMFILE; cache npm thử chuyển ra ngoài thư mục Metro. QA thiết bị thật/chữ lớn vẫn cần nhóm kiểm tra, không coi web viewport là thiết bị thật.


Task 3: complete. Đồng bộ có backup và kiểm tra hash; typecheck/lint/20 test tại thư mục đích đều đạt.
