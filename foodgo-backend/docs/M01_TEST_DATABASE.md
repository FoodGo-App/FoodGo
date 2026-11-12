# M01-A: database kiểm thử riêng

> Cập nhật 12/11/2026: phần mô tả chưa nghiệm thu bên dưới là mốc lịch sử 11/11. Người dùng đã chạy backend 45 test đạt và probe DB riêng đạt; FE–BE thật có 12 kịch bản PASS. Hướng dẫn chạy hiện hành và giới hạn còn mở: [bàn giao M01–M02](../../docs/M01_M02_HANDOVER.md).

Ngày 11/11/2026. Phần code bảo vệ đã triển khai; chưa nghiệm thu integration.
Git khi tiếp nhận lại: feature/m01-m02-huu, HEAD 420150a227cc23ef492f91e9d7129203f2ce2ffc. Giữ các thay đổi M01-A trước đó.

## Cấu hình và thứ tự chặn

AuthHttpTests và FoodgoBackendApplicationTests cùng dùng:
- spring.config.location=classpath:/application-m01-test.properties: thay danh sách cấu hình mặc định, không import application.properties/application-local.properties.
- profile m01-test.
- M01TestDatabaseInitializer: kiểm tra trước refresh context, trước tạo DataSource, Flyway, JPA và CommandLineRunner; không phải @BeforeEach.

Bắt buộc FOODGO_TEST_DB_URL, FOODGO_TEST_DB_USERNAME, FOODGO_TEST_DB_PASSWORD. Có thể dùng system property foodgo.test.db.url/username/password tương ứng; không truyền password trên command line. Không fallback FOODGO_DB_* hoặc fooddriver. Thiếu/blank bị từ chối bằng thông báo chỉ chứa tên cấu hình, không chứa giá trị.
URL allowlist: jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test hoặc localhost thay cho 127.0.0.1. Không nhận query options, host khác, port khác, multi-host, đường dẫn phụ hoặc tên DB khác.
Sau kiểm tra, PropertySource ưu tiên cao ghim cả datasource/Hikari và Flyway về URL/credential riêng, ghim Flyway schemas/default-schema, tắt create-schemas/clean, tắt Hibernate DDL và SQL init, ghim connection-init-sql chỉ đặt múi giờ, xóa Flyway init-sqls. Seed bị ép false. Vì vậy cấu hình Flyway/Hikari bên ngoài trỏ fooddriver không được dùng.

Fixture phát triển chỉ xuất hiện với profile local, không có prod/test/m01-test, và seed-enabled=true rõ ràng. Default seed đổi từ true sang false. Khởi động app bình thường không tự seed; dữ liệu hiện có được giữ nguyên.
HTTP test tự tạo user/restaurant trong namespace UUID riêng theo instance JUnit, không dùng tài khoản fixture phát triển và không thay credential của user cũ. map_point_code giới hạn 27 ký tự để phù hợp V1 VARCHAR(30). Không tự cleanup/xóa dữ liệu; các lượt integration sẽ tích lũy dữ liệu chỉ trong DB test riêng.

## Kiểm thử không cần DB

Chạy từ foodgo-backend trong phiên PowerShell riêng:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd -o '-Dtest=M01TestDatabaseGuardTests,OrderPolicyTests' test
```

Maven compile với release 21; không đổi pom hoặc Java 17 mặc định toàn máy.
Guard test dùng MockEnvironment, không đọc OS secret; SpringApplication tối thiểu không bật JDBC/Flyway auto-config, chỉ có ba probe đếm bean. Trường hợp cấu hình lỗi phải throw khi cả ba probe chưa tạo. Trường hợp cấu hình hợp lệ tạo được cả ba, chứng minh phép đo có hoạt động; không kết nối DB thật.
Kiểm tra thêm fixture không được tạo khi thiếu opt-in/profile không phù hợp và được tạo trong local+opt-in (ApplicationContextRunner không gọi runner.run()).

## Điều kiện cần xác minh trước integration

Lần đọc trạng thái sau khởi động lại: dịch vụ MariaDB Stopped; không thấy listener 3306/8080/8081. Không khởi động server/dịch vụ trong lượt này.
Chưa xác minh fooddriver_m01_test tồn tại, credential dành riêng, quyền hạn hoặc SELECT DATABASE() thực tế. Không chạy AuthHttpTests hay contextLoads và không áp migration trong lượt này.

Thực hiện riêng trên máy, không gửi password vào chat:
1. Bật MariaDB khi sẵn sàng. Tạo database mới fooddriver_m01_test nếu chưa có bằng công cụ quản trị; không đổi/xóa/reset fooddriver và không sửa V1.
2. Tạo account riêng chỉ có quyền cần thiết trên fooddriver_m01_test.* (DDL cho Flyway và DML cho test), không có quyền fooddriver/global; tránh dùng root.
3. Dùng account đó kết nối đúng 127.0.0.1:3306/fooddriver_m01_test, kiểm tra chỉ đọc SELECT DATABASE(), CURRENT_USER(); và SHOW GRANTS FOR CURRENT_USER;. Chỉ tiếp tục nếu tên DB đúng và quyền bị giới hạn vào DB test. Không cần start backend 8080 hoặc Expo 8081 để chạy HTTP test random port.
4. Nhập riêng ba biến trong phiên PowerShell mới như bên dưới. Chỉ chạy dòng Maven sau khi bước 3 đã xác minh. Lệnh sẽ thực sự chạy Flyway V1 nếu DB test chưa có schema và tạo dữ liệu kiểm thử; chưa được thực thi trong lượt bàn giao này.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:FOODGO_TEST_DB_URL = 'jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test'
$env:FOODGO_TEST_DB_USERNAME = Read-Host 'Tai khoan rieng cho DB test'
$secureTestPassword = Read-Host 'Mat khau DB test (khong hien)' -AsSecureString
$env:FOODGO_TEST_DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secureTestPassword).Password
try {
    .\mvnw.cmd -o '-Dtest=AuthHttpTests' test
} finally {
    Remove-Item Env:FOODGO_TEST_DB_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable secureTestPassword -ErrorAction SilentlyContinue
}
```

Không dùng mvnw test không chọn lớp cho đến khi sẵn sàng chạy cả context test; hai test Spring context đều có cùng chốt. Chốt kiểm tra URL trước refresh không thay thế việc xác minh server/DB/account thật. Báo cáo 7 HTTP test cũ là trước tách DB, không chứng minh bản sửa mới đạt integration.

## Kết quả chạy thực tế của bản sửa

Lệnh đã chạy: mvnw.cmd -o -Dtest=M01TestDatabaseGuardTests,OrderPolicyTests test, từ foodgo-backend, JAVA_HOME đặt JDK 22 trong riêng tiến trình PowerShell.
Lượt cuối kết thúc 11/11/2026 21:24:11 +07:00, exit code 0, BUILD SUCCESS, tổng 11.869 giây.
- M01TestDatabaseGuardTests: 7 tests, 0 failures, 0 errors, 0 skipped.
- OrderPolicyTests có sẵn: 3 tests, 0 failures, 0 errors, 0 skipped; không thay đổi module policy.
- Tổng 10 tests đạt, không có JDBC connection/migration/seed/test ghi DB.
- Main/test source đã compile với release 21. AuthHttpTests còn cảnh báo unchecked đã có; không coi compile thành công là HTTP integration đạt.
- git diff --check: đạt, không lỗi khoảng trắng. Chưa chạy AuthHttpTests hoặc FoodgoBackendApplicationTests sau tách DB.

Các file thay đổi trong lượt tách DB: M01TestDatabaseInitializer.java, M01TestDatabaseGuardTests.java, application-m01-test.properties, AuthHttpTests.java, FoodgoBackendApplicationTests.java, M01FixtureLoader.java, application.properties và tài liệu này. Giữ nguyên bốn thay đổi tracked M01-A từ lượt trước. Không sửa V1/pom/API hoặc commit/push.
