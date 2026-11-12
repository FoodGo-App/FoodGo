package fit.iuh.foodgobackend.ordering;
import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.Api;
import fit.iuh.foodgobackend.fulfillment.FulfillmentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController @RequestMapping("/api/v1/orders")
public class OrderController {
 private final OrderService service;private final FulfillmentService fulfillment;public OrderController(OrderService service,FulfillmentService fulfillment){this.service=service;this.fulfillment=fulfillment;}
 public record Reason(@NotBlank @Size(max=300) String reason){}
 @GetMapping Object list(@AuthenticationPrincipal UserPrincipal u,@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return service.list(u,status,page,size);}
 @GetMapping("/{id}") Object detail(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){return Api.ok(service.detail(u,id));}
 @PostMapping("/{id}/cancel") Object cancel(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@Valid @RequestBody Reason in){return Api.ok(service.cancel(u,id,in.reason()));}
 @PostMapping("/{id}/dispatch-retries") Object retry(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){return Api.ok(fulfillment.retry(u,id));}
 @GetMapping("/{id}/tracking") Object tracking(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){return Api.ok(service.tracking(u,id));}
}
