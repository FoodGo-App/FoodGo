package fit.iuh.foodgobackend.fulfillment;

import fit.iuh.foodgobackend.common.ApiException;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;

class FulfillmentRulesTests {
 @Test void restaurantActionsRequireExactPredecessorOrRecordedRepeat() {
  FulfillmentRules.restaurant("PENDING_CONFIRMATION", "accept", false);
  FulfillmentRules.restaurant("DELIVERED", "accept", true);
  assertThrows(ApiException.class, () -> FulfillmentRules.restaurant("CONFIRMED", "ready", false));
  assertThrows(ApiException.class, () -> FulfillmentRules.restaurant("CONFIRMED", "reject", false));
 }
 @Test void retryRequiresNoDriverAndNonterminalPreparationState() {
  FulfillmentRules.retry("READY_FOR_PICKUP", "NO_DRIVER", null);
  assertThrows(ApiException.class, () -> FulfillmentRules.retry("DELIVERED", "NO_DRIVER", null));
  assertThrows(ApiException.class, () -> FulfillmentRules.retry("CONFIRMED", "FINDING_DRIVER", null));
  assertThrows(ApiException.class, () -> FulfillmentRules.retry("PREPARING", "NO_DRIVER", 7L));
 }
 @Test void offersRejectExpiryBoundaryAndOldRounds() {
  Instant now = Instant.parse("2026-11-11T00:00:00Z");
  FulfillmentRules.offer("OFFERED", 2, 2, now.plusSeconds(1), now);
  assertThrows(ApiException.class, () -> FulfillmentRules.offer("OFFERED", 2, 2, now, now));
  assertThrows(ApiException.class, () -> FulfillmentRules.offer("OFFERED", 1, 2, now.plusSeconds(30), now));
  assertThrows(ApiException.class, () -> FulfillmentRules.offer("DECLINED", 2, 2, now.plusSeconds(30), now));
 }
}
