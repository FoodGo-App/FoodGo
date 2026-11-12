type Row = { id: string };
export type History<T extends Row> = { scope: string; messages: T[] };
/** Keep every fetched page; server updates win, and numeric IDs never pass through Number. */
export function mergeHistory<T extends Row>(previous: History<T> | null, scope: string, incoming: T[]): History<T> {
  const byId = new Map<string, T>();
  for (const row of previous?.scope === scope ? previous.messages : []) byId.set(row.id, row);
  for (const row of incoming) byId.set(row.id, row);
  return { scope, messages: [...byId.values()].sort((a, b) => {
    if (/^\d+$/.test(a.id) && /^\d+$/.test(b.id)) return BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  }) };
}
/** The first page is recent history; later refreshes catch up from our exact newest ID. */
export class MessageTimeline<T extends Row> {
  private history: History<T> = {scope:"timeline",messages:[]};
  private loaded=false;
  private cursor:string="0";
  private inFlight:Promise<T[]>|null=null;
  private scope:string;
  constructor(scope="timeline"){this.scope=scope;this.history={scope,messages:[]};}
  add(rows:T[]){this.history=mergeHistory(this.history,this.scope,rows);}
  refresh(fetchPage:(after?:string)=>Promise<T[]>):Promise<T[]> {
    if(this.inFlight)return this.inFlight;
    const load=async()=>{
      if(!this.loaded){const rows=await fetchPage();this.add(rows);this.cursor=rows.at(-1)?.id??"0";this.loaded=true;return this.history.messages;}
      let after=this.cursor;
      for(let page=0;page<100;page++){
        const rows=await fetchPage(after);this.add(rows);
        const next=rows.at(-1)?.id??after;
        this.cursor=next;
        if(rows.length<20||next===after)break;
        after=next;
      }
      return this.history.messages;
    };
    this.inFlight=load().finally(()=>{this.inFlight=null;});return this.inFlight;
  }
}
