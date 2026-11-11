package fit.iuh.foodgobackend.cart;
import fit.iuh.foodgobackend.common.Api;
import fit.iuh.foodgobackend.account.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
@RestController @RequestMapping("/api/v1/cart") public class CartController {
 private final CartService service;public CartController(CartService service){this.service=service;}
 @GetMapping Object view(@AuthenticationPrincipal UserPrincipal u){return Api.ok(service.view(u));}
 @PostMapping("/items") Object add(@AuthenticationPrincipal UserPrincipal u,@Valid @RequestBody CartService.ItemInput in){return Api.ok(service.add(u,in,null));}
 @PutMapping("/items/{id}") Object edit(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@Valid @RequestBody CartService.ItemInput in){return Api.ok(service.add(u,in,id));}
 @DeleteMapping("/items/{id}") Object remove(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@RequestParam long expectedVersion){return Api.ok(service.remove(u,id,expectedVersion));}
 @DeleteMapping Object clear(@AuthenticationPrincipal UserPrincipal u,@RequestParam long expectedVersion){return Api.ok(service.remove(u,null,expectedVersion));}
}
