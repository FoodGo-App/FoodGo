// A deterministic, explicitly labelled demo transport. Never used as HTTP fallback.
import type {
  Address,
  Attempt,
  Cart,
  Conversation,
  Message,
  MessageInput,
  Offer,
  Order,
  OrderStatus,
  Page,
  Quote,
  QuoteInput,
  Review,
  ReviewInput,
  User,
} from "../types/domain.ts";

type StoredAttempt = Attempt & {
  customerId: string;
  quoteId: string;
  fingerprint: string;
};
type State = {
  seq: number;
  offerExpires: Record<string, number>;
  carts: Record<string, Cart>;
  quotes: Record<string, Quote & { customerId: string }>;
  attempts: StoredAttempt[];
  orders: Order[];
  messages: Record<string, Message[]>;
  reviews: Record<string, Review>;
  declines: string[];
  walletScenario: "SUCCEEDED" | "FAILED";
  callScenario: "CONNECTED" | "NO_ANSWER" | "FAILED";
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const terminal = (o: Order) =>
  ["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status);
const users: User[] = [
  { id: "customer-1", displayName: "Minh Anh", role: "CUSTOMER" },
  { id: "customer-2", displayName: "Khách thứ hai", role: "CUSTOMER" },
  {
    id: "restaurant-1",
    displayName: "Bếp Nhà",
    role: "RESTAURANT",
    restaurantId: "restaurant-1",
  },
  { id: "driver-1", displayName: "Nguyễn An", role: "DRIVER" },
  { id: "driver-2", displayName: "Trần Bình", role: "DRIVER" },
];
export const DEMO_USERS = users;
export const DEMO_ADDRESS: Address = {
  id: "address-1",
  label: "Nhà",
  recipientName: "Minh Anh",
  recipientPhone: "0900000000",
  addressText: "12 Đường Mẫu, Khu vực A, TP. Hồ Chí Minh",
  areaCode: "AREA_A",
  mapPointCode: "HOME_A",
};
export const DEMO_OFFERS: Offer[] = [
  {
    id: "offer-10",
    code: "TRUA10",
    name: "Giảm 10% tiền món",
    kind: "PERCENT",
    percent: 10,
    cap: 20000,
    minSubtotal: 100000,
  },
  {
    id: "offer-ship",
    code: "SHIP5",
    name: "Giảm 5.000đ phí giao",
    kind: "DELIVERY_DISCOUNT",
    amount: 5000,
    minSubtotal: 0,
  },
  {
    id: "offer-free",
    code: "FREESHIP",
    name: "Miễn phí giao hàng",
    kind: "FREE_DELIVERY",
    minSubtotal: 100000,
  },
  {
    id: "offer-wallet",
    code: "VI10",
    name: "Giảm 10% khi dùng ví",
    kind: "PERCENT",
    percent: 10,
    cap: 20000,
    minSubtotal: 100000,
    requiredMethod: "MOCK_WALLET",
  },
];
function seedCart(): Cart {
  return {
    id: "cart-1",
    version: 1,
    restaurantId: "restaurant-1",
    restaurantName: "Bếp Nhà",
    items: [
      {
        id: "item-1",
        foodId: "food-1",
        foodName: "Cơm gà nướng",
        imageCode: "CHICKEN_RICE",
        unitPrice: 50000,
        quantity: 2,
        options: "Lớn · Trứng · Rau · Ít cay",
        note: "",
      },
      {
        id: "item-2",
        foodId: "food-2",
        foodName: "Cơm nấm kho",
        imageCode: "MUSHROOM_RICE",
        unitPrice: 40000,
        quantity: 1,
        options: "Phần tiêu chuẩn",
        note: "",
      },
    ],
  };
}
function initial(): State {
  return {
    seq: 0,
    offerExpires: {},
    carts: {
      "customer-1": seedCart(),
      "customer-2": { ...seedCart(), id: "cart-2" },
    },
    quotes: {},
    attempts: [],
    orders: [],
    messages: {},
    reviews: {},
    declines: [],
    walletScenario: "SUCCEEDED",
    callScenario: "CONNECTED",
  };
}
function fail(code: string): never {
  throw new Error(code);
}
export class DemoEngine {
  state: State;
  clock: () => number;
  constructor(saved?: State, clock: () => number = Date.now) {
    this.state = saved
      ? {
          ...initial(),
          ...clone(saved),
          offerExpires: saved.offerExpires ?? {},
        }
      : initial();
    this.clock = clock;
  }
  snapshot() {
    return clone(this.state);
  }
  private id(prefix: string) {
    return `${prefix}-${++this.state.seq}`;
  }
  private date() {
    return new Date(this.clock()).toISOString();
  }
  private user(id: string | null) {
    return users.find((u) => u.id === id) ?? fail("AUTH_REQUIRED");
  }
  private role(user: User, role: User["role"]) {
    if (user.role !== role) fail("FORBIDDEN");
  }
  private getOrder(id: string, user: User) {
    const o = this.state.orders.find((o) => o.id === id) ?? fail("NOT_FOUND");
    if (!(
      (user.role === "CUSTOMER" && o.customerId === user.id) ||
      (user.role === "RESTAURANT" && o.restaurantId === user.restaurantId) ||
      (user.role === "DRIVER" && o.driverId === user.id)
    ))
      fail("NOT_FOUND");
    return o;
  }
  private event(o: Order, text: string) {
    o.updatedAt = this.date();
    o.events.push({ id: this.id("event"), text, createdAt: o.updatedAt });
  }
  private view(o: Order, user: User): Order {
    const actions: string[] = [];
    if (user.role === "CUSTOMER") {
      if (o.status === "PENDING_CONFIRMATION") actions.push("cancel");
      if (o.deliveryStatus === "NO_DRIVER" && !terminal(o))
        actions.push("retryDispatch");
      if (o.status === "DELIVERED" && !this.state.reviews[o.id])
        actions.push("review");
    }
    if (user.role === "RESTAURANT") {
      if (o.status === "PENDING_CONFIRMATION") actions.push("accept", "reject");
      if (o.status === "CONFIRMED") actions.push("prepare");
      if (o.status === "PREPARING") actions.push("ready");
    }
    if (user.role === "DRIVER") {
      if (o.status === "READY_FOR_PICKUP") actions.push("pickup");
      if (o.status === "OUT_FOR_DELIVERY") actions.push("deliver", "issue");
    }
    if (o.driverId && !terminal(o) && user.role !== "RESTAURANT")
      actions.push("chat", "call");
    if (o.driverId && user.role !== "RESTAURANT") actions.push("conversation");
    return clone({ ...o, allowedActions: actions });
  }
  private page<T>(items: T[], query: URLSearchParams): Page<T> {
    const p = Math.max(0, Number(query.get("page")) || 0),
      size = Math.min(50, Math.max(1, Number(query.get("size")) || 20));
    return {
      content: clone(items.slice(p * size, (p + 1) * size)),
      page: p,
      hasNext: items.length > (p + 1) * size,
    };
  }
  private commit(a: StoredAttempt) {
    const q = this.state.quotes[a.quoteId];
    const cart = this.state.carts[a.customerId];
    if (!q || cart.version !== q.expectedCartVersion)
      fail("CART_VERSION_CONFLICT");
    const o: Order = {
      customerId: a.customerId,
      restaurantId: cart.restaurantId,
      restaurantName: q.restaurantName,
      ...q.address,
      id: this.id("FG"),
      items: clone(q.items),
      status: "PENDING_CONFIRMATION",
      deliveryStatus: "NOT_STARTED",
      paymentMethod: q.paymentMethod,
      paymentStatus: q.paymentMethod === "COD" ? "UNPAID" : "PAID",
      subtotal: q.subtotal,
      deliveryFee: q.deliveryFee,
      foodDiscount: q.foodDiscount,
      deliveryDiscount: q.deliveryDiscount,
      total: q.total,
      createdAt: this.date(),
      updatedAt: this.date(),
      events: [],
      allowedActions: [],
    };
    this.event(o, "Đã gửi đơn đến nhà hàng");
    this.state.orders.unshift(o);
    a.orderId = o.id;
    a.result = "SUCCEEDED";
    cart.items = [];
    cart.version++;
    return a;
  }
  request(
    userId: string | null,
    raw: string,
    method = "GET",
    payload?: unknown,
    key?: string,
  ): unknown {
    const [path, search = ""] = raw.split("?");
    const query = new URLSearchParams(search);
    const b = (payload ?? {}) as Record<string, unknown>;
    if (path === "/auth/login") {
      const name = String(b.username);
      const user =
        users.find((u) => u.id === name) ?? fail("INVALID_CREDENTIALS");
      return { token: user.id, user: clone(user) };
    }
    const user = this.user(userId);
    if (path === "/auth/me") return clone(user);
    if (path === "/auth/logout") return { revoked: true };
    if (path === "/demo/settings") {
      if (b.walletScenario)
        this.state.walletScenario = b.walletScenario as State["walletScenario"];
      if (b.callScenario)
        this.state.callScenario = b.callScenario as State["callScenario"];
      return clone(this.state);
    }
    if (path === "/demo/cart") {
      this.role(user, "CUSTOMER");
      this.state.carts[user.id] = {
        ...seedCart(),
        version: this.state.carts[user.id].version + 1,
      };
      return clone(this.state.carts[user.id]);
    }
    if (path === "/cart") {
      this.role(user, "CUSTOMER");
      return clone(this.state.carts[user.id]);
    }
    if (path === "/addresses") {
      this.role(user, "CUSTOMER");
      return [
        {
          ...DEMO_ADDRESS,
          id: user.id === "customer-1" ? "address-1" : "address-2",
        },
      ];
    }
    if (path === "/catalog/offers") return clone(DEMO_OFFERS);
    if (path === "/checkout/quotes") {
      this.role(user, "CUSTOMER");
      const input = b as unknown as QuoteInput;
      const cart = this.state.carts[user.id];
      if (!cart.items.length) fail("EMPTY_CART");
      if (cart.version !== input.expectedCartVersion)
        fail("CART_VERSION_CONFLICT");
      if (
        input.addressId !==
        (user.id === "customer-1" ? "address-1" : "address-2")
      )
        fail("INVALID_ADDRESS");
      if (!["COD", "MOCK_WALLET"].includes(input.paymentMethod))
        fail("INVALID_PAYMENT");
      const subtotal = cart.items.reduce(
        (s, i) => s + i.quantity * i.unitPrice,
        0,
      );
      const offer = DEMO_OFFERS.find((o) => o.id === input.offerId);
      if (input.offerId && !offer) fail("INVALID_OFFER");
      if (
        offer &&
        (subtotal < offer.minSubtotal ||
          (offer.requiredMethod &&
            offer.requiredMethod !== input.paymentMethod))
      )
        fail("INVALID_OFFER");
      const foodDiscount =
        offer?.kind === "PERCENT"
          ? Math.min(
              Math.floor((subtotal * (offer.percent ?? 0)) / 100),
              offer.cap ?? subtotal,
            )
          : 0;
      const deliveryDiscount =
        offer?.kind === "FREE_DELIVERY"
          ? 15000
          : offer?.kind === "DELIVERY_DISCOUNT"
            ? Math.min(15000, offer.amount ?? 0)
            : 0;
      const q: Quote & { customerId: string } = {
        ...input,
        id: this.id("quote"),
        customerId: user.id,
        restaurantName: cart.restaurantName,
        items: clone(cart.items),
        address: { ...DEMO_ADDRESS, id: input.addressId },
        subtotal,
        deliveryFee: 15000,
        foodDiscount,
        deliveryDiscount,
        total: subtotal + 15000 - foodDiscount - deliveryDiscount,
        expiresAt: new Date(this.clock() + 120000).toISOString(),
      };
      this.state.quotes[q.id] = q;
      return clone(q);
    }
    if (path === "/checkout/attempts" && method === "POST") {
      this.role(user, "CUSTOMER");
      if (!key) fail("IDEMPOTENCY_KEY_REQUIRED");
      const fingerprint = JSON.stringify({
        quoteId: b.quoteId,
        expectedCartVersion: b.expectedCartVersion,
      });
      const existing = this.state.attempts.find(
        (a) => a.customerId === user.id && a.requestKey === key,
      );
      if (existing) {
        if (existing.fingerprint !== fingerprint) fail("IDEMPOTENCY_CONFLICT");
        return clone(existing);
      }
      const q = this.state.quotes[String(b.quoteId)];
      if (!q || q.customerId !== user.id) fail("NOT_FOUND");
      if (this.clock() > Date.parse(q.expiresAt)) fail("QUOTE_EXPIRED");
      if (this.state.carts[user.id].version !== b.expectedCartVersion)
        fail("CART_VERSION_CONFLICT");
      if (
        this.state.attempts.some(
          (a) => a.customerId === user.id && a.result === "PENDING",
        )
      )
        fail("CHECKOUT_IN_PROGRESS");
      const a: StoredAttempt = {
        id: this.id("attempt"),
        requestKey: key,
        quoteId: q.id,
        customerId: user.id,
        fingerprint,
        result: "PENDING",
        orderId: null,
      };
      this.state.attempts.push(a);
      if (q.paymentMethod === "COD") this.commit(a);
      return clone(a);
    }
    if (path.startsWith("/checkout/attempts/")) {
      this.role(user, "CUSTOMER");
      const bits = path.split("/");
      const a =
        this.state.attempts.find(
          (a) =>
            a.customerId === user.id &&
            (bits[3] === "by-key"
              ? a.requestKey === decodeURIComponent(bits[4])
              : a.id === bits[3]),
        ) ?? fail("NOT_FOUND");
      if (method === "POST" && a.result === "PENDING") {
        if (bits[4] === "cancel") a.result = "CANCELLED";
        if (bits[4] === "resolve") {
          if (this.state.walletScenario === "FAILED") {
            a.result = "FAILED";
            a.reasonCode = "WALLET_FAILED";
          } else this.commit(a);
        }
      }
      return clone(a);
    }
    if (["/orders", "/restaurant/orders", "/driver/orders"].includes(path)) {
      if (path === "/orders") this.role(user, "CUSTOMER");
      if (path === "/restaurant/orders") this.role(user, "RESTAURANT");
      if (path === "/driver/orders") this.role(user, "DRIVER");
      const list = this.state.orders
        .filter((o) =>
          user.role === "CUSTOMER"
            ? o.customerId === user.id
            : user.role === "RESTAURANT"
              ? o.restaurantId === user.restaurantId
              : o.driverId === user.id,
        )
        .filter((o) => !query.get("status") || o.status === query.get("status"))
        .filter(
          (o) =>
            !query.get("scope") ||
            (query.get("scope") === "active" ? !terminal(o) : terminal(o)),
        );
      return this.page(
        list.map((o) => this.view(o, user)),
        query,
      );
    }
    if (path === "/driver/offers") {
      this.role(user, "DRIVER");
      const list = this.state.orders
        .filter((o) => !terminal(o) && o.deliveryStatus === "FINDING_DRIVER")
        .flatMap((o) => {
          const offerId = `offer:${o.id}:${user.id}:${o.dispatchRound ?? 1}`;
          const expiry = this.state.offerExpires[offerId] ?? 0;
          if (
            expiry <= this.clock() ||
            this.state.declines.includes(`${o.id}:${user.id}`)
          ) {
            const unavailable = users
              .filter((u) => u.role === "DRIVER")
              .every(
                (u) =>
                  this.state.declines.includes(`${o.id}:${u.id}`) ||
                  (this.state.offerExpires[
                    `offer:${o.id}:${u.id}:${o.dispatchRound ?? 1}`
                  ] ?? 0) <= this.clock(),
              );
            if (unavailable) o.deliveryStatus = "NO_DRIVER";
            return [];
          }
          return [
            {
              id: offerId,
              orderId: o.id,
              restaurantName: o.restaurantName,
              areaCode: o.areaCode,
              codAmount: o.paymentMethod === "COD" ? o.total : 0,
              expiresAt: new Date(expiry).toISOString(),
            },
          ];
        });
      return this.page(list, query);
    }
    if (path.startsWith("/driver/offers/")) {
      this.role(user, "DRIVER");
      const id = decodeURIComponent(path.split("/")[3]);
      const [, orderId, driverId, round] = id.split(":");
      if (driverId !== user.id) fail("NOT_FOUND");
      const o =
        this.state.orders.find((o) => o.id === orderId) ?? fail("NOT_FOUND");
      if (
        Number(round) !== (o.dispatchRound ?? 1) ||
        (this.state.offerExpires[id] ?? 0) <= this.clock() ||
        o.deliveryStatus !== "FINDING_DRIVER" ||
        terminal(o) ||
        this.state.declines.includes(`${o.id}:${user.id}`)
      )
        fail("OFFER_EXPIRED");
      if (path.endsWith("/decline")) {
        this.state.declines.push(`${o.id}:${user.id}`);
        if (
          users
            .filter((u) => u.role === "DRIVER")
            .every((u) => this.state.declines.includes(`${o.id}:${u.id}`))
        )
          o.deliveryStatus = "NO_DRIVER";
        return { offerId: id, status: "DECLINED" };
      }
      if (this.state.orders.some((x) => x.driverId === user.id && !terminal(x)))
        fail("DRIVER_BUSY");
      o.driverId = user.id;
      o.driverName = user.displayName;
      o.deliveryStatus = "DRIVER_ASSIGNED";
      this.event(o, `${user.displayName} đã nhận giao`);
      return this.view(o, user);
    }
    const match = path.match(
      /^\/(?:restaurant\/|driver\/)?orders\/([^/]+)(?:\/(.+))?$/,
    );
    if (!match) fail("NOT_FOUND");
    const [, id, action] = match;
    const o = this.getOrder(id, user);
    if (path.startsWith("/restaurant/")) this.role(user, "RESTAURANT");
    if (path.startsWith("/driver/")) this.role(user, "DRIVER");
    if (!action) return this.view(o, user);
    if (action === "tracking") {
      if (user.role === "RESTAURANT") fail("FORBIDDEN");
      return {
        orderId: id,
        simulated: true,
        updatedAt: o.updatedAt,
        etaMinutes: 25,
        mapAssetCode: "AREA_A",
        routeCode: "ROUTE_A",
      };
    }
    if (action === "cancel" || action === "reject") {
      this.role(user, action === "cancel" ? "CUSTOMER" : "RESTAURANT");
      const target = action === "cancel" ? "CANCELLED" : "REJECTED";
      if (o.status === target) return this.view(o, user);
      if (o.status !== "PENDING_CONFIRMATION") fail("ORDER_STATE_CONFLICT");
      if (action === "reject" && !String(b.reason ?? "").trim())
        fail("REASON_REQUIRED");
      if (String(b.reason ?? "").length > 300) fail("INVALID_REASON");
      o.status = target;
      if (o.paymentStatus === "PAID") o.paymentStatus = "REFUNDED";
      this.event(
        o,
        `${action === "cancel" ? "Khách hủy đơn" : "Quán từ chối"}: ${b.reason ?? ""}`,
      );
      return this.view(o, user);
    }
    const transitions: Record<string, [OrderStatus, OrderStatus]> = {
      accept: ["PENDING_CONFIRMATION", "CONFIRMED"],
      prepare: ["CONFIRMED", "PREPARING"],
      ready: ["PREPARING", "READY_FOR_PICKUP"],
    };
    if (action in transitions) {
      this.role(user, "RESTAURANT");
      const [from, to] = transitions[action];
      if (o.status === to) return this.view(o, user);
      if (o.status !== from) fail("ORDER_STATE_CONFLICT");
      o.status = to;
      if (action === "accept") {
        o.deliveryStatus = "FINDING_DRIVER";
        o.dispatchRound = 1;
        for (const d of users.filter((u) => u.role === "DRIVER"))
          this.state.offerExpires[`offer:${o.id}:${d.id}:1`] =
            this.clock() + 30000;
      }
      this.event(
        o,
        {
          accept: "Nhà hàng xác nhận đơn",
          prepare: "Đang chuẩn bị món",
          ready: "Món đã sẵn sàng",
        }[action as "accept"],
      );
      return this.view(o, user);
    }
    if (action === "dispatch-retries") {
      this.role(user, "CUSTOMER");
      if (terminal(o) || o.deliveryStatus !== "NO_DRIVER")
        fail("ORDER_STATE_CONFLICT");
      o.deliveryStatus = "FINDING_DRIVER";
      o.dispatchRound = (o.dispatchRound ?? 1) + 1;
      for (const d of users.filter((u) => u.role === "DRIVER"))
        this.state.offerExpires[`offer:${o.id}:${d.id}:${o.dispatchRound}`] =
          this.clock() + 30000;
      this.state.declines = this.state.declines.filter(
        (x) => !x.startsWith(`${id}:`),
      );
      this.event(o, "Đang tìm lại tài xế");
      return this.view(o, user);
    }
    if (action === "pickup") {
      this.role(user, "DRIVER");
      if (o.status === "OUT_FOR_DELIVERY") return this.view(o, user);
      if (
        o.status !== "READY_FOR_PICKUP" ||
        o.deliveryStatus !== "DRIVER_ASSIGNED"
      )
        fail("ORDER_STATE_CONFLICT");
      o.status = "OUT_FOR_DELIVERY";
      o.deliveryStatus = "PICKED_UP";
      this.event(o, "Tài xế đã lấy món");
      return this.view(o, user);
    }
    if (action === "deliver") {
      this.role(user, "DRIVER");
      if (o.status === "DELIVERED") return this.view(o, user);
      if (o.status !== "OUT_FOR_DELIVERY") fail("ORDER_STATE_CONFLICT");
      if (o.paymentMethod === "COD" && b.codCollected !== true)
        fail("COD_CONFIRMATION_REQUIRED");
      if (o.paymentMethod === "MOCK_WALLET" && b.codCollected !== false)
        fail("COD_NOT_ALLOWED");
      o.status = "DELIVERED";
      o.deliveryStatus = "DELIVERED";
      o.paymentStatus = "PAID";
      this.event(o, "Giao hàng thành công");
      return this.view(o, user);
    }
    if (action === "issues") {
      this.role(user, "DRIVER");
      if (o.status !== "OUT_FOR_DELIVERY") fail("ORDER_STATE_CONFLICT");
      const reason = String(b.reason ?? "").trim();
      if (!reason || reason.length > 300) fail("INVALID_REASON");
      if (!key) fail("IDEMPOTENCY_KEY_REQUIRED");
      const old = o.events.find((x) => x.id === key);
      if (old) {
        if (old.text !== reason) fail("IDEMPOTENCY_CONFLICT");
        return clone(old);
      }
      const event = { id: key, text: reason, createdAt: this.date() };
      o.events.push(event);
      o.issue = reason;
      return clone(event);
    }
    if (["conversation", "messages", "call-access"].includes(action)) {
      if (user.role === "RESTAURANT" || !o.driverId) fail("NOT_FOUND");
      if (action === "conversation")
        return {
          id,
          orderId: id,
          readOnly: terminal(o),
          participants: [
            { id: o.customerId, displayName: o.recipientName },
            { id: o.driverId, displayName: o.driverName ?? "Tài xế" },
          ],
        } satisfies Conversation;
      if (action === "call-access") {
        if (terminal(o)) fail("CALL_NOT_ALLOWED");
        return {
          orderId: id,
          allowed: true,
          simulated: true,
          scenarioCode: this.state.callScenario,
        };
      }
      const list = this.state.messages[id] ?? (this.state.messages[id] = []);
      if (method === "GET") {
        const before = query.get("beforeId"),
          after = query.get("afterId");
        const filtered = list.filter(
          (m) =>
            (!before || Number(m.id) < Number(before)) &&
            (!after || Number(m.id) > Number(after)),
        );
        const limit = Math.min(50, Number(query.get("limit")) || 20);
        return clone(filtered.slice(-limit));
      }
      const input = b as unknown as MessageInput;
      const previous = list.find(
        (m) =>
          m.senderId === user.id && m.clientMessageId === input.clientMessageId,
      );
      if (previous) {
        if (
          previous.text !== input.text ||
          previous.kind !== input.kind ||
          previous.assetCode !== input.assetCode
        )
          fail("MESSAGE_KEY_CONFLICT");
        return clone(previous);
      }
      if (terminal(o)) fail("MESSAGE_READ_ONLY");
      if (
        !input.clientMessageId ||
        !["TEXT", "IMAGE"].includes(input.kind) ||
        (input.kind === "TEXT" &&
          (!input.text?.trim() || input.text.length > 1000)) ||
        (input.kind === "IMAGE" && input.assetCode !== "MEAL_SAMPLE")
      )
        fail("INVALID_MESSAGE");
      const message: Message = {
        ...input,
        id: String(++this.state.seq),
        senderId: user.id,
        senderName: user.displayName,
        createdAt: this.date(),
      };
      list.push(message);
      return clone(message);
    }
    if (action === "driver-review") {
      this.role(user, "CUSTOMER");
      const previous = this.state.reviews[id];
      if (method === "GET")
        return previous ? clone(previous) : fail("NOT_FOUND");
      const input = b as unknown as ReviewInput;
      if (o.status !== "DELIVERED") fail("ORDER_NOT_DELIVERED");
      if (
        !Number.isInteger(input.stars) ||
        input.stars < 1 ||
        input.stars > 5 ||
        input.note.length > 300 ||
        input.tags.some((t) => !["SERVICE", "FRIENDLY", "DELIVERY"].includes(t))
      )
        fail("INVALID_REVIEW");
      if (previous) {
        if (
          JSON.stringify({
            stars: previous.stars,
            tags: previous.tags,
            note: previous.note,
          }) !== JSON.stringify(input)
        )
          fail("REVIEW_ALREADY_EXISTS");
        return clone(previous);
      }
      const review = {
        ...input,
        id: this.id("review"),
        orderId: id,
        createdAt: this.date(),
      };
      this.state.reviews[id] = review;
      return clone(review);
    }
    return fail("NOT_FOUND");
  }
}
