package fit.iuh.foodgobackend.catalog;
import fit.iuh.foodgobackend.common.*;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1") public class CatalogController {
 private final CatalogService service;public CatalogController(CatalogService s){service=s;}
 @GetMapping("/health") Object health(){return Api.ok(Map.of("status","UP"));}
 @GetMapping("/catalog/home") Object home(@RequestParam(required=false) String areaCode){return Api.ok(service.home(areaCode));}
 @GetMapping("/catalog/categories") Object categories(){return Api.ok(service.categories());}
 @GetMapping("/catalog/foods/{id}") Object food(@PathVariable long id){return Api.ok(service.food(id));}
 @GetMapping("/catalog/foods") Object foods(@RequestParam Map<String,String> query){return service.searchFoods(query);}
 @GetMapping("/catalog/restaurants/{id}") Object restaurant(@PathVariable long id){return Api.ok(service.restaurant(id));}
 @GetMapping("/catalog/restaurants") Object restaurants(@RequestParam Map<String,String> query){return service.searchRestaurants(query);}
 @GetMapping("/catalog/offers") Object offers(@RequestParam Map<String,String> query){return service.searchOffers(query);}
}
