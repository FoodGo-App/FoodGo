package fit.iuh.foodgobackend.support;
import org.junit.jupiter.api.Test;
import org.springframework.boot.*;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.*;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import fit.iuh.foodgobackend.bootstrap.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
class FlowTestDatabaseGuardTests {
 static final String URL="jdbc:mariadb://127.0.0.1:3306/fooddriver_it_m01_m05";
 static final AtomicInteger created=new AtomicInteger();
 @Configuration(proxyBeanMethods=false) static class Probes {
  @Bean Object dataSourceProbe(){created.incrementAndGet();return new Object();}
  @Bean Object flywayProbe(){created.incrementAndGet();return new Object();}
  @Bean Object fixtureProbe(){created.incrementAndGet();return new Object();}
 }
 Map<String,Object> valid(){return new HashMap<>(Map.of("FOODGO_FLOW_TEST_DB_URL",URL,"FOODGO_FLOW_TEST_DB_USERNAME","offline-unit-user","FOODGO_FLOW_TEST_DB_PASSWORD","offline-placeholder"));}
 ConfigurableApplicationContext start(Map<String,Object> props){
  var env=new MockEnvironment();env.getPropertySources().addFirst(new MapPropertySource("unit-only",props));
  var app=new SpringApplication(Probes.class);app.setEnvironment(env);app.setWebApplicationType(WebApplicationType.NONE);app.setRegisterShutdownHook(false);app.setLogStartupInfo(false);app.addInitializers(new FlowTestDatabaseInitializer());
  return app.run("--spring.config.location=classpath:/application-flow-test.properties","--spring.main.banner-mode=off");
 }
 void reject(Map<String,Object> props){created.set(0);var error=assertThrows(IllegalStateException.class,()->start(props));assertEquals(0,created.get());assertFalse(error.getMessage().contains("offline-placeholder"));assertFalse(error.getMessage().contains("jdbc:"));}
 @Test void missingOrBlankNeverFallsBackToRuntimeOrM01(){
  for(String key:valid().keySet()){for(String missing:new String[]{"missing","blank"}){var p=valid();if(missing.equals("missing"))p.remove(key);else p.put(key," ");p.put("spring.datasource.url","jdbc:mariadb://127.0.0.1:3306/fooddriver");p.put("FOODGO_TEST_DB_URL","jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test");reject(p);}}
 }
 @Test void unsafeTargetsFailBeforeAnyWriteProbe(){
  for(String url:new String[]{"jdbc:mariadb://127.0.0.1:3306/fooddriver","jdbc:mariadb://127.0.0.1:3306/fooddriver_m01_test",URL+"_other",URL+"?sessionVariables=sql_mode=ANSI",URL+"/../fooddriver",URL.replace("127.0.0.1","remote-host"),URL.replace(":3306",":3307")}){var p=valid();p.put("FOODGO_FLOW_TEST_DB_URL",url);reject(p);}
 }
 @Test void approvedFlowPinsBothClientsSeedsAndUtcBeforeRefresh(){
  var p=valid();for(String key:new String[]{"spring.datasource.url","spring.datasource.hikari.jdbc-url","spring.flyway.url"})p.put(key,"jdbc:mariadb://127.0.0.1:3306/fooddriver");
  p.put("foodgo.seed-enabled","true");p.put("foodgo.rich-seed-enabled","true");p.put("spring.flyway.init-sqls","USE fooddriver");p.put("spring.datasource.hikari.connection-init-sql","USE fooddriver");created.set(0);
  try(var ctx=start(p)){var e=ctx.getEnvironment();assertEquals(3,created.get());for(String key:new String[]{"spring.datasource.url","spring.datasource.hikari.jdbc-url","spring.flyway.url"})assertEquals(URL,e.getProperty(key));assertEquals("fooddriver_it_m01_m05",e.getProperty("spring.flyway.schemas"));assertEquals("false",e.getProperty("foodgo.seed-enabled"));assertEquals("false",e.getProperty("foodgo.rich-seed-enabled"));assertEquals("true",e.getProperty("spring.flyway.clean-disabled"));assertEquals("false",e.getProperty("spring.flyway.create-schemas"));assertEquals("none",e.getProperty("spring.jpa.hibernate.ddl-auto"));assertEquals("never",e.getProperty("spring.sql.init.mode"));assertEquals("SET time_zone = '+00:00'",e.getProperty("spring.datasource.hikari.connection-init-sql"));assertEquals("",e.getProperty("spring.flyway.init-sqls"));assertEquals("TRANSACTION_READ_COMMITTED",e.getProperty("spring.datasource.hikari.transaction-isolation"));assertEquals("true",e.getProperty("spring.jpa.properties.hibernate.query.native.prefer_jdbc_datetime_types"));assertNull(e.getProperty("spring.config.import"));}
 }
 @Test void m01PolicyDoesNotAcceptFlowDatabase(){var ctx=new org.springframework.context.support.GenericApplicationContext();var env=new MockEnvironment();env.setProperty("FOODGO_TEST_DB_URL",URL);env.setProperty("FOODGO_TEST_DB_USERNAME","unit");env.setProperty("FOODGO_TEST_DB_PASSWORD","placeholder");ctx.setEnvironment(env);assertThrows(IllegalStateException.class,()->new M01TestDatabaseInitializer().initialize(ctx));ctx.close();}
 @Test void automaticRunnersCannotLoadInEitherTestProfileEvenWithOptIn(){
  for(String profiles:new String[]{"m01-test","flow-test","local,flow-test","local,m01-test","local,test","local,prod"})new ApplicationContextRunner().withUserConfiguration(M01FixtureLoader.class,M02FixtureLoader.class,DemoSeedRunner.class,RichDemoSeedRunner.class).withPropertyValues("spring.profiles.active="+profiles,"foodgo.seed-enabled=true","foodgo.rich-seed-enabled=true").run(c->{assertNull(c.getStartupFailure());assertEquals(0,c.getBeansOfType(M01FixtureLoader.class).size());assertEquals(0,c.getBeansOfType(M02FixtureLoader.class).size());assertEquals(0,c.getBeansOfType(DemoSeedRunner.class).size());assertEquals(0,c.getBeansOfType(RichDemoSeedRunner.class).size());});
 }
}
