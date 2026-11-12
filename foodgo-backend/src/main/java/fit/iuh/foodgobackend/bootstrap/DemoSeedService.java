package fit.iuh.foodgobackend.bootstrap;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.cart.CartService;
import fit.iuh.foodgobackend.common.JpaSql;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static fit.iuh.foodgobackend.common.Data.*;

/** Add missing local fixtures without resetting application-owned data. */
@Service
public class DemoSeedService {
    private final JpaSql db;
    private final CartService carts;
    private final String password;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();

    public DemoSeedService(JpaSql db, CartService carts,
                           @Value("${foodgo.seed-password:FoodGo@123}") String password) {
        this.db = db;
        this.carts = carts;
        this.password = password;
    }

    @Transactional
    public void seed() {
        long rice = ensure("categories", "SELECT id FROM categories WHERE name=?",
                m("name", "Cơm", "sort_order", 1), "Cơm");
        long extras = ensure("categories", "SELECT id FROM categories WHERE name=?",
                m("name", "Món thêm", "sort_order", 2), "Món thêm");
        long restaurant = ensure("restaurants",
                "SELECT id FROM restaurants WHERE name=? AND area_code=? AND map_point_code=? ORDER BY id LIMIT 1",
                m("name", "Bếp Nhà", "area_code", "AREA_A",
                        "address_text", "20 Đường Mẫu, Khu vực A, TP. Hồ Chí Minh",
                        "map_point_code", "RESTAURANT_A", "image_code", "CHICKEN_RICE",
                        "available", true, "sample_rating", 4.8,
                        "sample_distance_m", 1200, "sample_eta_minutes", 25,
                        "sample_reviews_json", "[]"),
                "Bếp Nhà", "AREA_A", "RESTAURANT_A");

        long chicken = ensureFood(restaurant, rice, "Cơm gà nướng", 30000, "CHICKEN_RICE",
                "Gà nướng, cơm nóng và rau. Có thể chọn phần lớn, thêm trứng và rau.");
        long mushroom = ensureFood(restaurant, rice, "Cơm nấm kho", 40000, "MUSHROOM_RICE",
                "Nấm kho cùng cơm nóng, món chay minh họa.");
        ensureFood(restaurant, rice, "Cơm gà sốt tiêu", 45000, "CHICKEN_RICE", "Gà sốt tiêu và cơm nóng.");
        ensureFood(restaurant, rice, "Cơm nấm rau củ", 35000, "MUSHROOM_RICE", "Cơm nấm cùng rau củ theo mùa.");
        ensureFood(restaurant, extras, "Gà nướng thêm", 25000, "CHICKEN_RICE", "Một phần gà nướng thêm.");
        ensureFood(restaurant, extras, "Nấm kho thêm", 20000, "MUSHROOM_RICE", "Một phần nấm kho thêm.");

        long size = ensureGroup(chicken, "Kích cỡ", 0, 1, 1);
        ensureOption(size, "Vừa", 0);
        long large = ensureOption(size, "Lớn", 10000);
        long toppings = ensureGroup(chicken, "Món thêm", 0, 2, 2);
        long egg = ensureOption(toppings, "Trứng", 5000);
        long vegetables = ensureOption(toppings, "Rau", 5000);
        long spice = ensureGroup(chicken, "Độ cay", 0, 1, 3);
        ensureOption(spice, "Ít cay", 0);
        ensureOption(spice, "Cay vừa", 0);

        var customer1 = ensureUser("customer-1", "Minh Anh", "CUSTOMER", null, null);
        var customer2 = ensureUser("customer-2", "Khách thứ hai", "CUSTOMER", null, null);
        ensureUser("restaurant-1", "Bếp Nhà", "RESTAURANT", restaurant, null);
        ensureUser("driver-1", "Nguyễn An", "DRIVER", null, "AREA_A");
        ensureUser("driver-2", "Trần Bình", "DRIVER", null, "AREA_A");

        ensureAddress(customer1, "CUSTOMER_A", "0900000001");
        ensureAddress(customer2, "CUSTOMER_B", "0900000002");
        seedCustomerCart(customer1, chicken, mushroom, List.of(large, egg, vegetables));
        seedCustomerCart(customer2, chicken, mushroom, List.of(large, egg, vegetables));

        ensureOffer("TRUA10", "Giảm 10% tiền món", "PERCENT", 10, null, 30000L, 100000, null);
        ensureOffer("SHIP5", "Giảm 5.000đ phí giao", "DELIVERY_DISCOUNT", null, 5000L, null, 0, null);
        ensureOffer("FREESHIP", "Miễn phí giao hàng", "FREE_DELIVERY", null, null, null, 100000, null);
        ensureOffer("VIFREESHIP", "Miễn phí giao khi dùng ví", "FREE_DELIVERY", null, null, null,
                100000, "MOCK_WALLET");
    }

    Map<String, Object> ensureUser(String username, String displayName, String role,
                                    Long restaurantId, String driverArea) {
        var existing = db.one("SELECT * FROM users WHERE username=?", username);
        if (existing != null) {
            return existing;
        }
        var values = m("username", username, "password_hash", passwords.encode(password),
                "display_name", displayName, "role", role, "enabled", true,
                "restaurant_id", restaurantId, "driver_area_code", driverArea);
        long id = db.insert("users", values);
        return m("id", id, "display_name", displayName, "role", role);
    }

    void ensureAddress(Map<String, Object> customer, String point, String phone) {
        if (!"CUSTOMER".equals(s(customer, "role"))) {
            return;
        }
        long customerId = n(customer, "id");
        if (db.one("SELECT id FROM addresses WHERE customer_id=? LIMIT 1", customerId) != null) {
            return;
        }
        db.insert("addresses", m("customer_id", customerId,
                "recipient_name", s(customer, "display_name"), "recipient_phone", phone,
                "area_code", "AREA_A", "address_text", "12 Đường Mẫu, Khu vực A, TP. Hồ Chí Minh",
                "label", "Nhà", "map_point_code", point));
    }

    void seedCustomerCart(Map<String, Object> customer, long chicken, long mushroom,
                          List<Long> chickenOptions) {
        if (!"CUSTOMER".equals(s(customer, "role"))) {
            return;
        }
        long customerId = n(customer, "id");
        // The cart row is also the fixture marker: a consumed/cleared cart must remain empty.
        if (db.one("SELECT id FROM carts WHERE customer_id=?", customerId) != null
                || db.one("SELECT id FROM orders WHERE customer_id=? LIMIT 1", customerId) != null) {
            return;
        }
        db.insert("carts", m("customer_id", customerId));
        var principal = new UserPrincipal(customerId, s(customer, "display_name"), "CUSTOMER", null, null);
        carts.add(principal, new CartService.ItemInput(chicken, chickenOptions, "", 2, 0, false), null);
        carts.add(principal, new CartService.ItemInput(mushroom, List.of(), "", 1, 1, false), null);
    }

    private long ensureFood(long restaurant, long category, String name, long price,
                            String image, String description) {
        return ensure("foods", "SELECT id FROM foods WHERE restaurant_id=? AND name=? ORDER BY id LIMIT 1",
                m("restaurant_id", restaurant, "category_id", category, "name", name,
                        "description", description, "base_price", price, "kind", "SINGLE",
                        "image_code", image, "available", true), restaurant, name);
    }

    private long ensureGroup(long food, String name, int min, int max, int sort) {
        return ensure("option_groups", "SELECT id FROM option_groups WHERE food_id=? AND name=? ORDER BY id LIMIT 1",
                m("food_id", food, "name", name, "min_select", min, "max_select", max, "sort_order", sort),
                food, name);
    }

    private long ensureOption(long group, String name, long price) {
        return ensure("option_values", "SELECT id FROM option_values WHERE group_id=? AND name=?",
                m("group_id", group, "name", name, "extra_price", price, "available", true), group, name);
    }

    private void ensureOffer(String code, String name, String kind, Integer percent, Long amount,
                             Long cap, long minSubtotal, String requiredMethod) {
        ensure("offers", "SELECT id FROM offers WHERE code=?",
                m("code", code, "name", name, "kind", kind, "percent", percent,
                        "amount", amount, "cap", cap, "min_subtotal", minSubtotal,
                        "required_method", requiredMethod,
                        "starts_at", Timestamp.from(Instant.parse("2026-01-01T00:00:00Z")),
                        "ends_at", Timestamp.from(Instant.parse("2031-01-01T00:00:00Z")),
                        "enabled", true), code);
    }

    private long ensure(String table, String lookup, Map<String, Object> values, Object... keys) {
        var existing = db.one(lookup, keys);
        return existing == null ? db.insert(table, values) : n(existing, "id");
    }
}
