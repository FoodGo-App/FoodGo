import type {
  Order,
  Page,
  Requester,
  Tracking,
} from "../../../shared/types/domain";
import { normalizeOrder, normalizePage } from "../../../shared/api/adapters";
export const orderService = (request: Requester) => ({
  list: async (page = 0, status = ""): Promise<Page<Order>> =>
    normalizePage(
      await request(
        `/orders?page=${page}&size=20${status ? `&status=${status}` : ""}`,
      ),
      normalizeOrder,
    ),
  detail: async (id: string) => normalizeOrder(await request(`/orders/${id}`)),
  tracking: (id: string) => request<Tracking>(`/orders/${id}/tracking`),
  cancel: (id: string, reason: string) =>
    request<Order>(`/orders/${id}/cancel`, "POST", { reason }),
  retry: (id: string) =>
    request<Order>(`/orders/${id}/dispatch-retries`, "POST", {}),
});
