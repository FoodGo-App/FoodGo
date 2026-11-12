import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewOptionsFor, previewUnitPrice } from '../src/features/catalog/catalogPreviewOptions.ts';
import { previewFoods } from '../src/features/catalog/catalogPreview.ts';

const get=(id)=>{const f=previewFoods.find(x=>x.id===id); assert.ok(f,id);return f;};
test('all preview meals get a size and an optional extra',()=>{
  for(const food of previewFoods){const config=previewOptionsFor(food);assert.ok(config.sizes.length);assert.ok(config.sizes.some(s=>s.extraPrice===0));assert.ok(config.extras.length);assert.ok(config.extras.every(x=>x.extraPrice>=0));}
});
test('tea offers pearls, not eggs',()=>{
  const c=previewOptionsFor(get('preview-tra-sua'));
  assert.ok(c.extras.some(x=>x.id==='pearls'));
  assert.ok(c.extras.every(x=>!x.label.toLowerCase().includes('trứng')));
});
test('vegetarian meals have vegetarian extras',()=>{
  for(const id of ['preview-com-nam','preview-banh-mi-nam']) {
    const c=previewOptionsFor(get(id));
    assert.ok(c.extras.every(x=>!x.label.toLowerCase().includes('trứng')&&!x.label.toLowerCase().includes('thịt')));
  }
});
test('selected preview options change price only for valid IDs',()=>{
  const food=get('preview-tra-sua');
  assert.equal(previewUnitPrice(food,'m',null),food.basePrice);
  assert.equal(previewUnitPrice(food,'l','pearls'),food.basePrice+10000);
  assert.equal(previewUnitPrice(food,'nonexistent','egg'),food.basePrice);
});
test('preview extras remain explicitly separate from real price/checkout',()=>{
 const food=get('preview-com-ga');
 assert.equal(previewUnitPrice(food,'large','egg'),food.basePrice+15000);
 assert.equal(previewUnitPrice(food,'normal',null),food.basePrice);
});
