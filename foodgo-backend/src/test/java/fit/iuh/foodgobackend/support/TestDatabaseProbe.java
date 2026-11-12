package fit.iuh.foodgobackend.support;
import org.springframework.context.support.GenericApplicationContext;
import java.sql.*;
public final class TestDatabaseProbe {
 public static void main(String[] args){try(var ctx=new GenericApplicationContext()){
  new M01TestDatabaseInitializer().initialize(ctx);var e=ctx.getEnvironment();
  try(var c=DriverManager.getConnection(e.getRequiredProperty("spring.datasource.url"),e.getRequiredProperty("spring.datasource.username"),e.getRequiredProperty("spring.datasource.password"))){
   if(!"fooddriver_m01_test".equals(c.getCatalog()))throw new IllegalStateException("Wrong database; stopped before Spring/Flyway.");
   boolean denied=false;try(var s=c.createStatement()){s.execute("USE fooddriver");}catch(SQLException ex){if(ex.getErrorCode()==1044||ex.getErrorCode()==1142)denied=true;}
   if(!denied)throw new IllegalStateException("Cannot prove access to fooddriver is denied; stopped.");
  }
  System.out.println("TEST_DB_PRECHECK_OK: dedicated database; fooddriver access denied; no writes performed.");
 }catch(SQLException ex){throw new IllegalStateException("Test database connection failed (connection details hidden).");}}
}
