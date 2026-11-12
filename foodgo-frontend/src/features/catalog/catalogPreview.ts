/** Read-only marketing preview. These are not database records or valid API/cart IDs. */
import type { Food, Restaurant } from "./catalogService";

export const previewCategories = [
  { id: "all", name: "Tất cả" },
  { id: "rice", name: "Cơm" },
  { id: "noodle", name: "Bún / Phở" },
  { id: "bread", name: "Bánh mì" },
  { id: "drink", name: "Đồ uống" },
];

export const previewRestaurants: Restaurant[] = [
  { id: "preview-bep-nha", name: "Bếp Nhà", addressText: "Khu vực A · Địa chỉ minh họa", areaCode: "AREA_A", imageCode: "CHICKEN_RICE", available: true, sampleRating: 4.8, sampleDistanceM: 1200, sampleEtaMinutes: 25 },
  { id: "preview-pho-viet", name: "Phở Việt", addressText: "Khu vực A · Địa chỉ minh họa", areaCode: "AREA_A", imageCode: "PHO_BO", available: true, sampleRating: 4.7, sampleDistanceM: 900, sampleEtaMinutes: 20 },
  { id: "preview-an-vat", name: "Góc Phố", addressText: "Khu vực A · Địa chỉ minh họa", areaCode: "AREA_A", imageCode: "BANH_MI", available: true, sampleRating: 4.6, sampleDistanceM: 1600, sampleEtaMinutes: 28 },
];

export const previewFoods: Food[] = [
  { id: "preview-com-ga", restaurantId: "preview-bep-nha", categoryId: "rice", name: "Cơm gà nướng", description: "Gà nướng thơm ăn kèm cơm, rau tươi và đồ chua.", basePrice: 40000, imageCode: "CHICKEN_RICE", kind: "SINGLE", available: true },
  { id: "preview-com-nam", restaurantId: "preview-bep-nha", categoryId: "rice", name: "Cơm nấm kho", description: "Cơm nóng với nấm kho đậm vị và rau củ.", basePrice: 40000, imageCode: "MUSHROOM_RICE", kind: "SINGLE", available: true },
  { id: "preview-com-ga-tieu", restaurantId: "preview-bep-nha", categoryId: "rice", name: "Cơm gà sốt tiêu", description: "Cơm và gà áp chảo, sốt tiêu đen.", basePrice: 45000, imageCode: "CHICKEN_RICE", kind: "SINGLE", available: true },
  { id: "preview-pho-bo", restaurantId: "preview-pho-viet", categoryId: "noodle", name: "Phở bò", description: "Bánh phở mềm, bò thái lát và nước dùng trong.", basePrice: 50000, imageCode: "PHO_BO", kind: "SINGLE", available: true },
  { id: "preview-bun-nuong", restaurantId: "preview-pho-viet", categoryId: "noodle", name: "Bún thịt nướng", description: "Bún tươi, thịt nướng và rau thơm.", basePrice: 49000, imageCode: "BUN_THIT_NUONG", kind: "SINGLE", available: true },
  { id: "preview-pho-dac-biet", restaurantId: "preview-pho-viet", categoryId: "noodle", name: "Phở bò đặc biệt", description: "Tô phở bò phần lớn với nhiều thịt hơn.", basePrice: 65000, imageCode: "PHO_BO", kind: "COMBO", available: true },
  { id: "preview-banh-mi", restaurantId: "preview-an-vat", categoryId: "bread", name: "Bánh mì thịt", description: "Bánh mì giòn, thịt nướng, đồ chua, rau thơm.", basePrice: 25000, imageCode: "BANH_MI", kind: "SINGLE", available: true },
  { id: "preview-banh-mi-nam", restaurantId: "preview-an-vat", categoryId: "bread", name: "Bánh mì chay", description: "Bánh mì rau củ và nấm.", basePrice: 28000, imageCode: "", kind: "SINGLE", available: true },
  { id: "preview-tra-sua", restaurantId: "preview-an-vat", categoryId: "drink", name: "Trà sữa trân châu", description: "Trà sữa mát lạnh cùng trân châu.", basePrice: 30000, imageCode: "MILK_TEA", kind: "SINGLE", available: true },
  { id: "preview-tra-sua-lon", restaurantId: "preview-an-vat", categoryId: "drink", name: "Trà sữa size lớn", description: "Trà sữa trân châu ly lớn.", basePrice: 40000, imageCode: "MILK_TEA", kind: "SINGLE", available: true },
];

export function previewRestaurantName(id: string) {
  return previewRestaurants.find((restaurant) => restaurant.id === id)?.name ?? "Quán mẫu";
}
