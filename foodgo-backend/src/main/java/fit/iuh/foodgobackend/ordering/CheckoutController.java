package fit.iuh.foodgobackend.ordering;
import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;

@RestController @RequestMapping("/api/v1/checkout")
public class CheckoutController {
 private final CheckoutService service;public CheckoutController(CheckoutService service){this.service=service;}
 @PostMapping("/quotes") Object quote(@AuthenticationPrincipal UserPrincipal u,@Valid @RequestBody CheckoutService.QuoteInput in){return Api.ok(service.quote(u,in));}
 @PostMapping("/attempts") Object begin(@AuthenticationPrincipal UserPrincipal u,@Valid @RequestBody CheckoutService.AttemptInput in,@RequestHeader("Idempotency-Key") String key){var result=service.begin(u,in,key);return Api.response("PENDING".equals(result.get("result"))?202:201,result);}
 @GetMapping("/attempts/current") Object current(@AuthenticationPrincipal UserPrincipal u){return Api.ok(service.current(u));}
 @GetMapping("/attempts/by-key/{key}") Object byKey(@AuthenticationPrincipal UserPrincipal u,@PathVariable String key){return Api.ok(service.byKey(u,key));}
 @GetMapping("/attempts/{id}") Object get(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){return Api.ok(service.get(u,id));}
 @PostMapping("/attempts/{id}/resolve") Object resolve(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){var result=service.resolve(u,id);if(result.containsKey("_error"))throw new ApiException(409,Data.s(result.get("_error")),"Thanh toán đã dừng vì món, giá hoặc thông tin nhận hàng thay đổi. Giỏ vẫn được giữ; hãy kiểm tra lại trước khi đặt.");return Api.response("PENDING".equals(result.get("result"))?202:200,result);}
 @PostMapping("/attempts/{id}/cancel") Object cancel(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){return Api.ok(service.cancel(u,id));}
}
