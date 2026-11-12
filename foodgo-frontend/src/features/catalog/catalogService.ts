import type { Page, Requester, Offer } from "../../shared/types/domain.ts";
export type Restaurant = { id:string; name:string; available:boolean; imageCode:string; addressText:string; areaCode:string; sampleRating:number; sampleDistanceM:number; sampleEtaMinutes:number; sampleReviews?: {name?:string;text?:string;stars?:number}[] };
export type Food = { id:string; name:string; restaurantId:string; categoryId:string; description:string; kind:string; available:boolean; restaurantAvailable?:boolean; basePrice:number; imageCode:string; optionGroups?: OptionGroup[] };
export type OptionGroup = { id:string;name:string;minSelect:number;maxSelect:number;values:{id:string;name:string;extraPrice:number;available:boolean}[] };
export type Favorite = {type:"FOOD"|"RESTAURANT";targetId:string;summary:Food|Restaurant;savedAt:string};
export type Home = {banners:{id:string;title:string}[];collections:{id:string;name:string}[];categories:{id:string;name:string}[];suggestedFoods:Food[];offers:Offer[]};
const caches = new WeakMap<Requester, Map<string,{expires:number;value?:unknown;pending?:Promise<unknown>}>>();
export function publicCatalog<T>(request:Requester,path:string,refresh=false):Promise<T> {
  if (!path.startsWith("/catalog/")) throw Error("Only public catalog data may be cached");
  let cache=caches.get(request);if(!cache){cache=new Map();caches.set(request,cache);}
  if(refresh)cache.delete(path);
  const old=cache.get(path);if(old?.pending)return old.pending as Promise<T>;if(old?.value!==undefined&&old.expires>Date.now())return Promise.resolve(old.value as T);
  const entry:{expires:number;value?:unknown;pending?:Promise<unknown>}={expires:0};
  entry.pending=request<T>(path).then(value=>{entry.value=value;entry.expires=Date.now()+60000;delete entry.pending;return value;},error=>{if(cache!.get(path)===entry)cache!.delete(path);throw error;});cache.set(path,entry);
  if(cache.size>150){const first=cache.keys().next().value;if(first)cache.delete(first);}
  return entry.pending as Promise<T>;
}
export function catalogPath(kind:"foods"|"restaurants",query:Record<string,string|number|undefined>){const p=new URLSearchParams();for(const key of Object.keys(query).sort()){const value=query[key];if(value!==undefined&&value!=="")p.set(key,String(value));}return `/catalog/${kind}?${p}`;}
export const catalogService=(request:Requester)=>({
 home:(refresh=false)=>publicCatalog<Home>(request,"/catalog/home?areaCode=AREA_A",refresh),
 categories:()=>publicCatalog<{id:string;name:string}[]>(request,"/catalog/categories"),
 foods:(query:Record<string,string|number|undefined>,refresh=false)=>publicCatalog<Page<Food>>(request,catalogPath("foods",query),refresh),
 restaurants:(query:Record<string,string|number|undefined>,refresh=false)=>publicCatalog<Page<Restaurant>>(request,catalogPath("restaurants",query),refresh),
 food:(id:string,refresh=false)=>publicCatalog<Food>(request,`/catalog/foods/${encodeURIComponent(id)}`,refresh),
 restaurant:(id:string,refresh=false)=>publicCatalog<Restaurant>(request,`/catalog/restaurants/${encodeURIComponent(id)}`,refresh),
 favorites:(type:"FOOD"|"RESTAURANT",q="",sort="rating",page=0)=>request<Page<Favorite>>(`/favorites?${new URLSearchParams({type,q,sort,page:String(page),size:"20"})}`),
 favorite:(type:"FOOD"|"RESTAURANT",id:string,saved:boolean)=>request(`/favorites/${type}/${encodeURIComponent(id)}`,saved?"PUT":"DELETE",{}),
});
