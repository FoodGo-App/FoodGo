package fit.iuh.foodgobackend.fulfillment;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import fit.iuh.foodgobackend.ordering.OrderPolicy;
import static fit.iuh.foodgobackend.common.Data.require;

final class FulfillmentRules {
 private FulfillmentRules() {}
 static final Set<String> PREPARATION = Set.of("CONFIRMED", "PREPARING", "READY_FOR_PICKUP");
 static final Map<String,String> TARGET = Map.of("accept","CONFIRMED","reject","REJECTED","prepare","PREPARING","ready","READY_FOR_PICKUP");
 static void restaurant(String state, String action, boolean repeated) {
  require(TARGET.containsKey(action),400,"INVALID_ACTION","Thao tác không hợp lệ.");
  if(repeated)return;
  String before=switch(action){case "accept","reject"->"PENDING_CONFIRMATION";case "prepare"->"CONFIRMED";default->"PREPARING";};
  OrderPolicy.state(state.equals(before));
 }
 static void retry(String state,String delivery, Object driver) {
  OrderPolicy.state(PREPARATION.contains(state) && delivery.equals("NO_DRIVER") && driver==null);
 }
 static void offer(String state,long round,long currentRound,Instant expiry,Instant now) {
  require(state.equals("OFFERED") && round==currentRound && expiry.isAfter(now),409,"OFFER_EXPIRED","Đề xuất không còn hiệu lực.");
 }
}
