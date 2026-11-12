# Checklist mobile M01–M02

## Chuẩn bị và giới hạn

Project Expo ~58.0.23 / React Native 0.88.1. Dùng Expo Go hỗ trợ SDK 58 hoặc development build đã có; không nâng dependency để khớp một bản Expo Go khác và không cài emulator/SDK lớn trong lượt nghiệm thu. Windows không chạy iOS Simulator. Chưa có adb không chứng minh không có điện thoại Wi-Fi.

Kiểm tra công cụ đang có: Get-Command adb, emulator -ErrorAction SilentlyContinue; nếu đã có adb thì adb devices -l để xem thiết bị được cấp phép. Không tự cài/chạy ADB mới hoặc bật cấu hình điện thoại thay người dùng. Viewport Chrome chỉ là web, chưa phải native PASS.

## Nghiệm thu Android/Expo Go — 12/11/2026

Ngày 12/11/2026, người dùng trực tiếp thao tác trên Android/Expo Go và xác nhận PASS: catalog/yêu thích/giỏ, địa chỉ, đóng/mở lại khôi phục phiên A, logout rồi đóng/mở lại vẫn Guest, login B không thấy dữ liệu riêng A. Đây là kết quả kiểm thử thủ công do người dùng cung cấp; ảnh tĩnh không tự chứng minh đầy đủ chuỗi restore hoặc tách dữ liệu A/B. Agent không nhận là đã tự điều khiển thiết bị.

Các ghi nhận trước đó chỉ health PASS/chưa mở được app là mốc chẩn đoán trước nghiệm thu, đã được thay bằng kết quả thao tác mới này. Model/Android version/Expo Go version chưa được cung cấp; không suy đoán thông số thiết bị. Bằng chứng web 12 kịch bản và backend 45 test được ghi riêng, không thay cho kết quả Android.

## Mạng và lệnh chạy

1. Điện thoại/máy tính cùng mạng Wi-Fi tin cậy; dùng Get-NetIPConfiguration để xác minh IPv4 của interface có gateway. Không dùng IP từ .env.example hoặc từ lượt cũ. Trên máy: Get-NetTCPConnection -State Listen -LocalPort 18080; LocalAddress loopback 127.0.0.1/::1 sẽ không truy cập được từ điện thoại. Dấu :: chỉ chứng minh listener IPv6 wildcard; kiểm tra health qua IPv4 LAN để xác nhận thực tế.
2. Mở http://<LAN_VUA_XAC_MINH>:18080/api/v1/health trên điện thoại; phải 200/data.status=UP. Máy tính gọi được LAN không chứng minh điện thoại gọi được. Giữ backend launcher hiện có và đúng fooddriver_m01_test; không sửa server.address/bind hoặc mở backend khác.
3. PowerShell riêng tại Git root, đã cài dependency FE:

```powershell
Get-NetIPConfiguration | Where-Object IPv4DefaultGateway | Select-Object InterfaceAlias,IPv4Address
$foodgoLan = Read-Host 'IPv4 LAN vua xac minh'
$foodgoArtifacts = Join-Path (Split-Path (Get-Location).Path -Parent) 'FoodGo_Artifacts'
$env:TEMP = Join-Path $foodgoArtifacts 'tmp'
$env:TMP = $env:TEMP
$env:EXPO_NO_DOTENV = '1'
$env:EXPO_NO_TELEMETRY = '1'
$env:EXPO_PUBLIC_DATA_MODE = 'api'
$env:EXPO_PUBLIC_API_URL = "http://${foodgoLan}:18080/api/v1"
Remove-Item Env:CI -ErrorAction SilentlyContinue
Set-Location foodgo-frontend
.\node_modules\.bin\expo.cmd start --lan --go --port 8093
```

4. Kiểm tra listener 8093 và http://<LAN_VUA_XAC_MINH>:8093/status trên máy/điện thoại. Scan QR hoặc mở exp://<LAN_VUA_XAC_MINH>:8093 bằng Expo Go tương thích; ghi model, Android/iOS, phiên bản Expo Go/build. Nếu có development build, thay --go bằng --dev-client và dùng URL/scheme CLI in ra; không tự tạo build mới trong lượt này.
5. Native HTTP cần kiểm tra bằng app. Trình duyệt điện thoại mở web từ LAN có Origin khác allowlist CORS localhost của TestServerLauncher; không đổi CORS chỉ để coi web mobile là native. Expo tunnel cho Metro không tự tạo đường tới API18080; không dùng tunnel để che việc API chưa kết nối được.

Không tự đổi firewall, profile mạng hoặc bind backend. Nếu điện thoại không tới được sau khi xác minh cùng mạng và health LAN trên máy đã UP, ghi lỗi/kiểm tra Wi-Fi client isolation/VPN. Đề xuất thay đổi hẹp khi có bằng chứng: một rule inbound TCP chỉ cho hai cổng 18080/8093, local IPv4 máy tính, remote IPv4 đúng điện thoại, đúng interface/profile hiện hành; mở quyền tiếp cận dev API/Metro cho duy nhất thiết bị đó trong buổi kiểm tra rồi xóa rule. Không mở 3306 hoặc toàn subnet/server, không đổi Public→Private hay disable firewall. Cần người dùng xem tác động và cho phép trước khi thực hiện rule; chưa có rule nào được agent tạo.

## Checklist thực chạy trên app

Ghi PASS/FAIL/chưa kiểm tra từng dòng; dùng account và ID trong live-fixture.json của backend còn hoạt động. Nhập credential riêng trên máy, không chụp password/token.

| Bước | Phạm vi kết quả | Kết quả thiết bị |
|---|---|---|
| Health từ điện thoại | health UP, kết quả trước đó | PASS — người dùng xác nhận |
| Login A/mở FoodGo | Thực hiện được các luồng bằng phiên A | PASS — người dùng trực tiếp thao tác |
| Catalog/yêu thích/giỏ | Nhóm chức năng theo checklist nghiệp vụ | PASS — người dùng trực tiếp thao tác |
| Địa chỉ | Nhóm chức năng địa chỉ | PASS — người dùng trực tiếp thao tác |
| Đóng/mở lại app khi đang login | Khôi phục phiên A | PASS — người dùng trực tiếp thao tác, không suy ra từ ảnh tĩnh |
| Logout rồi đóng/mở lại | Vẫn Guest | PASS — người dùng trực tiếp thao tác |
| Login B | Không thấy dữ liệu riêng A | PASS — người dùng trực tiếp thao tác, không suy ra từ ảnh tĩnh |

Chốt nghiệm thu các luồng M01–M02 nêu trên. Chưa kiểm tra iOS và UI dòng giỏ mất khả dụng; các tình huống timing/offline ngoài xác nhận thủ công được phân biệt với bộ unit/integration test. Lỗi màn Đơn hàng/Hộp thư do phụ thuộc API M03–M05 chưa triển khai, xem [phân loại tích hợp](M01_M02_HANDOVER.md#giới-hạn-tích-hợp-đơn-hàng-và-hộp-thư).

Tùy điều kiện: tắt mạng lúc mở app để kiểm tra restore không coi timeout là 401 và không lộ dữ liệu riêng; bật lại và thử xác minh phiên. Không tự gửi lại thao tác ghi giỏ chưa rõ kết quả.

Ảnh/báo cáo theo từng lượt lưu trong artifacts/reports trên máy, không trong source. Không ghi native PASS khi chỉ có kết quả web hoặc lệnh bundle. Đọc [bàn giao](M01_M02_HANDOVER.md) và [demo](../foodgo-frontend/docs/M01_M02_DEMO.md).

Tài liệu chính thức đã đối chiếu: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Start developing](https://docs.expo.dev/get-started/start-developing/), [Expo CLI](https://docs.expo.dev/more/expo-cli/). CLI cài trong project xác nhận hỗ trợ --lan, --go, --dev-client và --port.
