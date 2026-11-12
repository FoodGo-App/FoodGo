package fit.iuh.foodgobackend.support;

import fit.iuh.foodgobackend.bootstrap.M01FixtureLoader;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.env.MockEnvironment;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

class M01TestDatabaseGuardTests {
    private static final String URL = "jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test";
    private static final AtomicInteger created = new AtomicInteger();
    // Probes instead of real DB components: successful refresh must create all three.
    @Configuration(proxyBeanMethods = false)
    static class WriteProbes {
        @Bean Object dataSourceProbe() { created.incrementAndGet(); return new Object(); }
        @Bean Object flywayProbe() { created.incrementAndGet(); return new Object(); }
        @Bean Object fixtureProbe() { created.incrementAndGet(); return new Object(); }
    }
    private Map<String, Object> valid() {
        return new HashMap<>(Map.of("FOODGO_TEST_DB_URL", URL,
                "FOODGO_TEST_DB_USERNAME", "unit-test-only-user",
                "FOODGO_TEST_DB_PASSWORD", "unit-test-only-placeholder"));
    }
    private ConfigurableApplicationContext start(Map<String, Object> properties) {
        MockEnvironment env = new MockEnvironment(); // No OS secrets or local config.
        env.getPropertySources().addFirst(new MapPropertySource("unit-test-input", properties));
        SpringApplication app = new SpringApplication(WriteProbes.class);
        app.setEnvironment(env);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setLogStartupInfo(false);
        app.setRegisterShutdownHook(false);
        app.addInitializers(new M01TestDatabaseInitializer());
        return app.run("--spring.config.location=classpath:/application-m01-test.properties",
                "--spring.main.banner-mode=off");
    }
    private void rejectedBeforeRefresh(Map<String, Object> props) {
        created.set(0);
        IllegalStateException error = assertThrows(IllegalStateException.class, () -> start(props));
        assertEquals(0, created.get(), "No datasource/migration/fixture probe may be created");
        assertFalse(error.getMessage().contains("unit-test-only-placeholder"));
        assertFalse(error.getMessage().contains("jdbc:"));
    }
    @Test void missingUrlDoesNotFallBackToRuntimeDatabase() {
        Map<String, Object> props = valid();
        props.remove("FOODGO_TEST_DB_URL");
        props.put("spring.datasource.url", "jdbc:mariadb://127.0.0.1:3306/fooddriver");
        rejectedBeforeRefresh(props);
    }
    @Test void missingCredentialsAreRejectedBeforeAnyBean() {
        for (String key : new String[]{"FOODGO_TEST_DB_USERNAME", "FOODGO_TEST_DB_PASSWORD"}) {
            Map<String, Object> props = valid(); props.remove(key); rejectedBeforeRefresh(props);
        }
    }
    @Test void blankConfigurationIsRejected() {
        for (String key : valid().keySet()) {
            Map<String, Object> props = valid(); props.put(key, "  "); rejectedBeforeRefresh(props);
        }
    }
    @Test void unsafeTargetsAndOptionsAreRejectedBeforeAnyBean() {
        for (String url : new String[]{
                "jdbc:mariadb://127.0.0.1:3306/fooddriver",
                "jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test_other",
                "jdbc:mariadb://127.0.0.1:3306/",
                "jdbc:mariadb://remote-host:3306/fooddriver_m01_test",
                "jdbc:mariadb://127.0.0.1:3307/fooddriver_m01_test",
                "jdbc:mariadb://127.0.0.1,remote-host:3306/fooddriver_m01_test",
                URL + "?sessionVariables=sql_mode=ANSI", URL + "/../fooddriver", "not-a-jdbc-url"}) {
            Map<String, Object> props = valid(); props.put("FOODGO_TEST_DB_URL", url);
            rejectedBeforeRefresh(props);
        }
    }
    @Test void approvedConfigPinsBothClientsAndDoesNotImportLocalConfig() {
        Map<String, Object> props = valid();
        for (String key : new String[]{"spring.datasource.url", "spring.datasource.hikari.jdbc-url", "spring.flyway.url"})
            props.put(key, "jdbc:mariadb://127.0.0.1:3306/fooddriver");
        props.put("spring.datasource.hikari.connection-init-sql", "USE fooddriver");
        props.put("spring.flyway.init-sqls", "USE fooddriver");
        props.put("foodgo.seed-enabled", "true");
        props.put("spring.jpa.hibernate.ddl-auto", "create-drop");
        created.set(0);
        try (ConfigurableApplicationContext context = start(props)) {
            var env = context.getEnvironment();
            for (String key : new String[]{"spring.datasource.url", "spring.datasource.hikari.jdbc-url", "spring.flyway.url"})
                assertEquals(URL, env.getProperty(key));
            assertEquals("fooddriver_m01_test", env.getProperty("spring.flyway.schemas"));
            assertEquals("false", env.getProperty("foodgo.seed-enabled"));
            assertEquals("none", env.getProperty("spring.jpa.hibernate.ddl-auto"));
            assertEquals("never", env.getProperty("spring.sql.init.mode"));
            assertEquals("SET time_zone = '+00:00'", env.getProperty("spring.datasource.hikari.connection-init-sql"));
            assertEquals("", env.getProperty("spring.flyway.init-sqls"));
            assertNull(env.getProperty("spring.config.import"));
            assertEquals(3, created.get());
        }
    }
    @Test void fixtureRequiresLocalAndExplicitOptInAndNeverRunsInTestOrProd() {
        for (String profiles : new String[]{"", "local", "m01-test", "local,m01-test", "local,test", "local,prod"}) {
            new ApplicationContextRunner().withUserConfiguration(M01FixtureLoader.class)
                    .withPropertyValues("spring.profiles.active=" + profiles, "foodgo.seed-enabled=false")
                    .run(context -> {
                        assertNull(context.getStartupFailure());
                        assertEquals(0, context.getBeansOfType(M01FixtureLoader.class).size());
                    });
        }
        for (String profiles : new String[]{"m01-test", "local,m01-test", "local,test", "local,prod", ""}) {
            new ApplicationContextRunner().withUserConfiguration(M01FixtureLoader.class)
                    .withPropertyValues("spring.profiles.active=" + profiles, "foodgo.seed-enabled=true")
                    .run(context -> {
                        assertNull(context.getStartupFailure());
                        assertEquals(0, context.getBeansOfType(M01FixtureLoader.class).size());
                    });
        }
    }

    @Test void fixtureIsAvailableOnlyWithExplicitLocalOptIn() {
        new ApplicationContextRunner().withUserConfiguration(M01FixtureLoader.class)
                .withBean(jakarta.persistence.EntityManagerFactory.class,
                        () -> org.mockito.Mockito.mock(jakarta.persistence.EntityManagerFactory.class))
                .withBean(fit.iuh.foodgobackend.common.JpaSql.class,
                        fit.iuh.foodgobackend.common.JpaSql::new)
                .withPropertyValues("spring.profiles.active=local", "foodgo.seed-enabled=true")
                .run(context -> {
                    assertNull(context.getStartupFailure());
                    assertEquals(1, context.getBeansOfType(M01FixtureLoader.class).size());
                    // ApplicationContextRunner never invokes CommandLineRunner.run().
                });
        new ApplicationContextRunner().withUserConfiguration(M01FixtureLoader.class)
                .withPropertyValues("spring.profiles.active=local")
                .run(context -> {
                    assertNull(context.getStartupFailure());
                    assertEquals(0, context.getBeansOfType(M01FixtureLoader.class).size());
                });
    }
}
