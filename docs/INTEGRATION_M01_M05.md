# Worktree tích hợp M01–M05 — 12/11/2026

## Nguồn và giới hạn kết quả

Tích hợp từ M01–M02 a7993b8128288a4625cd53cbf6b5564ab6587909 và origin/main eafeadf2a7dd90d26a6c51915be1e7a1ec69ef47; merge-base 420150a. Merge --no-commit trên nhánh integration riêng, không đổi worktree/nhánh/server đang chạy, không commit/push.

20 file cùng sửa, 12 xung đột trực tiếp. Giải quyết từng hành vi: accessor/ownership/size limit/mã lỗi địa chỉ; khóa user/version/edit giỏ; validation retry JpaSystem; catalog metadata; generation và combine polling; SecureStore queue cùng JSON storage fail-closed; giữ UI/Motion và checkout/order/fulfillment/chat/recovery của main. Không dùng nguyên file ours/theirs cho các phần có hành vi khác nhau.

Giỏ dùng valid/invalidMessage lẫn available/validationMessage nhất quán. Cả hai hàm pricing displayLines/cartLines trả dòng lỗi vẫn sửa/xóa được, giá lỗi null/tổng dòng0; lines/quote luôn strict. Adapter hai chiều bảo vệ checkout trước DTO giỏ kiểu M01 và giữ dữ liệu invalid cho màn giỏ. Resource polling chỉ combine dữ liệu trong cùng scope session generation; lịch sử chat khác phiên bị bỏ.

Giữ UTC: connection SET time_zone='+00:00', Hibernate jdbc.time_zone UTC, prefer_jdbc_datetime_types=true, READ_COMMITTED; Jackson từ main giữ chặn float bị truncate sang ID/quantity/version. POM target21, kiểm tra bằng JDK22 riêng phiên. Lockfile/package/migration V1 không đổi.

## Chốt DB dùng chung, hai policy tách biệt

| Bộ test | DB allowlist chính xác | URL/user/password bắt buộc | Profile/config standalone |
|---|---|---|---|
| M01/M02/context | fooddriver_m01_test | FOODGO_TEST_DB_URL / FOODGO_TEST_DB_USERNAME / FOODGO_TEST_DB_PASSWORD | m01-test; application-m01-test.properties |
| Flow/JPA/Seed integration từ main | fooddriver_it_m01_m05 | FOODGO_FLOW_TEST_DB_URL / FOODGO_FLOW_TEST_DB_USERNAME / FOODGO_FLOW_TEST_DB_PASSWORD | flow-test; application-flow-test.properties |

PinnedTestDatabaseInitializer dùng chung, được hai initializer policy gọi trước context refresh/DataSource/Flyway. Chỉ loopback127.0.0.1 hoặc localhost, cổng3306, đúng tên DB; không query options/host khác/đường dẫn phụ. Thiếu/blank hoặc trỏ fooddriver/DB của policy kia bị chặn trước mọi bean probe. Không fallback credential/config local: spring.config.location thay cấu hình mặc định, không import application-local.properties.

DataSource/Hikari/Flyway được ghim cùng URL/user/password/schema. Tắt Flyway create-schemas/clean/init-sqls, SQL init, Hibernate DDL; cả seed thường/rich/exit bị ép false. Guard test bằng MockEnvironment và ba bean probe không có DB: trường hợp bị từ chối phải tạo0 probe, cấu hình hợp lệ tạo3 probe. FlowIntegrationTests/JpaSqlIntegrationTests/SeedMariaDbIntegrationTests/RichDemoSeedIntegrationTests đều đã có profile, standalone config và initializer trước refresh; kiểm tra prefix trong fixture chỉ còn là lớp bảo vệ thứ hai.

TestDatabaseProbe cho M01 và FlowTestDatabaseProbe cho flow là precheck JDBC chỉ đọc trước khi người vận hành cho phép test ghi dữ liệu. Flow probe phải thấy đúng catalog và bị từ chối USE fooddriver lẫn USE fooddriver_m01_test. Probe còn kiểm tra ALTER trực tiếp trên users/schema và chặn nếu flyway_schema_history có success=0; chỉ đọc metadata, không SHOW GRANTS/hash hoặc tự repair. Account flow chỉ có quyền trên schema flow; không dùng root/account ứng dụng hoặc account M01 để tránh có quyền vượt DB.

## Thao tác DB tiếp theo trên máy người vận hành

Agent chưa chạy test DB/migration/seed. Người dùng đã chạy hai lớp Flow/JPA lúc 08:40: DB integration chưa PASS; V1 trên DB flow của máy này thất bại vì thiếu ALTER, lớp tiếp theo lỗi validation lịch sử migration. Xem chẩn đoán cuối tài liệu; không chạy lại trước khi xử lý trạng thái DB và probe PASS. Không cần dừng backend/Metro cũ hoặc dựng lại môi trường.

1. HeidiSQL phiên quản trị: kiểm tra SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='fooddriver_it_m01_m05';. Nếu chưa có, CREATE DATABASE IF NOT EXISTS fooddriver_it_m01_m05 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;. Không xóa/reset/copy fooddriver hay fooddriver_m01_test.
2. Tạo account riêng qua User manager, host TCP loopback127.0.0.1; nhập mật khẩu riêng trong UI. Cấp SELECT/INSERT/UPDATE/DELETE/CREATE trên fooddriver_it_m01_m05.* và ALTER trên bảng users (hoặc schema test này) cho V1 dòng17, không global/fooddriver/fooddriver_m01_test/GRANT OPTION. Nếu có lỗi quyền DDL cụ thể từ engine/Flyway, đối chiếu đúng lỗi rồi cấp riêng trên schema flow. Không cần DROP/clean/reset.
3. Phiên HeidiSQL bằng account flow: SELECT DATABASE(),CURRENT_USER(); phải đúng DB/account. USE fooddriver; và USE fooddriver_m01_test; phải bị từ chối quyền; ghi mã lỗi, không gửi password/hash. Không chỉnh account M01 đã có.
4. Mở PowerShell riêng, nhập ba biến đúng tên code (bên dưới). Dùng FlowTestDatabaseProbe trước khi chạy các test ghi dữ liệu. Classpath test tạo bằng Maven Wrapper dependency:build-classpath, không chạy test/migration khi tạo classpath.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:FOODGO_FLOW_TEST_DB_URL = 'jdbc:mariadb://127.0.0.1:3306/fooddriver_it_m01_m05'
$env:FOODGO_FLOW_TEST_DB_USERNAME = Read-Host 'Account rieng DB flow'
$flowPassword = Read-Host 'Mat khau DB flow' -AsSecureString
$env:FOODGO_FLOW_TEST_DB_PASSWORD = [System.Net.NetworkCredential]::new('', $flowPassword).Password
$flowPassword.Dispose()
```

Từ foodgo-backend của worktree tích hợp, nếu cần tái tạo classpath (compile-only, không chạy test):

```powershell
$reportDir = Read-Host 'Thu muc reports tuyet doi, nam ngoai source'
$cpFile = Join-Path $reportDir 'test-classpath.txt'
.\mvnw.cmd -o '-DskipTests' test-compile dependency:build-classpath '-DincludeScope=test' "-Dmdep.outputFile=$cpFile"
if ($LASTEXITCODE -ne 0) { throw 'Compile/classpath failed; stop' }
$testClasspath = "$($PWD.Path)\target\test-classes;$($PWD.Path)\target\classes;" + (Get-Content -LiteralPath $cpFile -Raw).Trim()
```

Sau khi có $testClasspath:

```powershell
& java -cp $testClasspath fit.iuh.foodgobackend.support.FlowTestDatabaseProbe
if ($LASTEXITCODE -ne 0) { throw 'Precheck failed; do not run integration tests' }
# Chỉ sau FLOW_TEST_DB_PRECHECK_OK và account/schema đã xác minh:
.\mvnw.cmd -o '-Dfoodgo.integration=true' '-Dtest=FlowIntegrationTests,JpaSqlIntegrationTests' test
Remove-Item Env:FOODGO_FLOW_TEST_DB_PASSWORD -ErrorAction SilentlyContinue
```

Lệnh test trên tạo dữ liệu test namespace riêng chỉ trong DB flow; chưa được agent chạy. Không thêm SeedMariaDbIntegrationTests/RichDemoSeedIntegrationTests hoặc chạy toàn Maven chỉ để thử môi trường: các lớp đó gọi seed có chủ ý, cần quyết định riêng. M01 tests chọn riêng bằng FOODGO_TEST_DB_* và TestDatabaseProbe; không đổi allowlist M01 để dùng flow DB. Mở terminal mới/đóng terminal sẽ không đổi Java17/TEMP/TMP toàn hệ thống; không gửi password vào chat hoặc truyền qua command-line -D.

## Fixture/seed sau tích hợp

M01FixtureLoader(10) → M02FixtureLoader(20) → DemoSeedRunner(30) → RichDemoSeedRunner(100). Mọi runner chỉ local + opt-in, loại prod/test/m01-test/flow-test. Seed mặc định false, rich mặc định false. Cả hai bộ fixture chỉ insert thiếu/giữ account cũ; username M01 customer1 khác main customer-1; không hợp nhất hoặc đổi mật khẩu hai namespace. Offer/category trùng dùng bản đã có, không overwrite.

Chưa tự chạy seed. Muốn dùng local seed ở một môi trường đã được người vận hành chọn rõ ràng phải bật profile local và flag tương ứng. Rich dataset tách namespace sample.*; không giả user orders như đơn thật. Đường dẫn account/credential/mạng cá nhân và script firewall không thuộc cấu hình dùng chung.

## Kiểm tra thực chạy của bản tích hợp

- Maven offline compile51 main/25 test source, release21, JDK22; 78 test độc lập DB PASS,0 failures/errors/skipped. Có guard mới và kiểm thử invalid-row compatibility; không phải kết quả HTTP/DB integration.
- npm test:94/94 PASS, gồm session/storage/checkout/chat và test ghép DTO/scope thật; npm run lint, npm run typecheck exit0.
- Không đổi dependency/lockfile; worktree tái dùng node_modules đã cài qua junction, không npm ci/install. Không cài SDK/emulator.
- Còn cảnh báo Node MODULE_TYPELESS_PACKAGE_JSON và Mockito dynamic-agent; không đổi manifest chỉ để tắt cảnh báo.
- DB-backed Flow/JPA do người dùng chạy lúc 08:40 chưa PASS: V1 thiếu ALTER, sau đó failed migration history. Chưa xác minh FE–BE hoặc Android của bản tích hợp. Các kết quả Android/web/DB của nhánh M01–M02 trước đó được lưu riêng, không tự áp vào bản ghép.

## Chẩn đoán lượt08:40 — 12/11/2026

FlowIntegrationTests: SQLState42000, error1142, ALTER command denied trên users của DB flow tại V1 dòng17 (fk_users_active_order). JpaSqlIntegrationTests tiếp theo: FlywayValidateException, failed migration version1. Không phải bằng chứng thiếu password: Flyway đã xác thực/kết nối và chạy một phần migration; finally xóa password sau test không giải thích lỗi trước đó.

Hướng dẫn quyền trước đó thiếu ALTER đã được sửa. Không sửa V1/production/guard để né lỗi; probe mới chỉ phát hiện thiếu quyền và failed history sớm hơn. Quản trị viên phải bổ sung đúng ALTER cho account thực tế trên bảng users/schema test, không global. History/schema có thể dở dang do DDL MariaDB: chỉ cấp ALTER hoặc chạy repair đơn lẻ chưa đủ để bảo đảm an toàn rerun V1. Không tự repair/baseline/xóa history/drop/reset; cần kiểm kê metadata và thống nhất phương án bảo toàn dữ liệu với chủ DB trước. Chỉ chạy hai lớp khi probe mới PASS.

Kiểm tra độc lập sau bổ sung preflight: FlowTestDatabasePreflightTests (4), FlowTestDatabaseGuardTests (5), M01TestDatabaseGuardTests (7): tổng 16 tests, 0 failures/errors/skipped. Không chạy lại integration sau sửa probe. Bản ghép bàn giao ở trạng thái WIP, DB verification pending.
