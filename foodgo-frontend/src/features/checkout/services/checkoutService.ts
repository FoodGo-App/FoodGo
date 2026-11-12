import type {
  Attempt,
  Cart,
  Address,
  Offer,
  Quote,
  QuoteInput,
  Requester,
} from "../../../shared/types/domain";
import {
  normalizeCart,
  normalizeOfferPage,
  normalizeQuote,
} from "../../../shared/api/adapters";
export const checkoutService = (request: Requester) => ({
  context: async () => {
    const [rawCart, addresses, rawOffers] = await Promise.all([
      request<Cart>("/cart"),
      request<Address[]>("/addresses"),
      request<Offer[]>("/catalog/offers?page=0&size=50"),
    ]);
    let cart = normalizeCart(rawCart);
    if (cart.items.some((i) => i.foodName === "Món trong đơn")) {
      const foodIds = [...new Set(cart.items.map((i) => i.foodId))];
      const foods = await Promise.all(
        foodIds.map(
          async (id) =>
            [
              id,
              await request(`/catalog/foods/${encodeURIComponent(id)}`),
            ] as const,
        ),
      );
      cart = normalizeCart(rawCart, Object.fromEntries(foods));
    }
    return { cart, addresses, offers: normalizeOfferPage(rawOffers) };
  },
  quote: async (input: QuoteInput): Promise<Quote> =>
    normalizeQuote(await request("/checkout/quotes", "POST", input)),
  removeItem: (id: string, expectedVersion: number) =>
    request<Cart>(`/cart/items/${encodeURIComponent(id)}?expectedVersion=${expectedVersion}`, 'DELETE'),
  place: (quoteId: string, expectedCartVersion: number, key: string) =>
    request<Attempt>(
      "/checkout/attempts",
      "POST",
      { quoteId, expectedCartVersion },
      key,
    ),
  byKey: (key: string) =>
    request<Attempt>(`/checkout/attempts/by-key/${encodeURIComponent(key)}`),
  current: () => request<Attempt | null>("/checkout/attempts/current"),
  attempt: (id: string) => request<Attempt>(`/checkout/attempts/${id}`),
  resolve: (id: string) =>
    request<Attempt>(`/checkout/attempts/${id}/resolve`, "POST", {}),
  cancel: (id: string) =>
    request<Attempt>(`/checkout/attempts/${id}/cancel`, "POST", {}),
});
