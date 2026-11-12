import {useApp} from "../../providers/AppProvider";
import {readStore,writeStore,removeStore} from "../../shared/storage/store";
import {newRequestKey} from "../../shared/utils/id";
import {cartService,createCartJournal,type Pending} from "./cartService";
const journals=new Map<string,ReturnType<typeof createCartJournal>>();
export function useCartService(){const {request,getSession}=useApp();const owner=getSession(),key=`pending-cart:${owner?.user.id??"guest"}`;let journal=journals.get(key);if(!journal){journal=createCartJournal({get:()=>readStore<Pending>(key),set:p=>p?writeStore(key,p):removeStore(key)});journals.set(key,journal);}return cartService(request,journal,()=>owner!==null&&getSession()===owner,newRequestKey);}
