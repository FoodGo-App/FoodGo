/** Presentation-only choices for the local preview. Never used by API checkout/cart. */
import type { Food } from "./catalogService.ts";

export type PreviewOption = { id: string; label: string; extraPrice: number };
export type PreviewOptionSet = {
  sizeTitle: string;
  sizes: readonly PreviewOption[];
  extraTitle: string;
  extras: readonly PreviewOption[];
};
const choice = (id: string, label: string, extraPrice: number): PreviewOption => ({ id, label, extraPrice });
export function previewOptionsFor(food: Pick<Food, "id" | "categoryId">): PreviewOptionSet {
  if (food.categoryId === "drink") return {
    sizeTitle: "Cỡ ly (mô phỏng)",
    sizes: [choice("m", "M", 0), choice("l", "L +5.000đ", 5000)],
    extraTitle: "Thêm vào ly (mô phỏng)",
    extras: [choice("pearls", "Trân châu +5.000đ", 5000)],
  };
  if (food.categoryId === "bread") return {
    sizeTitle: "Khẩu phần (mô phỏng)",
    sizes: [choice("normal", "Tiêu chuẩn", 0), choice("large", "Đặc biệt +7.000đ", 7000)],
    extraTitle: "Thêm nhân (mô phỏng)",
    extras: food.id === "preview-banh-mi-nam"
      ? [choice("mushrooms", "Thêm nấm +5.000đ", 5000)]
      : [choice("egg", "Thêm trứng +5.000đ", 5000)],
  };
  if (food.categoryId === "noodle") return {
    sizeTitle: "Khẩu phần (mô phỏng)",
    sizes: [choice("normal", "Vừa", 0), choice("large", "Phần lớn +10.000đ", 10000)],
    extraTitle: "Ăn kèm (mô phỏng)",
    extras: [choice("vegetables", "Thêm rau +5.000đ", 5000)],
  };
  return {
    sizeTitle: "Khẩu phần (mô phỏng)",
    sizes: [choice("normal", "Vừa", 0), choice("large", "Phần lớn +10.000đ", 10000)],
    extraTitle: "Món thêm (mô phỏng)",
    extras: food.id === "preview-com-nam"
      ? [choice("vegetables", "Rau củ +5.000đ", 5000)]
      : [choice("egg", "Trứng +5.000đ", 5000)],
  };
}

/** If IDs do not belong to this food's preview choices, no surcharge is applied. */
export function previewUnitPrice(food: Pick<Food, "id" | "categoryId" | "basePrice">, sizeId: string, extraId: string | null) {
  const options = previewOptionsFor(food);
  const size = options.sizes.find((item) => item.id === sizeId);
  const extra = options.extras.find((item) => item.id === extraId);
  return food.basePrice + (size?.extraPrice ?? 0) + (extra?.extraPrice ?? 0);
}
