import type {
  DriverOffer,
  Order,
  Page,
  Requester,
} from "../../../shared/types/domain";
import {
  normalizeDriverOffer,
  normalizeOrder,
  normalizePage,
} from "../../../shared/api/adapters";
export const deliveryService = (request: Requester) => ({
  restaurant: async (page = 0): Promise<Page<Order>> =>
    normalizePage(
      await request(`/restaurant/orders?page=${page}&size=20`),
      normalizeOrder,
    ),
  restaurantAction: (
    id: string,
    action: "accept" | "reject" | "prepare" | "ready",
    reason?: string,
  ) =>
    request<Order>(
      `/restaurant/orders/${id}/${action}`,
      "POST",
      reason ? { reason } : {},
    ),
  offers: async (page = 0): Promise<Page<DriverOffer>> =>
    normalizePage(
      await request(`/driver/offers?page=${page}&size=20`),
      normalizeDriverOffer,
    ),
  offerAction: async (id: string, action: "accept" | "decline") =>
    normalizeOrder(
      await request(
        `/driver/offers/${encodeURIComponent(id)}/${action}`,
        "POST",
        {},
      ),
    ),
  jobs: async (page = 0, scope = "active"): Promise<Page<Order>> =>
    normalizePage(
      await request(`/driver/orders?scope=${scope}&page=${page}&size=20`),
      normalizeOrder,
    ),
  pickup: (id: string) =>
    request<Order>(`/driver/orders/${id}/pickup`, "POST", {}),
  deliver: (id: string, codCollected: boolean) =>
    request<Order>(`/driver/orders/${id}/deliver`, "POST", { codCollected }),
  issue: (id: string, reason: string, key: string) =>
    request(`/driver/orders/${id}/issues`, "POST", { reason }, key),
});
