package fit.iuh.foodgobackend.support;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import java.util.LinkedHashMap;
import java.util.Map;

/** Runs before refresh: no DataSource, Flyway, JPA or runner exists yet. */
public class PinnedTestDatabaseInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    private final String database, propertyPrefix, environmentPrefix;
    protected PinnedTestDatabaseInitializer(String database, String propertyPrefix, String environmentPrefix) {
        this.database=database; this.propertyPrefix=propertyPrefix; this.environmentPrefix=environmentPrefix;
    }
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        ConfigurableEnvironment env = context.getEnvironment();
        String url = required(env, propertyPrefix+".url", environmentPrefix+"_URL");
        // No URL options (including init SQL), multi-host, encoding or remote hosts.
        if (!url.matches("jdbc:mariadb://(?:127\\.0\\.0\\.1|localhost):3306/"+java.util.regex.Pattern.quote(database))) {
            throw new IllegalStateException("Dedicated tests require loopback:3306/"+database+"; URL rejected (value hidden).");
        }
        String username = required(env, propertyPrefix+".username", environmentPrefix+"_USERNAME");
        String password = required(env, propertyPrefix+".password", environmentPrefix+"_PASSWORD");
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
        safe.put("spring.flyway.default-schema", database);
        safe.put("spring.flyway.schemas", database);
        safe.put("spring.flyway.create-schemas", "false");
        safe.put("spring.flyway.clean-disabled", "true");
        safe.put("spring.flyway.init-sqls", "");
        safe.put("spring.jpa.hibernate.ddl-auto", "none");
        safe.put("spring.sql.init.mode", "never");
        safe.put("foodgo.seed-enabled", "false");
        safe.put("foodgo.rich-seed-enabled", "false");
        safe.put("foodgo.rich-seed-exit", "false");
        safe.put("spring.datasource.hikari.transaction-isolation", "TRANSACTION_READ_COMMITTED");
        safe.put("spring.jpa.properties.hibernate.query.native.prefer_jdbc_datetime_types", "true");
        env.getPropertySources().addFirst(new MapPropertySource("validated-test-"+database, safe));
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
