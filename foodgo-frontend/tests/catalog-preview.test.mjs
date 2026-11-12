import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { previewFoods, previewRestaurants, previewCategories } from "../src/features/catalog/catalogPreview.ts";

test("read-only preview has complete food and restaurant references", () => {
  assert.ok(previewFoods.length >= 8);
  assert.equal(new Set(previewFoods.map(food => food.id)).size, previewFoods.length);
  const restaurantIds = new Set(previewRestaurants.map(restaurant => restaurant.id));
  const categoryIds = new Set(previewCategories.map(category => category.id));
  for (const food of previewFoods) {
    assert.ok(restaurantIds.has(food.restaurantId), food.name);
    assert.ok(categoryIds.has(food.categoryId), food.name);
    assert.ok(food.id.startsWith("preview-"));
    assert.ok(food.basePrice > 0);
  }
});

test("image pack contains each branded asset", () => {
  for (const name of ["com-ga", "com-nam", "pho-bo", "banh-mi", "bun-thit-nuong", "tra-sua"]) {
    const path = new URL(`../assets/images/food/foodgo-${name}.jpg`, import.meta.url);
    assert.ok(existsSync(path), name);
  }
});
