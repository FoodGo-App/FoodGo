import type { Address, Requester } from "../../shared/types/domain.ts";
export type AddressInput = Omit<Address, "id">;
export const blankAddress: AddressInput = { recipientName: "", recipientPhone: "", addressText: "", label: "Nhà", areaCode: "AREA_A", mapPointCode: "CUSTOMER_A" };
export function validateAddress(value: AddressInput): string | null {
  if (!value.recipientName.trim() || value.recipientName.trim().length > 100) return "Tên người nhận cần có và tối đa 100 ký tự.";
  if (!/^0[0-9]{9}$/.test(value.recipientPhone)) return "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.";
  if (!value.addressText.trim() || value.addressText.trim().length > 255) return "Địa chỉ cần có và tối đa 255 ký tự.";
  if (!value.label.trim() || value.label.trim().length > 40) return "Nhãn địa chỉ cần có và tối đa 40 ký tự.";
  if (value.areaCode !== "AREA_A" || !["CUSTOMER_A", "CUSTOMER_B"].includes(value.mapPointCode)) return "Chọn khu vực và điểm mẫu được hỗ trợ.";
  return null;
}
export const addressService = (request: Requester) => ({
  list: () => request<Address[]>("/addresses"),
  save: (value: AddressInput, id?: string) => request<Address>(id ? `/addresses/${encodeURIComponent(id)}` : "/addresses", id ? "PUT" : "POST", { recipientName:value.recipientName,recipientPhone:value.recipientPhone,addressText:value.addressText,label:value.label,areaCode:value.areaCode,mapPointCode:value.mapPointCode }),
  remove: (id: string) => request(`/addresses/${encodeURIComponent(id)}`, "DELETE"),
});
