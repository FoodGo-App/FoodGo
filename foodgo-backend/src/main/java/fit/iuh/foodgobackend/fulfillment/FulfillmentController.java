package fit.iuh.foodgobackend.fulfillment;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class FulfillmentController {
 private final FulfillmentService service;
 public FulfillmentController(FulfillmentService service){this.service=service;}
 @GetMapping("/restaurant/orders") Object restaurant(@AuthenticationPrincipal UserPrincipal u,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,@RequestParam(required=false) String status){return Api.page(service.restaurantOrders(u,status),page,size);}
 @PostMapping("/restaurant/orders/{id}/{action:accept|reject|prepare|ready}") Object action(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@PathVariable String action,@RequestBody(required=false) Map<String,Object> body){return Api.ok(service.restaurantAction(u,id,action,body==null?null:Data.s(body,"reason")));}
 @GetMapping("/driver/offers") Object offers(@AuthenticationPrincipal UserPrincipal u,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return Api.page(service.offers(u),page,size);}
 @PostMapping("/driver/offers/{id}/{action:accept|decline}") Object offer(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@PathVariable String action){return Api.ok(service.offerAction(u,id,action));}
 @GetMapping("/driver/orders") Object jobs(@AuthenticationPrincipal UserPrincipal u,@RequestParam(defaultValue="active") String scope,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return Api.page(service.jobs(u,scope),page,size);}
 @PostMapping("/driver/orders/{id}/pickup") Object pickup(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){return Api.ok(service.pickup(u,id));}
 @PostMapping("/driver/orders/{id}/deliver") Object deliver(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@RequestBody Map<String,Object> body){Data.require(body.get("codCollected") instanceof Boolean,400,"INVALID_REQUEST","codCollected phải là boolean.");return Api.ok(service.deliver(u,id,(Boolean)body.get("codCollected")));}
 @PostMapping("/driver/orders/{id}/issues") Object issue(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@RequestHeader(value="Idempotency-Key",required=false) String key,@RequestBody Map<String,Object> body){return Api.ok(service.issue(u,id,Data.s(body,"reason"),key));}
}
