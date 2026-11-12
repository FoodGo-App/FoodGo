package fit.iuh.foodgobackend;

import fit.iuh.foodgobackend.support.M01TestDatabaseInitializer;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.config.location=classpath:/application-m01-test.properties")
@ActiveProfiles("m01-test")
@ContextConfiguration(initializers = M01TestDatabaseInitializer.class)
class FoodgoBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
