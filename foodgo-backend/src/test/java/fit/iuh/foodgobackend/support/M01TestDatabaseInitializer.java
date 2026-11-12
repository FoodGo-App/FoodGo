package fit.iuh.foodgobackend.support;
/** Existing M01 policy remains exact; shared pinning runs before context refresh. */
public final class M01TestDatabaseInitializer extends PinnedTestDatabaseInitializer {
 public M01TestDatabaseInitializer(){super("fooddriver_m01_test","foodgo.test.db","FOODGO_TEST_DB");}
}
