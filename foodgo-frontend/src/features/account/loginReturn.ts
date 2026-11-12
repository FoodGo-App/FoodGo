import type { Role } from "../../shared/types/domain.ts";
export const PUBLIC_HOME = "/(customer)/(tabs)/home";
const ACCOUNT = "/(customer)/(tabs)/account";
const routes: Record<string,string> = {
 "/home":PUBLIC_HOME,[PUBLIC_HOME]:PUBLIC_HOME,"/account":ACCOUNT,[ACCOUNT]:ACCOUNT,
 "/orders":"/(customer)/(tabs)/orders","/(customer)/(tabs)/orders":"/(customer)/(tabs)/orders",
 "/favorites":"/(customer)/(tabs)/favorites","/(customer)/(tabs)/favorites":"/(customer)/(tabs)/favorites",
 "/inbox":"/(customer)/(tabs)/inbox","/(customer)/(tabs)/inbox":"/(customer)/(tabs)/inbox",
 "/checkout/review":"/checkout/review","/addresses":"/addresses","/catalog":"/catalog","/cart":"/cart",
};
function allowedKeys(path:string){return path==="/catalog"?["q","categoryId","restaurantId","type","sort","fav"]:/^\/food\//.test(path)?["options","quantity","note"]:path===PUBLIC_HOME?["selection"]:[];}
export function safeReturnTo(raw:unknown):string|null {
 if(typeof raw!=="string"||raw.length>1400||/[\\#\u0000-\u001f\u007f]/.test(raw))return null;
 const parts=raw.split("?");if(parts.length>2||/[%\s]/.test(parts[0]))return null;
 const path=Object.hasOwn(routes,parts[0])?routes[parts[0]]:/^\/(orders|conversations|calls|reviews|food|restaurants)\/[A-Za-z0-9_-]{1,80}$/.test(parts[0])?parts[0]:null;
 if(!path)return null;const input=new URLSearchParams(parts[1]??""),output=new URLSearchParams(),allowed=allowedKeys(path);
 for(const key of input.keys())if(!allowed.includes(key)||input.getAll(key).length!==1)return null;
 if(path===PUBLIC_HOME)return input.get("selection")==="demo-meal"?`${path}?selection=demo-meal`:path;
 for(const key of allowed){const value=input.get(key);if(value===null)continue;
  if(key==="q"||key==="note"){if(value.length>(key==="q"?100:200)||/[\u0000-\u001f\u007f]/.test(value))return null;output.set(key,value);}
  else if(["categoryId","restaurantId"].includes(key)){if(!/^[1-9][0-9]{0,18}$/.test(value))return null;output.set(key,value);}
  else if(key==="type"){if(!["FOOD","RESTAURANT"].includes(value))return null;output.set(key,value);}
  else if(key==="sort"){if(!["rating","distance","price"].includes(value))return null;output.set(key,value);}
  else if(key==="fav"){if(!["0","1"].includes(value))return null;output.set(key,value);}
  else if(key==="quantity"){if(/^[1-9][0-9]?$/.test(value))output.set(key,value);}
  else if(key==="options"){if(value&&(!/^[1-9][0-9]*(,[1-9][0-9]*)*$/.test(value)||value.length>500))return null;output.set(key,[...new Set(value.split(",").filter(Boolean))].join(","));}
 }
 if(output.get("fav")==="1")output.delete("categoryId");
 return path+(output.size?`?${output}`:"");
}
export function loginHref(raw?:unknown){const safe=safeReturnTo(raw);return {pathname:"/login" as const,params:safe?{returnTo:safe}:{}};}
export function captureReturnTo(path:string,params:Record<string,unknown>={}){const safe=safeReturnTo(path);if(!safe)return null;const q=new URLSearchParams();for(const key of allowedKeys(safe)){const value=params[key];if(typeof value==="string")q.set(key,value);}return safeReturnTo(safe+(q.size?`?${q}`:""));}
export function cancelLoginTarget(raw:unknown):string {const safe=safeReturnTo(raw);return safe&&(safe===ACCOUNT||safe.startsWith(PUBLIC_HOME)||safe.split("?")[0]==="/catalog"||/^\/(food|restaurants)\//.test(safe))?safe:PUBLIC_HOME;}
export function afterLoginTarget(role:Role,raw:unknown,mode:"api"|"demo"):string {if(role!=="CUSTOMER")return "/";const safe=safeReturnTo(raw);return mode==="api"&&safe===`${PUBLIC_HOME}?selection=demo-meal`?PUBLIC_HOME:safe??"/";}
