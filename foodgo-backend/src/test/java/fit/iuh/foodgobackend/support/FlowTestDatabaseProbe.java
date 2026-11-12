package fit.iuh.foodgobackend.support;
import org.springframework.context.support.GenericApplicationContext;
import java.sql.*;
/** Read-only precheck to run before opting in to DB-backed flow tests. */
public final class FlowTestDatabaseProbe {
 public static void main(String[] args){try(var ctx=new GenericApplicationContext()){
  new FlowTestDatabaseInitializer().initialize(ctx);var e=ctx.getEnvironment();
  try(var c=DriverManager.getConnection(e.getRequiredProperty("spring.datasource.url"),e.getRequiredProperty("spring.datasource.username"),e.getRequiredProperty("spring.datasource.password"))){
   if(!"fooddriver_it_m01_m05".equals(c.getCatalog()))throw new IllegalStateException("Wrong flow test database; stopped before Spring/Flyway.");
   for(String name:new String[]{"fooddriver","fooddriver_m01_test"}){
    boolean denied=false;try(var q=c.createStatement()){q.execute("USE "+name);}catch(SQLException ex){denied=ex.getErrorCode()==1044||ex.getErrorCode()==1142;}
    if(!denied)throw new IllegalStateException("Cannot prove other FoodGo databases are denied; stopped before writes.");
   }
   FlowTestDatabasePreflight.verify(c);
  }
  System.out.println("FLOW_TEST_DB_PRECHECK_OK: dedicated flow database; other FoodGo databases denied; ALTER/history precheck passed; no writes.");
 }catch(SQLException ex){throw new IllegalStateException("Flow test database connection failed (details hidden).");}}
}
