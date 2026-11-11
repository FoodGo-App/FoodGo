package fit.iuh.foodgobackend;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import fit.iuh.foodgobackend.ordering.OrderPolicy;
import fit.iuh.foodgobackend.common.ApiException;
class OrderPolicyTests {
 @Test void terminalStates(){assertTrue(OrderPolicy.terminal("DELIVERED"));assertTrue(OrderPolicy.terminal("CANCELLED"));assertFalse(OrderPolicy.terminal("READY_FOR_PICKUP"));}
 @Test void codCannotFinishWithoutCollection(){assertThrows(ApiException.class,()->OrderPolicy.cod("COD",false));OrderPolicy.cod("COD",true);}
 @Test void walletMustNeverCollectCash(){assertThrows(ApiException.class,()->OrderPolicy.cod("MOCK_WALLET",true));OrderPolicy.cod("MOCK_WALLET",false);}
}
