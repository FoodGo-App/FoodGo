package fit.iuh.foodgobackend.support;
/** Main flow tests use a separate exact allowlist, never the M01 or application database. */
public final class FlowTestDatabaseInitializer extends PinnedTestDatabaseInitializer {
 public FlowTestDatabaseInitializer(){super("fooddriver_it_m01_m05","foodgo.flow.test.db","FOODGO_FLOW_TEST_DB");}
}
