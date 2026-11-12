package fit.iuh.foodgobackend.communication;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.Api;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders/{id}")
public class CommunicationController {
 private final CommunicationService service;
 public CommunicationController(CommunicationService service){this.service=service;}
 @GetMapping("/conversation") Object conversation(@AuthenticationPrincipal UserPrincipal user,@PathVariable long id){return Api.ok(service.conversation(user,id));}
 @GetMapping("/messages") Object messages(@AuthenticationPrincipal UserPrincipal user,@PathVariable long id,@RequestParam(defaultValue="20") int limit,@RequestParam(required=false) Long beforeId,@RequestParam(required=false) Long afterId){return Api.ok(service.messages(user,id,limit,beforeId,afterId));}
 @PostMapping("/messages") Object send(@AuthenticationPrincipal UserPrincipal user,@PathVariable long id,@Valid @RequestBody CommunicationService.MessageInput input){return Api.ok(service.send(user,id,input));}
 @PostMapping("/call-access") Object call(@AuthenticationPrincipal UserPrincipal user,@PathVariable long id){return Api.ok(service.call(user,id));}
 @GetMapping("/driver-review") Object review(@AuthenticationPrincipal UserPrincipal user,@PathVariable long id){return Api.ok(service.review(user,id));}
 @PostMapping("/driver-review") Object sendReview(@AuthenticationPrincipal UserPrincipal user,@PathVariable long id,@Valid @RequestBody CommunicationService.ReviewInput input){return Api.ok(service.sendReview(user,id,input));}
}
