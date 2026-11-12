/**
 * Frontend-only illustrative photo mappings for known FoodGo fixture names.
 * The rich fixture exposes SAMPLE_FOOD/SAMPLE_RESTAURANT for many distinct items.
 * For those generic codes, use only explicit known names, not substring guesses.
 * Unknown image codes/items get a neutral placeholder. Real product media requires
 * unique imageCode values from the data owner; never imply these are real photos.
 */
export const KNOWN_IMAGE_CODES = [
  "CHICKEN_RICE", "MUSHROOM_RICE", "PHO_BO", "BANH_MI", "BUN_THIT_NUONG", "MILK_TEA",
  "COM_TAM_SUON", "PHO_TAI", "BUN_BO_HUE", "BANH_MI_THIT", "MI_HOANH_THANH", "TRA_SUA_TRAN_CHAU",
  "KHOAI_TAY_CHIEN", "BUN_DAU", "COM_CHAY_NAM", "BANH_MI_CHAY", "HU_TIEU_NAM_VANG", "BUN_THIT_NUONG_2",
] as const;
export type KnownImageCode = (typeof KNOWN_IMAGE_CODES)[number];
const imageCodes: ReadonlySet<string> = new Set(KNOWN_IMAGE_CODES);

const exactFoodPhoto: Readonly<Record<string, KnownImageCode>> = {
  "Cơm tấm sườn nướng": "COM_TAM_SUON",
  "Cơm tấm sườn trứng": "COM_TAM_SUON",
  "Cơm tấm sườn bì chả": "COM_TAM_SUON",
  "Phở bò tái": "PHO_TAI",
  "Phở bò chín": "PHO_TAI",
  "Phở tái nạm": "PHO_TAI",
  "Phở đặc biệt": "PHO_TAI",
  "Phở bò": "PHO_TAI",
  "Phở bò đặc biệt": "PHO_TAI",
  "Bún bò Huế truyền thống": "BUN_BO_HUE",
  "Bún bò giò heo": "BUN_BO_HUE",
  "Bún bò đặc biệt": "BUN_BO_HUE",
  "Bún bò chả cua": "BUN_BO_HUE",
  "Bún bò gân": "BUN_BO_HUE",
  "Bánh mì thịt nướng": "BANH_MI_THIT",
  "Bánh mì thịt": "BANH_MI_THIT",
  "Mì hoành thánh": "MI_HOANH_THANH",
  "Mì xá xíu": "MI_HOANH_THANH",
  "Trà sữa trân châu": "TRA_SUA_TRAN_CHAU",
  "Trà sữa ô long": "TRA_SUA_TRAN_CHAU",
  "Trà sữa size lớn": "TRA_SUA_TRAN_CHAU",
  "Khoai tây chiên": "KHOAI_TAY_CHIEN",
  "Bún đậu phần nhỏ": "BUN_DAU",
  "Bún đậu đầy đủ": "BUN_DAU",
  "Bún đậu chả cốm": "BUN_DAU",
  "Bún đậu thịt luộc": "BUN_DAU",
  "Bún đậu nem rán": "BUN_DAU",
  "Cơm nấm kho tiêu": "COM_CHAY_NAM",
  "Bánh mì chay nấm": "BANH_MI_CHAY",
  "Bánh mì chay": "BANH_MI_CHAY",
  "Hủ tiếu Nam Vang": "HU_TIEU_NAM_VANG",
  "Bún thịt nướng": "BUN_THIT_NUONG_2",
  "Cơm gà nướng": "CHICKEN_RICE",
  "Cơm nấm kho": "MUSHROOM_RICE",
};

const exactRestaurantPhoto: Readonly<Record<string, KnownImageCode>> = {
  "[Mẫu] Bếp Tre Xanh": "CHICKEN_RICE",
  "[Mẫu] Phở Sáng Mai": "PHO_TAI",
  "[Mẫu] Bún Bò Gió Nội": "BUN_BO_HUE",
  "[Mẫu] Bánh Mì Góc Nhỏ": "BANH_MI_THIT",
  "[Mẫu] Cơm Tấm Hạt Nắng": "COM_TAM_SUON",
  "[Mẫu] Mì Nhà Mây": "MI_HOANH_THANH",
  "[Mẫu] Bếp Chay An Nhiên": "COM_CHAY_NAM",
  "[Mẫu] Trà Sữa Mộc Miên": "TRA_SUA_TRAN_CHAU",
  "[Mẫu] Ăn Vặt Góc Phố": "KHOAI_TAY_CHIEN",
  "[Mẫu] Bún Đậu Mẹt Tre": "BUN_DAU",
};

export function illustrativePhotoKey(imageCode?: string, name?: string): KnownImageCode | null {
  if (imageCode && imageCodes.has(imageCode)) return imageCode as KnownImageCode;
  if (imageCode && imageCode !== "SAMPLE_FOOD" && imageCode !== "SAMPLE_RESTAURANT") return null;
  if (!name) return null;
  const lookup = imageCode === "SAMPLE_RESTAURANT" ? exactRestaurantPhoto : exactFoodPhoto;
  return Object.prototype.hasOwnProperty.call(lookup, name) ? lookup[name] : null;
}
