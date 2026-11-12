package fit.iuh.foodgobackend;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import fit.iuh.foodgobackend.bootstrap.DemoSeedService;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
@org.springframework.test.context.ActiveProfiles("flow-test")
@org.springframework.test.context.ContextConfiguration(initializers=fit.iuh.foodgobackend.support.FlowTestDatabaseInitializer.class)
@SpringBootTest(properties="spring.config.location=classpath:/application-flow-test.properties")
@EnabledIfSystemProperty(named="foodgo.integration",matches="true")
@Transactional
class SeedMariaDbIntegrationTests {
 @Autowired DemoSeedService seed;
 @Autowired JdbcTemplate db;
 @BeforeEach void isolatedDatabase(){assertTrue(db.queryForObject("SELECT DATABASE()",String.class).startsWith("fooddriver_it_"));}
 Map<String,Long> counts(){var result=new LinkedHashMap<String,Long>();for(String t:List.of("users","categories","restaurants","foods","option_groups","option_values","offers","addresses","carts","cart_items","cart_item_options"))result.put(t,db.queryForObject("SELECT COUNT(*) FROM "+t,Long.class));return result;}
 @Test void repeatedSeedDoesNotDuplicateOrOverwriteCredentials(){seed.seed();var before=counts();String changed=new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("ChangedOnlyInTest");db.update("UPDATE users SET password_hash=? WHERE username='customer-1'",changed);seed.seed();assertEquals(before,counts());assertEquals(changed,db.queryForObject("SELECT password_hash FROM users WHERE username='customer-1'",String.class));}
 @Test void clearedCartIsNotRefilledOnNextSeed(){seed.seed();long cart=db.queryForObject("SELECT c.id FROM carts c JOIN users u ON c.customer_id=u.id WHERE u.username='customer-1'",Long.class);db.update("DELETE FROM cart_items WHERE cart_id=?",cart);db.update("UPDATE carts SET restaurant_id=NULL,version=version+1 WHERE id=?",cart);seed.seed();assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM cart_items WHERE cart_id=?",Integer.class,cart));}
}
