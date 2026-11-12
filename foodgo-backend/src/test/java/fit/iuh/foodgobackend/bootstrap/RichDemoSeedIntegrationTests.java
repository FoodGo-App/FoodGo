package fit.iuh.foodgobackend.bootstrap;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@org.springframework.test.context.ActiveProfiles("flow-test")
@org.springframework.test.context.ContextConfiguration(initializers=fit.iuh.foodgobackend.support.FlowTestDatabaseInitializer.class)
@SpringBootTest(properties="spring.config.location=classpath:/application-flow-test.properties")
@EnabledIfSystemProperty(named="foodgo.integration",matches="true")
class RichDemoSeedIntegrationTests {
 @Autowired RichDemoSeedService rich;
 @Autowired DemoSeedService basic;
 @Autowired JdbcTemplate db;
 Map<String,Long> counts(){var r=new TreeMap<String,Long>();for(String t:List.of("users","restaurants","foods","carts","cart_items","offers","orders","checkout_quotes","checkout_attempts","order_items","order_events","driver_offers","messages","driver_reviews","favorites","addresses","option_groups","option_values"))r.put(t,db.queryForObject("SELECT COUNT(*) FROM "+t,Long.class));return r;}
 @Test void richDatasetIsConsistentIdempotentAndPreservesOriginalData(){
  assertTrue(db.queryForObject("SELECT DATABASE()",String.class).startsWith("fooddriver_it_"));basic.seed();
  var before=db.queryForList("SELECT u.*,c.id AS cart_id,c.version AS cart_version,c.restaurant_id AS cart_restaurant FROM users u LEFT JOIN carts c ON c.customer_id=u.id WHERE u.username IN ('customer-1','customer-2','restaurant-1','driver-1','driver-2') ORDER BY u.id");
  rich.seed();
  assertEquals(120,db.queryForObject("SELECT COUNT(*) FROM order_events WHERE event_type='SAMPLE_ORDER_CREATED'",Integer.class));
  assertEquals(100,db.queryForObject("SELECT COUNT(*) FROM foods f JOIN restaurants r ON r.id=f.restaurant_id WHERE r.name LIKE '[Mẫu] %'",Integer.class));
  assertEquals(10,db.queryForObject("SELECT COUNT(*) FROM restaurants WHERE name LIKE '[Mẫu] %'",Integer.class));
  assertEquals(20,db.queryForObject("SELECT COUNT(*) FROM offers WHERE code LIKE 'MAU%' AND restaurant_id IS NOT NULL",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM driver_offers f JOIN users u ON u.id=f.driver_id JOIN order_events e ON e.order_id=f.order_id AND e.event_type='SAMPLE_ORDER_CREATED' WHERE u.username NOT LIKE 'sample.%' AND f.status IN ('OFFERED','ACCEPTED')",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM orders WHERE total<>subtotal+delivery_fee-food_discount-delivery_discount",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM orders o WHERE NOT EXISTS(SELECT 1 FROM order_items i WHERE i.order_id=o.id)",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM users u JOIN orders o ON o.id=u.active_order_id WHERE o.driver_id<>u.id OR o.status IN ('DELIVERED','CANCELLED','REJECTED')",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM driver_reviews r JOIN orders o ON o.id=r.order_id WHERE o.status<>'DELIVERED' OR o.driver_id<>r.driver_id OR o.customer_id<>r.customer_id",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM messages m JOIN orders o ON o.id=m.order_id WHERE m.sender_id<>o.customer_id AND m.sender_id<>o.driver_id",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM orders o WHERE o.status IN ('CANCELLED','REJECTED') AND o.payment_method='MOCK_WALLET' AND o.payment_status<>'REFUNDED'",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM orders o JOIN driver_offers f ON f.order_id=o.id AND f.status='ACCEPTED' WHERE o.assigned_at>f.expires_at OR o.assigned_at<>f.responded_at",Integer.class));
  assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM driver_offers WHERE status='EXPIRED' AND responded_at<expires_at",Integer.class));
  var after=counts();rich.seed();assertEquals(after,counts());
  assertEquals(before,db.queryForList("SELECT u.*,c.id AS cart_id,c.version AS cart_version,c.restaurant_id AS cart_restaurant FROM users u LEFT JOIN carts c ON c.customer_id=u.id WHERE u.username IN ('customer-1','customer-2','restaurant-1','driver-1','driver-2') ORDER BY u.id"));
 }
}
