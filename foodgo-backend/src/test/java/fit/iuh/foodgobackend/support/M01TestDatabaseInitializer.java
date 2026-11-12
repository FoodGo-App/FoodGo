package fit.iuh.foodgobackend.support;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import java.util.LinkedHashMap;
import java.util.Map;

/** Runs before refresh: no DataSource, Flyway, JPA or runner exists yet. */
public final class M01TestDatabaseInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        ConfigurableEnvironment env = context.getEnvironment();
        String url = required(env, "foodgo.test.db.url", "FOODGO_TEST_DB_URL");
        // No URL options (including init SQL), multi-host, encoding or remote hosts.
        if (!url.matches("jdbc:mariadb://(?:127\\.0\\.0\\.1|localhost):3306/fooddriver_m01_test")) {
            throw new IllegalStateException("M01 tests require loopback:3306/fooddriver_m01_test; URL rejected (value hidden).");
        }
        String username = required(env, "foodgo.test.db.username", "FOODGO_TEST_DB_USERNAME");
        String password = required(env, "foodgo.test.db.password", "FOODGO_TEST_DB_PASSWORD");
        Map<String, Object> safe = new LinkedHashMap<>();
        safe.put("spring.datasource.url", url);
        safe.put("spring.datasource.username", username);
        safe.put("spring.datasource.password", password);
        safe.put("spring.datasource.hikari.jdbc-url", url);
        safe.put("spring.datasource.hikari.username", username);
        safe.put("spring.datasource.hikari.password", password);
        safe.put("spring.datasource.hikari.connection-init-sql", "SET time_zone = '+00:00'");
        // Pin Flyway too: an external Flyway URL must not bypass the guard.
        safe.put("spring.flyway.url", url);
        safe.put("spring.flyway.user", username);
        safe.put("spring.flyway.password", password);
        safe.put("spring.flyway.default-schema", "fooddriver_m01_test");
        safe.put("spring.flyway.schemas", "fooddriver_m01_test");
        safe.put("spring.flyway.create-schemas", "false");
        safe.put("spring.flyway.clean-disabled", "true");
        safe.put("spring.flyway.init-sqls", "");
        safe.put("spring.jpa.hibernate.ddl-auto", "none");
        safe.put("spring.sql.init.mode", "never");
        safe.put("foodgo.seed-enabled", "false");
        env.getPropertySources().addFirst(new MapPropertySource("m01-validated-database", safe));
    }
    private static String required(ConfigurableEnvironment env, String key, String variable) {
        String value = env.getProperty(key);
        if (value == null || value.isBlank()) value = env.getProperty(variable);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing dedicated M01 test configuration: " + variable + " (value hidden).");
        }
        return value;
    }
}
