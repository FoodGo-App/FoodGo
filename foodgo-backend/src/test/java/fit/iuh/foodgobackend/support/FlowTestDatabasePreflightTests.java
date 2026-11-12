package fit.iuh.foodgobackend.support;
import org.junit.jupiter.api.Test;
import java.sql.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class FlowTestDatabasePreflightTests {
 record Fixture(Connection connection,List<String> queries){}
 Fixture fixture(int alter,int history,int failed)throws Exception{
  return fixture(alter,1,history,failed);
 }
 Fixture fixture(int alter,int trigger,int history,int failed)throws Exception{
  var connection=mock(Connection.class);var queries=new ArrayList<String>();
  when(connection.prepareStatement(anyString())).thenAnswer(call->{
   String sql=call.getArgument(0);queries.add(sql);assertTrue(sql.startsWith("SELECT "),"Preflight must never mutate DB");
   int count=sql.contains("PRIVILEGE_TYPE='TRIGGER'")?trigger:sql.contains("SCHEMA_PRIVILEGES")?alter:sql.contains("information_schema.TABLES")?history:failed;
   var statement=mock(PreparedStatement.class);var result=mock(ResultSet.class);when(result.next()).thenReturn(true);when(result.getInt(1)).thenReturn(count);when(statement.executeQuery()).thenReturn(result);return statement;
  });return new Fixture(connection,queries);
 }
 @Test void missingAlterStopsWithoutDdlOrHistoryMutation()throws Exception{var f=fixture(0,1,1);var error=assertThrows(IllegalStateException.class,()->FlowTestDatabasePreflight.verify(f.connection()));assertTrue(error.getMessage().contains("ALTER"));assertEquals(1,f.queries().size());verify(f.connection(),never()).createStatement();}
 @Test void missingTriggerStopsBeforeRollbackTestCanWrite()throws Exception{var f=fixture(1,0,0,0);var error=assertThrows(IllegalStateException.class,()->FlowTestDatabasePreflight.verify(f.connection()));assertTrue(error.getMessage().contains("TRIGGER"));assertEquals(2,f.queries().size());verify(f.connection(),never()).createStatement();}
 @Test void failedMigrationStopsBeforeAnyTestWrites()throws Exception{var f=fixture(1,1,1);var error=assertThrows(IllegalStateException.class,()->FlowTestDatabasePreflight.verify(f.connection()));assertTrue(error.getMessage().contains("failed migration"));assertEquals(4,f.queries().size());}
 @Test void freshSchemaWithRequiredAlterPassesReadOnly()throws Exception{var f=fixture(1,0,0);assertDoesNotThrow(()->FlowTestDatabasePreflight.verify(f.connection()));assertEquals(3,f.queries().size());}
 @Test void validHistoryAndNarrowTableGrantAreAccepted()throws Exception{var f=fixture(1,1,0);assertDoesNotThrow(()->FlowTestDatabasePreflight.verify(f.connection()));assertTrue(f.queries().getFirst().contains("information_schema.TABLE_PRIVILEGES"));assertTrue(f.queries().getFirst().contains("TABLE_NAME='users'"));assertTrue(f.queries().get(1).contains("TABLE_NAME='order_items'"));assertEquals(4,f.queries().size());}
}
