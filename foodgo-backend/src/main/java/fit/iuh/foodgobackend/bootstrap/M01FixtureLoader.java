package fit.iuh.foodgobackend.bootstrap;

import fit.iuh.foodgobackend.common.Data;
import fit.iuh.foodgobackend.common.JpaSql;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Fixture M01 có điều kiện chạy lặp an toàn (idempotent), không ghi đè dữ liệu có sẵn.
 * Chỉ bật rõ ràng trong profile local; không chạy trong production/test.
 */
@org.springframework.core.annotation.Order(10)
@Component
@Profile("local & !prod & !test & !m01-test")
@ConditionalOnProperty(name = "foodgo.seed-enabled", havingValue = "true", matchIfMissing = false)
public class M01FixtureLoader implements CommandLineRunner {

    private final JpaSql db;
    private final boolean seedEnabled;
    private final String seedPassword;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public M01FixtureLoader(
            JpaSql db,
            @Value("${foodgo.seed-enabled:false}") boolean seedEnabled,
            @Value("${foodgo.seed-password:FoodGo@123}") String seedPassword) {
        this.db = db;
        this.seedEnabled = seedEnabled;
        this.seedPassword = seedPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        // 1. Tạo nhà hàng mẫu tối thiểu cho role RESTAURANT (nếu chưa có)
        Long restaurantId1 = ensureRestaurant("Quán Cơm Panda 1", "AREA_A", "123 Nguyễn Văn Bảo, Gò Vấp", "REST_01", "panda_rest_1");
        Long restaurantId2 = ensureRestaurant("Quán Trà Sữa Panda 2", "AREA_A", "456 Lê Đức Thọ, Gò Vấp", "REST_02", "panda_rest_2");

        String passwordHash = passwordEncoder.encode(seedPassword);

        // 2. Tạo tối thiểu 2 tài khoản cho mỗi vai trò (CUSTOMER, RESTAURANT, DRIVER)
        // CUSTOMER
        ensureUser("customer1", passwordHash, "Nguyễn Văn Khách 1", "CUSTOMER", true, null, null);
        ensureUser("customer2", passwordHash, "Trần Thị Khách 2", "CUSTOMER", true, null, null);

        // RESTAURANT (liên kết với restaurant_id hợp lệ)
        ensureUser("restaurant1", passwordHash, "Chủ Quán Panda 1", "RESTAURANT", true, restaurantId1, null);
        ensureUser("restaurant2", passwordHash, "Chủ Quán Panda 2", "RESTAURANT", true, restaurantId2, null);

        // DRIVER (khu vực mẫu hợp lệ AREA_A)
        ensureUser("driver1", passwordHash, "Bác Tài Giao Hàng 1", "DRIVER", true, null, "AREA_A");
        ensureUser("driver2", passwordHash, "Bác Tài Giao Hàng 2", "DRIVER", true, null, "AREA_A");
    }

    private Long ensureRestaurant(String name, String areaCode, String addressText, String mapPointCode, String imageCode) {
        var existing = db.one("SELECT id FROM restaurants WHERE map_point_code=?", mapPointCode);
        if (existing != null) {
            return Data.n(existing, "id");
        }
        return db.insert("restaurants", Data.m(
                "name", name,
                "area_code", areaCode,
                "address_text", addressText,
                "map_point_code", mapPointCode,
                "image_code", imageCode,
                "available", true,
                "sample_rating", 4.8,
                "sample_distance_m", 1200,
                "sample_eta_minutes", 25,
                "sample_reviews_json", "[]"
        ));
    }

    private void ensureUser(String username, String passwordHash, String displayName, String role, boolean enabled, Long restaurantId, String driverAreaCode) {
        var existing = db.one("SELECT id FROM users WHERE username=?", username);
        if (existing != null) {
            return; // Đã tồn tại, giữ nguyên không ghi đè
        }
        Map<String, Object> values = Data.m(
                "username", username,
                "password_hash", passwordHash,
                "display_name", displayName,
                "role", role,
                "enabled", enabled
        );
        if (restaurantId != null) {
            values.put("restaurant_id", restaurantId);
        }
        if (driverAreaCode != null) {
            values.put("driver_area_code", driverAreaCode);
        }
        db.insert("users", values);
    }
}
