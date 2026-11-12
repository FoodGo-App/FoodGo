export const colors = {
  ink: "#163B36",
  muted: "#566E68",
  brand: "#006C59",
  mint: "#E5F3EB",
  paper: "#FBFAF6",
  line: "#D8E3DB",
  orange: "#A14624",
  warm: "#F6E7D5",
  danger: "#A52E38",
  white: "#FFFFFF",
};
export const money = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
export const statusLabels: Record<string, string> = {
  PENDING_CONFIRMATION: "Chờ quán xác nhận",
  CONFIRMED: "Quán đã nhận đơn",
  PREPARING: "Đang chuẩn bị món",
  READY_FOR_PICKUP: "Món đã sẵn sàng",
  OUT_FOR_DELIVERY: "Tài xế đang giao",
  DELIVERED: "Giao thành công",
  CANCELLED: "Đã hủy",
  REJECTED: "Quán từ chối",
  NOT_STARTED: "Chưa tìm tài xế",
  FINDING_DRIVER: "Đang tìm tài xế",
  NO_DRIVER: "Chưa có người nhận",
  DRIVER_ASSIGNED: "Đã có tài xế",
  PICKED_UP: "Đã lấy món",
  UNPAID: "Chưa thu tiền",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
  PENDING: "Đang xử lý",
  SUCCEEDED: "Thành công",
  FAILED: "Chưa thành công",
};
const messages: Record<string, string> = {
  AUTH_REQUIRED: "Bạn cần đăng nhập để tiếp tục.",
  FORBIDDEN: "Tài khoản không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy nội dung này. Hãy tải lại và thử lại.",
  INVALID_OFFER:
    "Ưu đãi chưa đủ điều kiện với giỏ hoặc phương thức thanh toán.",
  QUOTE_EXPIRED: "Giá đã hết thời gian giữ. Hãy cập nhật và kiểm tra lại.",
  QUOTE_CHANGED: "Món hoặc giá đã thay đổi. Hãy kiểm tra lại trước khi đặt.",
  CART_VERSION_CONFLICT: "Giỏ đã thay đổi. Hãy tải lại trước khi xác nhận.",
  ORDER_STATE_CONFLICT:
    "Đơn đã chuyển trạng thái. Hãy tải lại để xem thao tác phù hợp.",
  DRIVER_BUSY: "Bạn đang giao một đơn khác.",
  OFFER_EXPIRED: "Đề xuất đã hết hiệu lực hoặc có người nhận.",
  EMPTY_CART: "Giỏ đang trống. Hãy chọn món trước.",
  MESSAGE_READ_ONLY: "Đơn đã kết thúc. Hội thoại chỉ được đọc.",
  REVIEW_ALREADY_EXISTS: "Đơn đã được đánh giá. Hãy xem đánh giá đã lưu.",
  CALL_NOT_ALLOWED: "Hiện không thể mở cuộc gọi cho đơn này.",
  CHECKOUT_IN_PROGRESS: "Một lần thanh toán đang chờ. Hãy kiểm tra lại lần đó.",
  COD_CONFIRMATION_REQUIRED: "Hãy xác nhận đã thu đủ tiền mặt từ khách.",
  COD_NOT_ALLOWED: "Đơn này không dùng thanh toán tiền mặt. Hãy chọn cách thanh toán khác.",
  WALLET_FAILED: "Ví chưa thanh toán được. Giỏ của bạn vẫn được giữ để thử lại.",
  INVALID_ADDRESS: "Hãy chọn địa chỉ giao hàng hợp lệ trước khi tiếp tục.",
  INVALID_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu chưa đúng. Hãy kiểm tra lại.",
  INVALID_PAYMENT: "Cách thanh toán này chưa dùng được. Hãy chọn cách khác.",
  INVALID_MESSAGE: "Tin nhắn cần có nội dung và không quá 1.000 ký tự.",
  INVALID_REASON: "Hãy nhập lý do trong khoảng 1 đến 300 ký tự.",
  REASON_REQUIRED: "Hãy nhập lý do để tiếp tục.",
  INVALID_REVIEW: "Hãy chọn số sao và kiểm tra lại nội dung đánh giá.",
  ORDER_NOT_DELIVERED: "Bạn có thể đánh giá sau khi đơn được giao thành công.",
  IDEMPOTENCY_CONFLICT: "Yêu cầu trước đã được ghi nhận. Hãy tải lại để xem kết quả.",
  IDEMPOTENCY_KEY_REQUIRED: "Chưa gửi được yêu cầu. Hãy tải lại rồi thử lại.",
  MESSAGE_KEY_CONFLICT: "Tin nhắn trước đã được ghi nhận. Hãy tải lại hội thoại.",
  API_NOT_CONFIGURED: "FoodGo chưa kết nối được dịch vụ. Vui lòng thử lại sau.",
  HTTP_ERROR: "Chưa thực hiện được yêu cầu. Hãy tải lại rồi thử lại.",
  NETWORK_ERROR:
    "Không kết nối được máy chủ. Hãy kiểm tra lại kết quả trước khi gửi thêm.",
};
export const explain = (error: unknown) => {
  const detail = error && typeof error === "object" ? error : null;
  const code = detail && "code" in detail && typeof detail.code === "string"
    ? detail.code
    : error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (Object.hasOwn(messages, code)) return messages[code];
  // Preserve useful Vietnamese guidance, never expose transport/debug text.
  const text = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/[^\x00-\x7F]/.test(text) && !/\b(API|HTTP|idempotency|version|module|M0[1-5])\b|[A-Z]+_[A-Z_]+/i.test(text)) return text;
  return "Chưa thực hiện được yêu cầu. Hãy tải lại rồi thử lại.";
};
