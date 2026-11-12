import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCart} from '../src/shared/api/adapters.ts';
import {combineResourceData} from '../src/shared/hooks/resourceData.ts';
import {canQuoteCart} from '../src/features/checkout/checkoutFlow.ts';
test('M01 invalid cart line prevents M03 checkout even with legacy validity field',()=>{
 const cart=normalizeCart({id:'c',version:2,items:[{id:'line',foodId:'f',quantity:1,valid:false,invalidMessage:'Unavailable',unitPrice:null}]});
 assert.equal(cart.items[0].available,false);assert.equal(cart.items[0].validationMessage,'Unavailable');assert.equal(canQuoteCart(cart),false);
});
test('main available field remains visible to M01 validity consumers',()=>{const cart=normalizeCart({items:[{id:'x',foodId:'f',quantity:1,available:false,validationMessage:'Closed'}]});assert.equal(cart.items[0].valid,false);assert.equal(cart.items[0].invalidMessage,'Closed');});
test('polling combine preserves same generation history and discards old session data',()=>{
 const merge=(old,next)=>[...(old??[]),...next];
 assert.deepEqual(combineResourceData({scope:'1:A:chat',data:['old']},'1:A:chat',['new'],merge),['old','new']);
 assert.deepEqual(combineResourceData({scope:'1:A:chat',data:['private-A']},'2:B:chat',['B'],merge),['B']);
 assert.deepEqual(combineResourceData({scope:'1:A:chat',data:['old-A']},'3:A:chat',['new-A'],merge),['new-A']);
});
