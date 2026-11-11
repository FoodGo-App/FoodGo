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
  NOT_FOUND: "Không tìm thấy dữ liệu trong phạm vi tài khoản.",
  INVALID_OFFER:
    "Ưu đãi chưa đủ điều kiện với giỏ hoặc phương thức thanh toán.",
  QUOTE_EXPIRED: "Báo giá đã hết hạn. Hãy lấy báo giá mới và kiểm tra lại.",
  QUOTE_CHANGED: "Nội dung hoặc giá đã thay đổi. Hãy kiểm tra báo giá mới.",
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
  COD_CONFIRMATION_REQUIRED: "Cần xác nhận đã thu đủ tiền COD.",
  NETWORK_ERROR:
    "Không kết nối được máy chủ. Hãy kiểm tra lại kết quả trước khi gửi thêm.",
};
export const explain = (error: unknown) => {
  const code = error instanceof Error ? error.message : String(error);
  return messages[code] ?? code;
};
