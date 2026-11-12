export function decodeStoredValue<T>(raw: string | null): T | null {
  if (raw === null) return null;
  try { return JSON.parse(raw) as T; }
  catch { throw new Error("Không đọc được nội dung đã lưu. Thử tải lại trước khi gửi tiếp nhé."); }
}
