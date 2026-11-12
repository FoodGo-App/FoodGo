export type Role = "CUSTOMER" | "RESTAURANT" | "DRIVER";
export type User = {
  id: string;
  displayName: string;
  role: Role;
  restaurantId?: string;
};
export type Session = { token: string; user: User };
export type PaymentMethod = "COD" | "MOCK_WALLET";
export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";
export type DeliveryStatus =
  | "NOT_STARTED"
  | "FINDING_DRIVER"
  | "NO_DRIVER"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED";
export type Address = {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressText: string;
  areaCode: string;
  mapPointCode: string;
};
export type CartItem = {
  valid?: boolean;
  invalidReason?: string;
  invalidMessage?: string;
  optionValueIds?: string[];
  id: string;
  foodId: string;
  foodName: string;
  imageCode?: string;
  quantity: number;
  unitPrice: number;
  options: string;
  note: string;
};
export type Cart = {
  id: string;
  version: number;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
};
export type Offer = {
  id: string;
  code: string;
  name: string;
  kind: "PERCENT" | "DELIVERY_DISCOUNT" | "FREE_DELIVERY";
  percent?: number;
  cap?: number;
  amount?: number;
  minSubtotal: number;
  requiredMethod?: PaymentMethod;
};
export type QuoteInput = {
  addressId: string;
  offerId?: string;
  paymentMethod: PaymentMethod;
  expectedCartVersion: number;
};
export type Quote = QuoteInput & {
  id: string;
  restaurantName: string;
  items: CartItem[];
  address: Address;
  subtotal: number;
  deliveryFee: number;
  foodDiscount: number;
  deliveryDiscount: number;
  total: number;
  expiresAt: string;
};
export type Attempt = {
  id: string;
  requestKey: string;
  result: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";
  orderId: string | null;
  reasonCode?: string;
};
export type OrderEvent = { id: string; text: string; createdAt: string };
export type Order = {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  recipientName: string;
  recipientPhone: string;
  addressText: string;
  areaCode: string;
  items: CartItem[];
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  subtotal: number;
  deliveryFee: number;
  foodDiscount: number;
  deliveryDiscount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  driverId?: string;
  driverName?: string;
  issue?: string;
  events: OrderEvent[];
  allowedActions: string[];
  dispatchRound?: number;
};
export type DriverOffer = {
  id: string;
  orderId: string;
  restaurantName: string;
  areaCode: string;
  codAmount: number;
  expiresAt: string;
};
export type Tracking = {
  orderId: string;
  simulated: true;
  updatedAt: string;
  etaMinutes: number;
  mapAssetCode: string;
  routeCode: string;
};
export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  clientMessageId: string;
  kind: "TEXT" | "IMAGE";
  text?: string;
  assetCode?: string;
  createdAt: string;
};
export type MessageInput = Pick<
  Message,
  "clientMessageId" | "kind" | "text" | "assetCode"
>;
export type Conversation = {
  id: string;
  orderId: string;
  readOnly: boolean;
  participants: { id: string; displayName: string }[];
};
export type ReviewInput = { stars: number; tags: string[]; note: string };
export type Review = ReviewInput & {
  id: string;
  orderId: string;
  createdAt: string;
};
export type Page<T> = { content: T[]; page: number; hasNext: boolean };
export type CallAccess = {
  orderId: string;
  allowed: boolean;
  simulated: true;
  scenarioCode: "CONNECTED" | "NO_ANSWER" | "FAILED";
};
export type Requester = <T>(
  path: string,
  method?: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown,
  key?: string,
) => Promise<T>;
