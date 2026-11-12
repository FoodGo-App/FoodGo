import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { KNOWN_IMAGE_CODES, illustrativePhotoKey } from "../src/shared/components/foodPhotoCatalog.ts";

test("known image codes use their explicit assets", () => {
  for (const key of KNOWN_IMAGE_CODES) assert.equal(illustrativePhotoKey(key, "Unrelated"), key);
});
test("generic backend fixture codes use exact, known names", () => {
  assert.equal(illustrativePhotoKey("SAMPLE_FOOD", "Phở bò tái"), "PHO_TAI");
  assert.equal(illustrativePhotoKey("SAMPLE_FOOD", "Bánh mì chay nấm"), "BANH_MI_CHAY");
  assert.equal(illustrativePhotoKey("SAMPLE_RESTAURANT", "[Mẫu] Phở Sáng Mai"), "PHO_TAI");
  assert.equal(illustrativePhotoKey("SAMPLE_RESTAURANT", "[Mẫu] Bếp Chay An Nhiên"), "COM_CHAY_NAM");
  assert.equal(illustrativePhotoKey("SAMPLE_FOOD", "Không có món này"), null);
});
test("unknown image codes are not silently guessed", () => {
  assert.equal(illustrativePhotoKey("UNREGISTERED", "Phở bò tái"), null);
  assert.equal(illustrativePhotoKey("SAMPLE_RESTAURANT", "Phở bò tái"), null);
  assert.equal(illustrativePhotoKey("SAMPLE_FOOD", "[Mẫu] Phở Sáng Mai"), null);
  assert.equal(illustrativePhotoKey("SAMPLE_FOOD", "Bánh mì chay nấm + thịt"), null);
  assert.equal(illustrativePhotoKey(undefined, undefined), null);
});
test("every mapped image source is bundled and local", () => {
  const text = readFileSync(new URL("../src/shared/components/FoodThumbnail.tsx", import.meta.url), "utf8");
  for (const key of KNOWN_IMAGE_CODES) {
    const re = new RegExp(`${key}:\\s*require\\("\\.\\./\\.\\./\\.\\./assets/images/food/([^"/]+)"\\)`);
    const match = text.match(re);
    assert.ok(match, `missing static bundle declaration: ${key}`);
    assert.ok(existsSync(new URL(`../assets/images/food/${match[1]}`, import.meta.url)), match[1]);
  }
});
