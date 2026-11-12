import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeHistory,MessageTimeline} from '../src/features/communication/lib/history.ts';
import {prepareIssue} from '../src/features/orders/lib/issueDraft.ts';
import {DemoEngine} from '../src/shared/api/demo.ts';
const rows=(first,last)=>Array.from({length:last-first+1},(_,i)=>({id:String(first+i),text:`tin${first+i}`}));
test('latest polling keeps message21 when older1-20 and latest21-40 were loaded',()=>{
 let state=mergeHistory(null,'u1:o1',rows(21,40));state=mergeHistory(state,'u1:o1',rows(1,20));state=mergeHistory(state,'u1:o1',rows(22,41));assert.deepEqual(state.messages.map(x=>x.id),rows(1,41).map(x=>x.id));
});
test('history upserts overlapping pages, sorts large IDs exactly, never leaks another order/user',()=>{
 let s=mergeHistory(null,'u1:o1',[{id:'9007199254740993',text:'old'},{id:'9007199254740992',text:'first'}]);s=mergeHistory(s,'u1:o1',[{id:'9007199254740993',text:'server'}]);assert.equal(s.messages[1].text,'server');assert.equal(s.messages.length,2);s=mergeHistory(s,'u2:o1',[{id:'1',text:'private'}]);assert.equal(s.messages.length,1);assert.equal(s.messages[0].text,'private');
});
test('background catch-up drains afterId pages without dropping more than20 arrivals',async()=>{
 const history=new MessageTimeline();let all=rows(1,20);const cursors=[];
 const fetch=async(after)=>{cursors.push(after);return after?all.filter(x=>BigInt(x.id)>BigInt(after)).slice(0,20):all.slice(-20)};
 assert.equal((await history.refresh(fetch)).length,20);all=rows(1,65);const caught=await history.refresh(fetch);assert.equal(caught.length,65);assert.deepEqual(cursors,[undefined,'20','40','60']);assert.deepEqual(caught.map(x=>x.id),rows(1,65).map(x=>x.id));
});
test('own sent message cannot advance catch-up cursor past unseen messages',async()=>{
 const history=new MessageTimeline();let all=rows(1,20);const fetch=async(after)=>after?all.filter(x=>BigInt(x.id)>BigInt(after)).slice(0,20):all.slice(-20);
 await history.refresh(fetch);all=rows(1,45);history.add([{id:'45',text:'own message'}]);assert.equal((await history.refresh(fetch)).length,45);
});
test('lost-response issue restored after app close retries original key AND reason even if input changes',()=>{
 const a=prepareIssue({text:'  Khách chưa nghe máy  ',pending:null},()=> 'request-1');assert.equal(a.reason,'Khách chưa nghe máy');const restored=JSON.parse(JSON.stringify({text:'Lý do khác',pending:a}));const retry=prepareIssue(restored,()=>{throw new Error('must not generate a second key')});assert.deepEqual(retry,a);
});
test('issue validation refuses empty or oversized text before generating a key',()=>{
 assert.throws(()=>prepareIssue({text:' ',pending:null},()=> 'key'));assert.throws(()=>prepareIssue({text:'a'.repeat(301),pending:null},()=> 'key'));
});
test('demo current pending is scoped and has authoritative replay fields',()=>{
 const e=new DemoEngine();assert.equal(e.request('customer-1','/checkout/attempts/current'),null);const q=e.request('customer-1','/checkout/quotes','POST',{addressId:'address-1',paymentMethod:'MOCK_WALLET',expectedCartVersion:1});const a=e.request('customer-1','/checkout/attempts','POST',{quoteId:q.id,expectedCartVersion:1},'demo-current-key');const current=e.request('customer-1','/checkout/attempts/current');assert.equal(current.id,a.id);assert.equal(current.quoteId,q.id);assert.equal(current.cartVersion,1);assert.equal(e.request('customer-2','/checkout/attempts/current'),null);
});
