package fit.iuh.foodgobackend;

import fit.iuh.foodgobackend.common.Data;
import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import static org.junit.jupiter.api.Assertions.*;

/** No Spring context or JDBC. Checks the exact payload used by the HTTP test. */
class SnapshotOrderFixtureTests {
 @Test void snapshotInsertSatisfiesAllSixOrdersChecksInV1() throws Exception {
  String ddl;
  try(var input=getClass().getResourceAsStream("/db/migration/V1__foodgo_21_tables.sql")){
   assertNotNull(input);
   ddl=new String(input.readAllBytes(),StandardCharsets.UTF_8).lines()
    .filter(line->line.startsWith("CREATE TABLE orders ")).findFirst().orElseThrow();
  }
  var payload=M01M02HttpTests.snapshotOrderFixture(7,9);
  for(String column:new String[]{"status","delivery_status","payment_status","payment_method"}){
   var check=Pattern.compile("CHECK\\("+Pattern.quote(column)+" IN \\(([^)]+)\\)\\)").matcher(ddl);
   assertTrue(check.find(),"V1 must define the enum CHECK for "+column);
   var literals=Pattern.compile("'([^']+)'").matcher(check.group(1));
   boolean allowed=false;
   while(literals.find())allowed|=literals.group(1).equals(payload.get(column));
   assertTrue(allowed,"Fixture violates V1 CHECK for "+column);
  }
  assertTrue(ddl.contains("CHECK(total=subtotal+delivery_fee-food_discount-delivery_discount)"));
  assertEquals(Data.n(payload,"subtotal")+Data.n(payload,"delivery_fee")-Data.n(payload,"food_discount")-Data.n(payload,"delivery_discount"),Data.n(payload,"total"));
  assertTrue(ddl.contains("CHECK(subtotal>=0 AND delivery_fee>=0 AND food_discount>=0 AND delivery_discount>=0 AND total>=0)"));
  for(String column:new String[]{"subtotal","delivery_fee","food_discount","delivery_discount","total"})
   assertTrue(Data.n(payload,column)>=0,"Fixture has negative "+column);
 }
}
