package fit.iuh.foodgobackend.catalog;
import fit.iuh.foodgobackend.common.Api;
import fit.iuh.foodgobackend.account.UserPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.Map;
@RestController @RequestMapping("/api/v1/favorites") public class FavoriteController {
 private final FavoriteService service;public FavoriteController(FavoriteService s){service=s;}
 @GetMapping Object list(@AuthenticationPrincipal UserPrincipal u,@RequestParam String type,@RequestParam Map<String,String> query){return service.list(u,type,query);}
 @PutMapping("/{type}/{targetId}") Object save(@AuthenticationPrincipal UserPrincipal u,@PathVariable String type,@PathVariable long targetId){return Api.ok(service.save(u,type,targetId,true));}
 @DeleteMapping("/{type}/{targetId}") Object remove(@AuthenticationPrincipal UserPrincipal u,@PathVariable String type,@PathVariable long targetId){return Api.ok(service.save(u,type,targetId,false));}
}
