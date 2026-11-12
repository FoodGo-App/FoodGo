package fit.iuh.foodgobackend.account;

import fit.iuh.foodgobackend.support.M01TestDatabaseInitializer;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import fit.iuh.foodgobackend.common.Data;
import fit.iuh.foodgobackend.common.JpaSql;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.config.location=classpath:/application-m01-test.properties")
@ActiveProfiles("m01-test")
@ContextConfiguration(initializers = M01TestDatabaseInitializer.class)
class AuthHttpTests {

    @LocalServerPort
    private int port;

    @Autowired
    private JpaSql db;

    @Autowired
    private TransactionTemplate tx;

    // A fresh namespace per JUnit instance: never reuse pre-existing user credentials.
    private final String testRunId = java.util.UUID.randomUUID().toString().replace("-", "");

    private String testUsername(String alias) { return alias + "_" + testRunId; }

    private final HttpClient client = HttpClient.newHttpClient();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final String rawPassword = "TestPassword@123";

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/v1";
    }

    @BeforeEach
    void setupTestData() {
        tx.execute(status -> {
            var rest = db.one("SELECT id FROM restaurants WHERE map_point_code=?", "TR_" + testRunId.substring(0, 24));
            Long testRestaurantId;
            if (rest == null) {
                testRestaurantId = db.insert("restaurants", Data.m(
                        "name", "Quán Test",
                        "area_code", "AREA_A",
                        "address_text", "123 Đường Test",
                        "map_point_code", "TR_" + testRunId.substring(0, 24),
                        "image_code", "img_test",
                        "available", true,
                        "sample_rating", 5.0,
                        "sample_distance_m", 500,
                        "sample_eta_minutes", 15,
                        "sample_reviews_json", "[]"
                ));
            } else {
                testRestaurantId = Data.n(rest, "id");
            }

            createUserIfAbsent("cust_test", "Khách Test", "CUSTOMER", true, null, null);
            createUserIfAbsent("rest_test", "Quán Test", "RESTAURANT", true, testRestaurantId, null);
            createUserIfAbsent("driver_test", "Tài Xế Test", "DRIVER", true, null, "AREA_A");
            createUserIfAbsent("disabled_user", "Khóa Test", "CUSTOMER", false, null, null);
            return null;
        });
    }

    private void createUserIfAbsent(String username, String displayName, String role, boolean enabled, Long restId, String driverArea) {
        username = testUsername(username);
        if (db.one("SELECT id FROM users WHERE username=?", username) == null) {
            Map<String, Object> map = Data.m(
                    "username", username,
                    "password_hash", encoder.encode(rawPassword),
                    "display_name", displayName,
                    "role", role,
                    "enabled", enabled
            );
            if (restId != null) map.put("restaurant_id", restId);
            if (driverArea != null) map.put("driver_area_code", driverArea);
            db.insert("users", map);
        }
    }

    @Test
    @DisplayName("1. Đăng nhập thành công 3 vai trò: vai trò lấy từ DB")
    void loginSuccessThreeRoles() throws Exception {
        for (String[] roleCase : new String[][]{{"cust_test", "CUSTOMER"}, {"rest_test", "RESTAURANT"}, {"driver_test", "DRIVER"}}) {
            String username = testUsername(roleCase[0]);
            String expectedRole = roleCase[1];

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(getBaseUrl() + "/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(String.format("{\"username\":\"%s\",\"password\":\"%s\"}", username, rawPassword)))
                    .build();

            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            assertEquals(200, res.statusCode());

            Map<String, Object> body = Data.object(res.body());
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            assertNotNull(data.get("token"));
            Map<String, Object> user = (Map<String, Object>) data.get("user");
            assertEquals(expectedRole, user.get("role"));
            assertNotNull(user.get("displayName"));
        }
    }

    @Test
    @DisplayName("2. Sai mật khẩu hoặc tài khoản không tồn tại bị từ chối 401")
    void loginInvalidCredentials() throws Exception {
        HttpRequest reqWrongPass = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(String.format("{\"username\":\"%s\",\"password\":\"WrongPassword\"}", testUsername("cust_test"))))
                .build();
        HttpResponse<String> res1 = client.send(reqWrongPass, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, res1.statusCode());
        assertEquals("INVALID_CREDENTIALS", ((Map<?, ?>) Data.object(res1.body()).get("error")).get("code"));

        HttpRequest reqNonExist = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"non_existent\",\"password\":\"AnyPassword\"}"))
                .build();
        HttpResponse<String> res2 = client.send(reqNonExist, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, res2.statusCode());
        assertEquals("INVALID_CREDENTIALS", ((Map<?, ?>) Data.object(res2.body()).get("error")).get("code"));
    }

    @Test
    @DisplayName("3. Đầu vào rỗng hoặc không hợp lệ bị từ chối 400")
    void loginInvalidInput() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"\",\"password\":\"\"}"))
                .build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, res.statusCode());
    }

    @Test
    @DisplayName("4. /auth/me với token hợp lệ, thiếu token hoặc token sai")
    void authMeVerification() throws Exception {
        String token = obtainToken("cust_test");

        HttpRequest reqValid = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/me"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> resValid = client.send(reqValid, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, resValid.statusCode());
        Map<String, Object> user = (Map<String, Object>) Data.object(resValid.body()).get("data");
        assertEquals("CUSTOMER", user.get("role"));
        assertEquals("Khách Test", user.get("displayName"));

        HttpRequest reqNoToken = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/me"))
                .GET()
                .build();
        HttpResponse<String> resNoToken = client.send(reqNoToken, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, resNoToken.statusCode());

        HttpRequest reqBadToken = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/me"))
                .header("Authorization", "Bearer invalid_token_12345")
                .GET()
                .build();
        HttpResponse<String> resBadToken = client.send(reqBadToken, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, resBadToken.statusCode());
    }

    @Test
    @DisplayName("5. Logout thu hồi phiên; token cũ không gọi được /auth/me")
    void logoutRevokesSession() throws Exception {
        String token = obtainToken("cust_test");

        HttpRequest reqLogout = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/logout"))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();
        HttpResponse<String> resLogout = client.send(reqLogout, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, resLogout.statusCode());
        assertEquals(true, ((Map<?, ?>) Data.object(resLogout.body()).get("data")).get("revoked"));

        HttpRequest reqCheck = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/me"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> resCheck = client.send(reqCheck, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, resCheck.statusCode());
        assertEquals("SESSION_EXPIRED", ((Map<?, ?>) Data.object(resCheck.body()).get("error")).get("code"));
    }

    @Test
    @DisplayName("6. Phiên hết hạn hoặc tài khoản bị vô hiệu hóa")
    void expiredSessionAndDisabledAccount() throws Exception {
        String mockToken = "expired_token_" + System.currentTimeMillis();
        tx.execute(status -> {
            var user = db.required("SELECT id FROM users WHERE username=?", testUsername("cust_test"));
            String tokenHash = Data.hash(mockToken);
            db.insert("auth_sessions", Data.m(
                    "user_id", Data.n(user, "id"),
                    "token_hash", tokenHash,
                    "expires_at", Timestamp.from(Instant.now().minusSeconds(60))
            ));
            return null;
        });

        HttpRequest reqExpired = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/me"))
                .header("Authorization", "Bearer " + mockToken)
                .GET()
                .build();
        HttpResponse<String> resExpired = client.send(reqExpired, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, resExpired.statusCode());
        assertEquals("SESSION_EXPIRED", ((Map<?, ?>) Data.object(resExpired.body()).get("error")).get("code"));

        HttpRequest reqDisabled = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(String.format("{\"username\":\"%s\",\"password\":\"%s\"}", testUsername("disabled_user"), rawPassword)))
                .build();
        HttpResponse<String> resDisabled = client.send(reqDisabled, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, resDisabled.statusCode());
        assertEquals("INVALID_CREDENTIALS", ((Map<?, ?>) Data.object(resDisabled.body()).get("error")).get("code"));
    }

    @Test
    @DisplayName("7. Nhà hàng hoặc tài xế bị chặn 403 khi gọi API địa chỉ của CUSTOMER")
    void roleAccessDeniedForAddresses() throws Exception {
        String restToken = obtainToken("rest_test");
        String driverToken = obtainToken("driver_test");

        HttpRequest reqRest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/addresses"))
                .header("Authorization", "Bearer " + restToken)
                .GET()
                .build();
        HttpResponse<String> resRest = client.send(reqRest, HttpResponse.BodyHandlers.ofString());
        assertEquals(403, resRest.statusCode());
        assertEquals("FORBIDDEN", ((Map<?, ?>) Data.object(resRest.body()).get("error")).get("code"));

        HttpRequest reqDriver = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/addresses"))
                .header("Authorization", "Bearer " + driverToken)
                .GET()
                .build();
        HttpResponse<String> resDriver = client.send(reqDriver, HttpResponse.BodyHandlers.ofString());
        assertEquals(403, resDriver.statusCode());
        assertEquals("FORBIDDEN", ((Map<?, ?>) Data.object(resDriver.body()).get("error")).get("code"));
    }

    private String obtainToken(String username) throws Exception {
        username = testUsername(username);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(String.format("{\"username\":\"%s\",\"password\":\"%s\"}", username, rawPassword)))
                .build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());
        Map<String, Object> body = Data.object(res.body());
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        return (String) data.get("token");
    }
}
