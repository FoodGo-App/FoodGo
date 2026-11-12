package fit.iuh.foodgobackend.support;
import fit.iuh.foodgobackend.FoodgoBackendApplication;
import fit.iuh.foodgobackend.common.*;
import org.springframework.boot.SpringApplication;
import org.springframework.transaction.support.TransactionTemplate;
import java.nio.file.*;
public final class TestServerLauncher {
 public static void main(String[] args)throws Exception{
  TestDatabaseProbe.main(new String[0]);
  var app=new SpringApplication(FoodgoBackendApplication.class);app.addInitializers(new M01TestDatabaseInitializer());app.setAdditionalProfiles("m01-test");
  var ctx=app.run("--spring.config.location=classpath:/application-m01-test.properties","--server.port=18080","--foodgo.cors-origins=http://127.0.0.1:8093,http://localhost:8093");
  var f=ctx.getBean(TransactionTemplate.class).execute(tx->M01M02TestData.create(ctx.getBean(JpaSql.class)));
  Files.writeString(Path.of(args[0]),Data.json(Data.m("apiUrl","http://127.0.0.1:18080/api/v1","username",f.username(),"otherUsername",f.otherUsername(),"restaurantUsername",f.restaurantUsername(),"driverUsername",f.driverUsername(),"foodId",Long.toString(f.food()),"secondFoodId",Long.toString(f.secondFood()),"restaurantId",Long.toString(f.restaurant()),"smallOptionId",Long.toString(f.small()),"largeOptionId",Long.toString(f.large()),"database","fooddriver_m01_test")));
  System.out.println("CONTROLLED_TEST_SERVER_READY: metadata written without password/token.");
 }
}
