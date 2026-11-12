import {test} from 'node:test';import assert from 'node:assert/strict';
test('default quote clock does not invoke browser timers with a custom receiver',async()=>{
 const schedule=globalThis.setTimeout,cancel=globalThis.clearTimeout;
 globalThis.setTimeout=function(fn,delay){if(this!==undefined&&this!==globalThis)throw new TypeError('Illegal invocation');return schedule(fn,delay)};
 globalThis.clearTimeout=function(id){if(this!==undefined&&this!==globalThis)throw new TypeError('Illegal invocation');return cancel(id)};
 try{const {QuoteCoordinator}=await import('../src/features/checkout/checkoutFlow.ts?browser-clock');const q=new QuoteCoordinator(async()=>{throw Error('not reached')},()=>{});assert.doesNotThrow(()=>q.select({addressId:'1',paymentMethod:'COD',expectedCartVersion:1}));q.dispose();}
 finally{globalThis.setTimeout=schedule;globalThis.clearTimeout=cancel;}
});
