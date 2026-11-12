package fit.iuh.foodgobackend.support;
import java.sql.*;
/** Read-only metadata checks; never grants or repairs/changes a schema. */
final class FlowTestDatabasePreflight {
 static final String DATABASE="fooddriver_it_m01_m05";
 static final String GRANTEE="GRANTEE=CONCAT(QUOTE(SUBSTRING_INDEX(CURRENT_USER(),'@',1)),'@',QUOTE(SUBSTRING_INDEX(CURRENT_USER(),'@',-1)))";
 static void verify(Connection connection)throws SQLException {
  String permission="SELECT COUNT(*) FROM (SELECT PRIVILEGE_TYPE FROM information_schema.SCHEMA_PRIVILEGES WHERE TABLE_SCHEMA=? AND "+GRANTEE+" AND PRIVILEGE_TYPE='ALTER' UNION ALL SELECT PRIVILEGE_TYPE FROM information_schema.TABLE_PRIVILEGES WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND "+GRANTEE+" AND PRIVILEGE_TYPE='ALTER') permitted";
  try(var query=connection.prepareStatement(permission)){
   query.setString(1,DATABASE);query.setString(2,DATABASE);
   try(var result=query.executeQuery()){
    if(!result.next()||result.getInt(1)==0)throw new IllegalStateException("Flow precheck: V1 requires direct ALTER privilege on test users table (or test schema); no writes performed.");
   }
  }
  String triggerPermission="SELECT COUNT(*) FROM (SELECT PRIVILEGE_TYPE FROM information_schema.SCHEMA_PRIVILEGES WHERE TABLE_SCHEMA=? AND "+GRANTEE+" AND PRIVILEGE_TYPE='TRIGGER' UNION ALL SELECT PRIVILEGE_TYPE FROM information_schema.TABLE_PRIVILEGES WHERE TABLE_SCHEMA=? AND TABLE_NAME='order_items' AND "+GRANTEE+" AND PRIVILEGE_TYPE='TRIGGER') permitted";
  try(var query=connection.prepareStatement(triggerPermission)){
   query.setString(1,DATABASE);query.setString(2,DATABASE);
   try(var result=query.executeQuery()){
    if(!result.next()||result.getInt(1)==0)throw new IllegalStateException("Flow precheck: checkout rollback test requires TRIGGER privilege on test order_items (or test schema); no writes performed.");
   }
  }
  boolean history;
  try(var query=connection.prepareStatement("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='flyway_schema_history'")){
   query.setString(1,DATABASE);try(var result=query.executeQuery()){history=result.next()&&result.getInt(1)>0;}
  }
  if(history)try(var query=connection.prepareStatement("SELECT COUNT(*) FROM fooddriver_it_m01_m05.flyway_schema_history WHERE success=0");var result=query.executeQuery()){
   if(result.next()&&result.getInt(1)>0)throw new IllegalStateException("Flow precheck: failed migration history found; stop and review partial schema with its owner. No repair, reset or writes performed.");
  }
 }
 private FlowTestDatabasePreflight(){}
}
