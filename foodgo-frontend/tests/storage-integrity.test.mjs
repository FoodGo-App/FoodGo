import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeStoredValue} from '../src/shared/storage/json.ts';
test('corrupt pending storage fails closed rather than pretending no prior request exists',()=>{
 assert.throws(()=>decodeStoredValue('{"pending":'),/đọc/);
 assert.equal(decodeStoredValue(null),null);
 const pending={requestKey:'same-key',reason:'Khách chưa nghe máy'};
 assert.deepEqual(decodeStoredValue(JSON.stringify(pending)),pending);
});
