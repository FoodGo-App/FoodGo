import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const source=(path)=>readFileSync(new URL(`../src/${path}`,import.meta.url),'utf8');
const hasPatchedScreens=['features/account/screens/LoginScreen.tsx','features/catalog/screens/CatalogScreen.tsx'].every(path=>existsSync(new URL(`../src/${path}`,import.meta.url)));

test('login exposes accessible show/hide password control without changing value',{skip:!hasPatchedScreens&&'Only runs after applying patch to full repository'},()=>{
 const s=source('features/account/screens/LoginScreen.tsx');
 assert.match(s,/secureTextEntry=\{!passwordVisible\}/);
 assert.match(s,/accessibilityLabel=\{passwordVisible\s*\?\s*"Ẩn mật khẩu"\s*:\s*"Hiện mật khẩu"\}/);
 assert.match(s,/onPress=\{\(\) => setPasswordVisible\(\(value\) => !value\)\}/);
 assert.match(s,/value=\{password\}/);
});

test('catalog, restaurant, food, favorites and cart display food thumbnails',{skip:!hasPatchedScreens&&'Only runs after applying patch to full repository'},()=>{
 const screens=[
  'features/catalog/screens/CatalogScreen.tsx',
  'features/catalog/screens/RestaurantScreen.tsx',
  'features/catalog/screens/FoodScreen.tsx',
  'features/catalog/screens/FavoritesScreen.tsx',
  'features/cart/screens/CartScreen.tsx'
 ];
 for(const file of screens){const s=source(file);assert.match(s,/FoodCard|FoodThumbnail|RestaurantMenu/,file);}
});

test('preview images are bundled and labeled preview-only',()=>{
 for(const n of ['com-ga','com-nam','pho-bo','banh-mi','bun-thit-nuong','tra-sua']){
  assert.ok(existsSync(new URL(`../assets/images/food/foodgo-${n}.jpg`,import.meta.url)),n);
 }
 const s=source('features/catalog/components/DemoCatalogPreview.tsx');
 assert.match(s,/Không ghi giỏ, yêu thích hoặc đơn hàng/);
});
