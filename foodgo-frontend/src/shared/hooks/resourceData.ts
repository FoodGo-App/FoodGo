/** Keep M03 polling merges within the current M01 session generation. */
export function combineResourceData<T>(previous: {scope:string;data:T|null}|null, scope:string, incoming:T, combine?: (previous:T|null,incoming:T)=>T):T {
  return combine ? combine(previous?.scope === scope ? previous.data : null, incoming) : incoming;
}
