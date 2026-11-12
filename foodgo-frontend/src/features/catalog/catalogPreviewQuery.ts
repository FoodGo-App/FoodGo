/** Pure filtering for the read-only preview. No API calls, cart mutations or account data. */
import { previewFoods, previewRestaurants, previewRestaurantName } from "./catalogPreview.ts";

export type PreviewFoodQuery = { q?: string; categoryId?: string; restaurantId?: string; sort?: "rating" | "price" };
/** Accent-insensitive search for the preview only; never alters stored names. */
export const normalized = (text: string) => text.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLocaleLowerCase("vi-VN");

export function filterPreviewFoods(query: PreviewFoodQuery = {}) {
  const q = normalized(query.q ?? "");
  const list = previewFoods.filter((food) =>
    (!query.categoryId || query.categoryId === "all" || food.categoryId === query.categoryId) &&
    (!query.restaurantId || food.restaurantId === query.restaurantId) &&
    (!q || normalized(`${food.name} ${previewRestaurantName(food.restaurantId)}`).includes(q))
  );
  return query.sort === "price" ? [...list].sort((a, b) => a.basePrice - b.basePrice || a.id.localeCompare(b.id)) : list;
}

export function filterPreviewRestaurants(q = "") {
  const needle = normalized(q);
  return previewRestaurants.filter((restaurant) => !needle || normalized(restaurant.name).includes(needle));
}
