import type {
  Address,
  Cart,
  CartItem,
  DriverOffer,
  Message,
  Offer,
  Order,
  Page,
  Quote,
} from "../types/domain.ts";
import {orderEventText,visibleOrderEvent} from './orderEvents.ts';
type Wire = Record<string, unknown>;
const object = (v: unknown): Wire =>
  v && typeof v === "object" ? (v as Wire) : {};
const rows = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown, fallback = "") =>
  typeof v === "string"
    ? v
    : v === undefined || v === null
      ? fallback
      : String(v);
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
export function normalizePage<T>(
  value: unknown,
  adapt: (v: unknown) => T,
): Page<T> {
  const wire = object(value);
  const content = Array.isArray(value)
    ? value
    : rows(wire.content ?? wire.items);
  return {
    content: content.map(adapt),
    page: num(wire.page ?? wire.number),
    hasNext:
      typeof wire.hasNext === "boolean" ? wire.hasNext : wire.last === false,
  };
}
export function normalizeOfferPage(value: unknown): Offer[] {
  return normalizePage(value, (v) => v as Offer).content;
}
function normalizeLine(
  value: unknown,
  index: number,
  catalog: Record<string, unknown> = {},
): CartItem {
  const w = object(value),
    food = object(catalog[str(w.foodId)]);
  const optionNames = rows(food.optionGroups)
    .flatMap((g) => rows(object(g).values))
    .map(object)
    .filter((v) => rows(w.optionValueIds).includes(v.id))
    .map((v) => str(v.name));
  const snapshotOptions = rows(w.optionsSnapshot ?? w.options_snapshot)
    .map((v) => str(object(v).valueName ?? object(v).name))
    .filter(Boolean);
  return {
    id: str(w.id, `line-${index}`),
    foodId: str(w.foodId),
    foodName: str(w.foodName ?? w.name ?? food.name, "Món trong đơn"),
    imageCode: str(w.imageCode ?? food.imageCode) || undefined,
    quantity: num(w.quantity),
    unitPrice: num(w.unitPrice ?? w.estimatedUnitPrice),
    options:
      typeof w.options === "string"
        ? w.options
        : [...optionNames, ...snapshotOptions].join(" · "),
    note: str(w.note),
    available: typeof w.available === 'boolean' ? w.available : undefined,
    validationMessage: str(w.validationMessage) || undefined,
  };
}
export function normalizeCart(
  value: unknown,
  catalog: Record<string, unknown> = {},
): Cart {
  const w = object(value);
  return {
    id: str(w.id),
    version: num(w.version),
    restaurantId: str(w.restaurantId),
    restaurantName: str(w.restaurantName, "Nhà hàng trong giỏ"),
    items: rows(w.items).map((v, i) => normalizeLine(v, i, catalog)),
  };
}
export function normalizeQuote(value: unknown): Quote {
  const w = object(value);
  return {
    ...w,
    id: str(w.id),
    expectedCartVersion: num(w.cartVersion ?? w.expectedCartVersion),
    items: rows(w.lines ?? w.items).map((v, i) => normalizeLine(v, i)),
    address: object(w.address) as unknown as Address,
    addressId: str(object(w.address).id ?? w.addressId),
    offerId: str(object(w.offer).id ?? w.offerId) || undefined,
    paymentMethod: w.paymentMethod as Quote["paymentMethod"],
    restaurantName: str(w.restaurantName, "Nhà hàng trong giỏ"),
    subtotal: num(w.subtotal),
    deliveryFee: num(w.deliveryFee),
    foodDiscount: num(w.foodDiscount),
    deliveryDiscount: num(w.deliveryDiscount),
    total: num(w.total),
    expiresAt: str(w.expiresAt),
  } as Quote;
}
export function normalizeOrder(value: unknown): Order {
  const w = object(value),
    recipient = object(w.recipient ?? w.recipientSnapshot),
    driver = object(w.driver),
    amounts = object(w.amounts);
  return {
    id: str(w.id),
    customerId: str(w.customerId),
    restaurantId: str(w.restaurantId),
    restaurantName: str(w.restaurantName),
    recipientName: str(
      w.recipientName || recipient.recipientName || recipient.name,
    ),
    recipientPhone: str(
      w.recipientPhone || recipient.recipientPhone || recipient.phone,
    ),
    addressText: str(
      w.addressText || recipient.addressText || recipient.address,
    ),
    areaCode: str(w.areaCode || recipient.areaCode),
    driverId: str(w.driverId ?? driver.id) || undefined,
    driverName: str(w.driverName ?? driver.displayName) || undefined,
    items: rows(w.lines ?? w.items).map((v, i) => normalizeLine(v, i)),
    status: w.status as Order["status"],
    deliveryStatus: w.deliveryStatus as Order["deliveryStatus"],
    paymentMethod: w.paymentMethod as Order["paymentMethod"],
    paymentStatus: w.paymentStatus as Order["paymentStatus"],
    subtotal: num(amounts.subtotal ?? w.subtotal),
    deliveryFee: num(amounts.deliveryFee ?? w.deliveryFee),
    foodDiscount: num(amounts.foodDiscount ?? w.foodDiscount),
    deliveryDiscount: num(amounts.deliveryDiscount ?? w.deliveryDiscount),
    total: num(amounts.total ?? w.total),
    createdAt: str(w.createdAt),
    updatedAt: str(w.updatedAt ?? w.createdAt),
    issue: str(w.issue ?? w.deliveryIssue) || undefined,
    allowedActions: rows(w.allowedActions).map((v) => {
      const a = str(v);
      return a.toUpperCase() === "RETRY_DISPATCH"
        ? "retryDispatch"
        : a === "retryDispatch"
          ? a
          : a.toLowerCase();
    }),
    events: rows(w.events ?? w.history).filter(v=>visibleOrderEvent(str(object(v).eventType))).map((v) => {
      const e = object(v);
      return {
        id: str(e.id),
        text: orderEventText(str(e.eventType),str(e.text ?? e.description ?? e.eventType)),
        createdAt: str(e.createdAt),
      };
    }),
  };
}
export function normalizeDriverOffer(value: unknown): DriverOffer {
  const w = object(value);
  return {
    ...w,
    id: str(w.id),
    orderId: str(w.orderId),
    restaurantName: str(w.restaurantName),
    areaCode: str(w.deliveryArea ?? w.areaCode),
    codAmount: num(w.codAmount),
    expiresAt: str(w.expiresAt),
  };
}
export function normalizeMessage(value: unknown): Message {
  const w = object(value);
  return {
    ...w,
    id: str(w.id),
    senderId: str(w.senderId),
    senderName: str(w.senderName, "Người tham gia"),
    clientMessageId: str(w.clientMessageId),
    kind: w.kind as Message["kind"],
    text: w.text as string | undefined,
    assetCode: w.assetCode as string | undefined,
    createdAt: str(w.sentAt ?? w.createdAt),
  };
}
/** Only an authoritative refusal allows a fresh quote/key. Unknown network/server outcomes retain it. */
export function shouldKeepCheckoutReference(error: unknown) {
  const e = object(error);
  const code = str(e.code ?? e.message);
  return ![
    "QUOTE_EXPIRED",
    "QUOTE_CHANGED",
    "CART_VERSION_CONFLICT",
    "EMPTY_CART",
    "INVALID_OFFER",
    "INVALID_ADDRESS",
    "ITEM_UNAVAILABLE",
    "INVALID_PAYMENT",
    "INVALID_OPTIONS",
    "INVALID_QUANTITY",
    "NOT_FOUND",
  ].includes(code);
}
