package fit.iuh.foodgobackend;
import fit.iuh.foodgobackend.common.JpaSql;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
@org.springframework.test.context.ActiveProfiles("flow-test")
@org.springframework.test.context.ContextConfiguration(initializers=fit.iuh.foodgobackend.support.FlowTestDatabaseInitializer.class)
@SpringBootTest(properties="spring.config.location=classpath:/application-flow-test.properties")
@EnabledIfSystemProperty(named="foodgo.integration",matches="true")
@Transactional
class JpaSqlIntegrationTests {
 @Autowired JpaSql db;
 @Autowired fit.iuh.foodgobackend.account.AuthService auth;
 @BeforeEach void isolatedDatabase(){assertTrue(fit.iuh.foodgobackend.common.Data.s(db.required("SELECT DATABASE() AS name").get("name")).startsWith("fooddriver_it_"));}
 @Test void nativeWriteReadAndGeneratedKey(){long id=db.insert("categories",Map.of("name","test-"+UUID.randomUUID()));assertTrue(id>0);assertEquals(id,((Number)db.required("SELECT id FROM categories WHERE id=?",id).get("id")).longValue());}
 @Test void nativeUtcTimestampSerializesWithoutJvmTimezoneShift(){var row=db.required("SELECT UTC_TIMESTAMP(3) AS stamp,CAST(UTC_TIMESTAMP(3) AS CHAR) AS raw");var expected=java.time.LocalDateTime.parse(row.get("raw").toString().replace(' ','T')).toInstant(java.time.ZoneOffset.UTC);assertEquals(expected,fit.iuh.foodgobackend.common.Data.instant(row.get("stamp")),"Native timestamp type="+row.get("stamp").getClass().getName()+" value="+row.get("stamp"));}
 @Test void boundAndDatabaseDefaultTimesRemainUtc(){var now=java.time.Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS);long user=db.insert("users",fit.iuh.foodgobackend.common.Data.m("username","utc-"+UUID.randomUUID(),"display_name","UTC test","role","CUSTOMER","password_hash","test-only"));var created=fit.iuh.foodgobackend.common.Data.instant(db.required("SELECT created_at FROM users WHERE id=?",user).get("created_at"));assertTrue(Math.abs(java.time.Duration.between(now,created).toMillis())<5000);var expiry=now.plusSeconds(120);long id=db.insert("auth_sessions",fit.iuh.foodgobackend.common.Data.m("user_id",user,"token_hash",fit.iuh.foodgobackend.common.Data.hash(UUID.randomUUID().toString()),"expires_at",java.sql.Timestamp.from(expiry)));assertEquals(expiry,fit.iuh.foodgobackend.common.Data.instant(db.required("SELECT expires_at FROM auth_sessions WHERE id=?",id).get("expires_at")));}
 @Test void loginReadsNullableUserColumns(){String username="sql-"+UUID.randomUUID();db.insert("users",fit.iuh.foodgobackend.common.Data.m("username",username,"display_name","Khách","role","CUSTOMER","password_hash",new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("TestOnly@123")));assertNotNull(auth.login(username,"TestOnly@123").get("token"));}
}
