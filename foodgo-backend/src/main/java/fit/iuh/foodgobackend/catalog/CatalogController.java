package fit.iuh.foodgobackend.catalog;
import fit.iuh.foodgobackend.common.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1") public class CatalogController {
 private final CatalogService service;public CatalogController(CatalogService s){service=s;}
 @GetMapping("/health") Object health(){return Api.ok(java.util.Map.of("status","UP"));}
 @GetMapping("/catalog/foods/{id}") Object food(@PathVariable long id){return Api.ok(service.food(id));}
 @GetMapping("/catalog/foods") Object foods(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return Api.page(service.foods(),page,size);}
 @GetMapping("/catalog/restaurants") Object restaurants(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return Api.page(service.restaurants(),page,size);}
 @GetMapping("/catalog/offers") Object offers(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return Api.page(service.offers(),page,size);}
}
