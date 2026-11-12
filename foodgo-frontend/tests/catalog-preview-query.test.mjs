import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterPreviewFoods, filterPreviewRestaurants, normalized } from '../src/features/catalog/catalogPreviewQuery.ts';
import { previewFoods, previewRestaurants } from '../src/features/catalog/catalogPreview.ts';

test('preview search finds Vietnamese dishes without altering the source array', () => {
  const originalIds = previewFoods.map(food => food.id);
  const result = filterPreviewFoods({q:'  PHỞ BÒ  '});
  assert.ok(result.length >= 2);
  assert.ok(result.every(food => food.name.toLocaleLowerCase('vi-VN').includes('phở bò')));
  assert.deepEqual(previewFoods.map(food => food.id), originalIds);
});

test('category and restaurant scope limit preview results', () => {
  const result = filterPreviewFoods({categoryId:'rice', restaurantId:'preview-bep-nha'});
  assert.ok(result.length > 0);
  assert.ok(result.every(food => food.categoryId === 'rice' && food.restaurantId === 'preview-bep-nha'));
  assert.deepEqual(filterPreviewFoods({categoryId:'missing'}), []);
});

test('price sorting is nondecreasing and stable on equal prices', () => {
  const values = filterPreviewFoods({sort:'price'});
  assert.equal(values.length, previewFoods.length);
  assert.ok(values.every((food,i) => i===0 || values[i-1].basePrice <= food.basePrice));
});

test('restaurant search excludes foods and matches restaurant names', () => {
  const result = filterPreviewRestaurants('phở');
  assert.ok(result.length > 0 && result.length < previewRestaurants.length);
  assert.ok(result.every(item => normalized(item.name).includes(normalized('phở'))));
});

test('vegetarian preview sandwich does not reuse meat sandwich image code', () => {
  const veggie = previewFoods.find(food => food.name === 'Bánh mì chay');
  assert.ok(veggie);
  assert.notEqual(veggie.imageCode, 'BANH_MI');
});

test('preview search matches Vietnamese without tone marks', () => {
  assert.ok(filterPreviewFoods({q:'pho bo'}).some(food=>food.name==='Phở bò'));
  assert.ok(filterPreviewFoods({q:'banh mi chay'}).some(food=>food.name==='Bánh mì chay'));
  assert.ok(filterPreviewRestaurants('pho viet').some(r=>r.name==='Phở Việt'));
});
test('preview search does not change source data', () => {
  assert.equal(previewFoods.find(x=>x.id==='preview-pho-bo')?.name,'Phở bò');
});
