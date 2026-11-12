# Bàn giao M01–M02 — 12/11/2026

## Phạm vi và trạng thái

Ngày 12/11/2026, người dùng trực tiếp thao tác trên Android/Expo Go và xác nhận PASS: catalog/yêu thích/giỏ, địa chỉ, đóng/mở lại khôi phục phiên A, logout rồi đóng/mở lại vẫn Guest, login B không thấy dữ liệu riêng A. Đây là kết quả kiểm thử thủ công do người dùng cung cấp; ảnh tĩnh không tự chứng minh đầy đủ chuỗi restore hoặc tách dữ liệu A/B. Agent không nhận là đã tự điều khiển thiết bị.

M01: đăng nhập/khôi phục phiên/logout, quay lại sau đăng nhập, địa chỉ. M02: catalog/tìm/lọc/chi tiết, yêu thích, option/giá/giỏ/version/đổi quán. Giữ hợp đồng API, V1 và điểm nối PricingService/CartService cho nhóm.

| Cách chạy | FE | BE/DB | Mức xác minh |
|---|---|---|---|
| Demo frontend | DATA_MODE=demo | Không cần BE; dữ liệu mô phỏng | Không dùng làm bằng chứng FE–BE |
| Ứng dụng API thông thường | DATA_MODE=api, API_URL tới :8080/api/v1 | Spring Boot main, cấu hình local, database fooddriver | Hướng dẫn đối chiếu source; không chạy lại nghiệp vụ trên fooddriver trong lượt bàn giao |
| API kiểm thử có kiểm soát | DATA_MODE=api, API_URL tới :18080/api/v1 | TestServerLauncher, m01-test, fooddriver_m01_test, account riêng | 12 kịch bản Chrome/CDP PASS; backend 45 test PASS do người dùng chạy |

M03–M05 hiện giữ source/giao diện của nhóm. Chưa nhận checkout/đặt đơn/thanh toán/giao hàng/chat bằng API thật là hoàn tất. Demo M01–M02 kết thúc tại giỏ đã lưu.

## Prerequisites và source

- Node.js 24 (máy kiểm tra: 24.15.0), npm 11.12.1; npm ci dùng package-lock.json đã bàn giao. Expo ~58.0.23, React Native 0.88.1; giữ nguyên dependency/lockfile.
- JDK 22 tại máy kiểm tra; pom compile release 21. Đặt JAVA_HOME và Path trong terminal riêng, giữ Java 17 mặc định của máy. Máy khác có thể sửa đường dẫn JDK trong terminal.
- MariaDB 11.x (môi trường đã dùng 11.2.2), TCP 3306; quyền quản trị chỉ dùng để tạo schema/account riêng, không dùng account quản trị cho test.
- Lần cài mới cần mạng để Maven Wrapper tải Maven/dependency và npm ci tải dependency. Gói source không chứa cache, node_modules hoặc target.
- Mobile: Expo Go hỗ trợ SDK 58 hoặc development build phù hợp, điện thoại và máy tính cùng mạng. Xem [checklist mobile](M01_M02_MOBILE.md).

Giải nén source giữ cấu trúc foodgo-backend, foodgo-frontend, docs. Không dùng git archive HEAD làm nguồn bàn giao hiện tại: nhiều source mới chưa tracked. Manifest cuối phải lấy working tree cùng các file mới và đối chiếu SHA-256 trước đóng gói.

## 1. Chạy ứng dụng API thông thường

Phần này dành cho cấu hình ứng dụng thực của người nhận, không phải quy trình kiểm thử đã nghiệm thu. Không chạy thử nghiệm ghi dữ liệu bằng account/schema này.

1. Bảo đảm MariaDB đang chạy; database fooddriver và account ứng dụng riêng được quản trị viên cấp. Nếu máy mới hoàn toàn, quản trị viên có thể tạo schema trống bằng CREATE DATABASE IF NOT EXISTS fooddriver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci. Không DROP/TRUNCATE/reset schema đang có.
2. Trong foodgo-backend, nếu chưa có application-local.properties, sao chép application-local.properties.example bằng Copy-Item; nếu đã có thì giữ nguyên. Điền riêng URL, account ứng dụng và mật khẩu trên máy. Các tên property: spring.datasource.url, spring.datasource.username, spring.datasource.password. Không đưa file này vào gói nộp.
3. Terminal riêng trong foodgo-backend:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:FOODGO_SEED_ENABLED = 'false'
.\mvnw.cmd spring-boot:run
```

Cổng mặc định 8080 (FOODGO_PORT có thể đổi); Flyway chạy migration khi khởi động. V1 giữ nguyên; ddl-auto=none. Không bật seed trên fooddriver trong quy trình này. Health: http://127.0.0.1:8080/api/v1/health. Account đăng nhập/dữ liệu catalog do người vận hành cung cấp; database mới chưa có dữ liệu không đồng nghĩa app hỏng. Fixture local chỉ chạy khi profile local + opt-in rõ ràng, chưa được tự chạy vào fooddriver trong các lượt nghiệm thu.

4. Terminal FE: npm ci nếu chưa cài dependency, EXPO_NO_DOTENV=1, EXPO_PUBLIC_DATA_MODE=api, EXPO_PUBLIC_API_URL=http://127.0.0.1:8080/api/v1 cho web trên máy. Điện thoại thay loopback bằng LAN vừa xác minh. Dùng cổng Metro 8081 cho CORS mặc định của app thông thường. Khởi động bằng .\node_modules\.bin\expo.cmd start --lan --port 8081. Không trộn :8080/fooddriver với launcher kiểm thử :18080.

## 2. Tạo database/account kiểm thử riêng bằng HeidiSQL

Chỉ làm khi chưa có; môi trường đã nghiệm thu có schema/account riêng và đã bị từ chối truy cập fooddriver. Không tạo lại account, đổi mật khẩu hoặc cấp thêm quyền cho môi trường đã hoạt động nếu không cần.

1. Phiên quản trị trong HeidiSQL, kiểm tra: SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='fooddriver_m01_test';
2. Nếu thiếu, chạy:

```sql
CREATE DATABASE IF NOT EXISTS fooddriver_m01_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Tools → User manager → Add: chọn tên account test riêng (ví dụ foodgo_m01_test), host 127.0.0.1 cho JDBC TCP loopback. Tự nhập mật khẩu trong UI HeidiSQL; không ghi vào script, báo cáo hoặc chat. Nếu môi trường phân giải host thành localhost, quản trị viên đối chiếu account host thực tế và CURRENT_USER(); không cấp host '%' để xử lý tắt.
4. Chỉ cấp SELECT, INSERT, UPDATE, DELETE, CREATE trên fooddriver_m01_test.* cho V1/test hiện tại; không cấp global, fooddriver.*, ALL PRIVILEGES hoặc GRANT OPTION. Nếu engine/Flyway thực tế báo thiếu quyền DDL cụ thể, đọc đúng lỗi rồi cấp riêng quyền đó trên schema test; không mở rộng toàn server. Không cấp quyền DROP để clean/reset. Không sao chép mật khẩu/hash từ SHOW GRANTS vào evidence. V1 hiện chỉ CREATE TABLE với index bên trong; [MariaDB GRANT](https://mariadb.com/docs/server/reference/sql-statements/account-management-sql-statements/grant) cho phép tạo index cùng bảng bằng quyền CREATE. Bộ quyền tối thiểu này được đối chiếu source/tài liệu, chưa thử tạo một account/schema trắng mới trong lượt chuẩn bị nộp.
5. Kết nối phiên HeidiSQL mới bằng chính account test vào 127.0.0.1:3306/fooddriver_m01_test. SELECT DATABASE(), CURRENT_USER(); phải đúng schema/account test. USE fooddriver; phải bị từ chối quyền (1044/1142). Quay lại USE fooddriver_m01_test;. Không sửa dữ liệu trong các bước xác minh này. TestDatabaseProbe sẽ kiểm tra lại điều kiện trước Flyway.

## 3. Khởi động test API từ source, kể cả sau reboot

Đây là hướng dẫn tái lập cho người nhận, không phải lệnh đã chạy lại trong lượt chuẩn bị nộp. Mỗi lần launcher tạo fixture UUID mới trong DB test; giữ metadata đi cùng đúng tiến trình. Không mở hai launcher, không dùng metadata cũ sau reboot.

Kiểm tra Get-Service MariaDB và listener 3306. Nếu service dừng, người vận hành bật đúng service MariaDB bằng Start-Service MariaDB khi có quyền. Kiểm tra 18080 trống trước khi chạy; nếu đã có server, giữ nguyên và dùng metadata của server đó. Không dừng tiến trình lạ hoặc khởi động thêm backend.

Mở PowerShell mới tại Git root:

```powershell
$foodgoArtifacts = Join-Path (Split-Path (Get-Location).Path -Parent) 'FoodGo_Artifacts'
$runDir = Join-Path $foodgoArtifacts ('reports\M01M02_Live_' + (Get-Date -Format 'yyyyMMdd_HHmmss_fff'))
if (Test-Path -LiteralPath $runDir) { throw 'Output directory already exists' }
New-Item -ItemType Directory -Path $runDir -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path (Join-Path $foodgoArtifacts 'tmp') -Force | Out-Null
$env:TEMP = Join-Path $foodgoArtifacts 'tmp'
$env:TMP = $env:TEMP
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Set-Location foodgo-backend
$cpFile = Join-Path $runDir 'classpath.txt'
.\mvnw.cmd '-DskipTests' test-compile dependency:build-classpath '-DincludeScope=test' "-Dmdep.outputFile=$cpFile"
if ($LASTEXITCODE -ne 0) { throw 'Compile/classpath failed; no server launched' }
$testClasspath = "$($PWD.Path)\target\test-classes;$($PWD.Path)\target\classes;" + (Get-Content -LiteralPath $cpFile -Raw).Trim()
$env:FOODGO_TEST_DB_URL = 'jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test'
$env:FOODGO_TEST_DB_USERNAME = Read-Host 'Account rieng DB test'
$secureTestPassword = Read-Host 'Mat khau DB test' -AsSecureString
try {
    $env:FOODGO_TEST_DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secureTestPassword).Password
    & java -cp $testClasspath fit.iuh.foodgobackend.support.TestServerLauncher (Join-Path $runDir 'live-fixture.json')
} finally {
    Remove-Item Env:FOODGO_TEST_DB_PASSWORD -ErrorAction SilentlyContinue
    $secureTestPassword.Dispose()
}
```

Lệnh compile không chạy bộ test. TestServerLauncher tự gọi TestDatabaseProbe: chỉ chấp nhận loopback:3306/fooddriver_m01_test, xác minh account không USE được fooddriver; sau đó initializer ghim datasource/Flyway trước refresh. Chờ TEST_DB_PRECHECK_OK và CONTROLLED_TEST_SERVER_READY; health :18080/api/v1/health phải trả data.status=UP. Seed phát triển bị tắt; fixture test chỉ nằm DB riêng. Thiếu/sai FOODGO_TEST_DB_URL/USERNAME/PASSWORD phải dừng, không fallback database ứng dụng.

DB credential chỉ nằm biến môi trường của terminal đang chạy; password không đưa vào command line/history. Để chạy full backend test khi cần nghiệm thu lại code BE: dùng cùng cấu hình riêng, chạy TestDatabaseProbe thành công rồi mvnw.cmd test. Không cần chạy lại chỉ để chuẩn bị tài liệu.

Giữ terminal launcher; mở terminal FE riêng, làm theo [demo đã kiểm tra](../foodgo-frontend/docs/M01_M02_DEMO.md). Với web dùng :18080 API, Metro --localhost --port 8093. Với native dùng LAN và --lan --go --port 8093 theo checklist mobile. Không ghi đè .env.local; EXPO_NO_DOTENV=1 bảo đảm môi trường phiên kiểm tra được dùng.

Account ứng dụng A/B và ID món/quán lấy từ live-fixture.json mới. Nhập mật khẩu fixture kiểm thử riêng trên máy theo M01M02TestData; không dùng DB credential làm mật khẩu ứng dụng. Không chép credential hoặc token vào evidence/gói nộp.

## Kết quả kiểm thử đã có và giới hạn

| Kiểm tra | Kết quả | Nguồn bằng chứng |
|---|---|---|
| Backend toàn bộ | 45 tests, 0 failures/errors/skipped, BUILD SUCCESS | Người dùng chạy; launcher ghi integration-result.json exit 0/precheck passed ngày 12/11 |
| FE toàn bộ | 67 tests đạt ở chặng trước | Báo cáo FE trước lượt E2E; không nhận là chạy lại hôm nay |
| FE lint/typecheck | Đạt | Báo cáo E2E gần nhất |
| Catalog regression | 4 tests đạt | Chạy sau sửa khoảng trắng JSX dưới ScrollView |
| Chrome/CDP → Spring Boot → MariaDB test | 12 kịch bản PASS | REPORT/verification.json và 14 ảnh trong artifacts/reports |
| Export web | Đạt ở chặng trước | Không xuất lại gói/build cũ |
| git diff --check | Đạt ở lượt E2E | Kiểm tra lại khi chốt tài liệu |
| UI giỏ có dòng mất khả dụng | Chưa kiểm tra | Không có API quản trị khả dụng; backend test read/delete invalid line đã đạt |
| Health trên điện thoại Android | PASS — người dùng xác nhận | data.status=UP |
| Android/Expo Go: catalog/yêu thích/giỏ, địa chỉ | PASS | Người dùng trực tiếp thao tác và xác nhận |
| Android: restore A sau đóng/mở lại | PASS | Người dùng xác nhận chuỗi thao tác, không suy ra từ ảnh tĩnh |
| Android: logout rồi mở lại vẫn Guest | PASS | Người dùng trực tiếp thao tác và xác nhận |
| Android: login B không thấy dữ liệu riêng A | PASS | Người dùng xác nhận chuỗi đổi tài khoản, không suy ra từ ảnh tĩnh |

Checklist demo: Guest catalog → chọn option/login/hủy/quay lại → địa chỉ CRUD/validation → yêu thích → giỏ giá/qty/note/đổi quán/xung đột/xóa → logout/đổi user. Không tự replay thao tác ghi sau login. Cụ thể trong docs/M01_M02_DEMO.md của frontend.

M03–M05 cần nhóm hoàn thiện API và kiểm thử chung; bảo toàn CartService/PricingService, version và snapshot đơn. Không sửa V1 hoặc tuyên bố tạo đơn thật thành công từ FE demo.

## Giới hạn tích hợp Đơn hàng và Hộp thư

| Màn/phụ thuộc | Đối chiếu thực tế/source | Phân loại |
|---|---|---|
| Đơn hàng CUSTOMER | orderService.list gọi GET /orders?page=0&size=20; probe đã nhận HTTP500/INTERNAL_ERROR trong khi /auth/me trả200 | Thiếu API M03; không phải hồi quy M01–M02 |
| Hộp thư CUSTOMER | InboxScreen cũng dùng orderService.list trước khi lọc các đơn có tài xế | Bị chặn bởi cùng API M03; hội thoại/tin nhắn thuộc M05 |
| Hộp thư DRIVER | Source gọi deliveryService.jobs /driver/jobs, sau đó API hội thoại theo đơn | Phụ thuộc M04/M05; đối chiếu tĩnh, không nhận là đã chạy tích hợp |

Backend ordering mới có model/policy, communication/fulfillment là package nền; chưa có controller tương ứng các API trên. OrdersScreen, InboxScreen và các service liên quan giữ nguyên so với baseline 420150a. Generic error handler từ baseline đã trả500 cho exception chưa xử lý; thay đổi M01–M02 không đổi HTTP response của nhánh này. Phân loại dựa trên source và response thật đã đối chiếu, không giả danh sách rỗng/đơn/hội thoại thành công.

Đây là hạn chế tích hợp M03–M05 cần thành viên phụ trách hoàn thiện; không sửa thay module ngoài phạm vi hoặc che lỗi khi chốt M01–M02. Demo M01–M02 kết thúc tại giỏ đã lưu.

## Nội dung gói cuối

- Working tree FE/BE hiện tại, gồm cả file mới chưa tracked; giữ manifest/lockfile, Maven Wrapper, migrations, assets, source/test/docs và template công khai .example.
- Tài liệu này, checklist demo/mobile, bảng kết quả và một số ảnh PASS chọn từ bằng chứng đã có.
- Danh mục file/kích thước/SHA-256 và trạng thái Git của snapshot bàn giao, không kèm .git.
- Loại .env và biến thể local, application-local.properties, runtime credential/token/hash, database dumps, node_modules, target, .expo, cache/build outputs, raw logs, IDE/OS files. Chỉ template .example công khai được xét vào gói; không đọc cấu hình local để tạo bản mẫu.
- Hằng giả lập trong unit test/demo là dữ liệu source kiểm thử, không phải credential triển khai. Bộ lọc kiểm tra credential thật không được xóa tùy tiện dữ liệu giả khiến test mất ý nghĩa.
- Danh sách đóng gói phải bao phủ source untracked. Chỉ tạo một gói cuối sau cập nhật kết quả nghiệm thu cần thiết; không xuất ZIP review trung gian. Thay đổi file sau manifest phải cập nhật manifest/hash trước đóng gói.
