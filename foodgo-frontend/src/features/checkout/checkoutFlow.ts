import type { Attempt, Cart, Offer, PaymentMethod, Quote, QuoteInput } from '../../shared/types/domain.ts';

export function canQuoteCart(cart: Pick<Cart, 'items'> | null | undefined) {
  return !!cart?.items.length && cart.items.every(item => item.available !== false);
}
/** Reading an expired/deleted route never resolves or creates a payment. */
export async function readAttempt(api: { attempt: (id: string) => Promise<Attempt>; current: () => Promise<Attempt | null> }, id: string) {
  try { return await api.attempt(id); }
  catch (error) {
    if ((error as { status?: number }).status !== 404 && checkoutCode(error) !== 'NOT_FOUND') throw error;
    const current = await api.current();
    if (current) return current;
    throw error;
  }
}

export const quoteIdentity = (i: QuoteInput) => JSON.stringify([i.addressId, i.offerId || '', i.paymentMethod, i.expectedCartVersion]);
export type QuoteState = { status: 'idle' | 'loading' | 'ready' | 'error'; quote: Quote | null; error: unknown; identity: string };
type Clock = { now: () => number; setTimer: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>; clearTimer: (id: ReturnType<typeof setTimeout>) => void };
const clock: Clock = { now: () => Date.now(), setTimer: (fn,delay) => setTimeout(fn,delay), clearTimer: id => clearTimeout(id) };
/** Every edit invalidates immediately, including A → B → A before React commits. */
export class QuoteCoordinator {
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private state: QuoteState = { status: 'idle', quote: null, error: null, identity: '' };
  private load: (i: QuoteInput) => Promise<Quote>;
  private publish: (s: QuoteState) => void;
  private clock: Clock;
  constructor(load: (i: QuoteInput) => Promise<Quote>, publish: (s: QuoteState) => void, time: Clock = clock) { this.load = load; this.publish = publish; this.clock = time; }
  private emit(state: QuoteState) { this.state = state; this.publish(state); }
  invalidate() {
    this.generation++;
    if (this.timer !== undefined) this.clock.clearTimer(this.timer);
    this.emit({ status: 'idle', quote: null, error: null, identity: '' });
  }
  dispose() { this.generation++; if (this.timer !== undefined) this.clock.clearTimer(this.timer); }
  select(input: QuoteInput | null) {
    this.invalidate();
    if (!input) return;
    const generation = this.generation, identity = quoteIdentity(input);
    this.emit({ status: 'loading', quote: null, error: null, identity });
    this.timer = this.clock.setTimer(() => {
      void this.load(input).then(quote => {
        if (generation !== this.generation) return;
        const ttl = Date.parse(quote.expiresAt) - this.clock.now() - 500;
        if (quoteIdentity(quote) !== identity || !Number.isFinite(ttl) || ttl <= 0) throw new Error('QUOTE_CHANGED');
        this.emit({ status: 'ready', quote, error: null, identity });
        this.timer = this.clock.setTimer(() => this.select(input), ttl);
      }).catch(error => {
        if (generation === this.generation) this.emit({ status: 'error', quote: null, error, identity });
      });
    }, 180);
  }
  currentQuote(input: QuoteInput) {
    return this.state.status === 'ready' && this.state.identity === quoteIdentity(input) && this.state.quote && Date.parse(this.state.quote.expiresAt) > this.clock.now() + 500 ? this.state.quote : null;
  }
}
export function offerProblem(offer: Offer, subtotal: number, method: PaymentMethod, restaurantId: string): string | null {
  if (offer.restaurantId && offer.restaurantId !== restaurantId) return 'Ưu đãi dành cho nhà hàng khác.';
  if (subtotal < offer.minSubtotal) return `Cần tiền món từ ${offer.minSubtotal.toLocaleString('vi-VN')} đ.`;
  if (offer.requiredMethod && offer.requiredMethod !== method) return offer.requiredMethod === 'MOCK_WALLET' ? 'Ưu đãi chỉ áp dụng khi chọn ví thử nghiệm.' : 'Ưu đãi chỉ áp dụng khi thanh toán tiền mặt.';
  return null;
}
export const checkoutCode = (error: unknown): string => typeof error === 'string' ? error : String((error as { code?: string; message?: string })?.code ?? (error as { message?: string })?.message ?? '');
export function checkoutMessage(error: unknown) {
  const messages: Record<string, string> = {
    QUOTE_EXPIRED: 'Giá vừa hết hạn. Vui lòng thử cập nhật lại.',
    QUOTE_CHANGED: 'Món hoặc giá đã thay đổi. Vui lòng cập nhật lại trước khi đặt.',
    CART_VERSION_CONFLICT: 'Giỏ hàng đã thay đổi. Kéo xuống để tải lại giỏ.',
    EMPTY_CART: 'Giỏ hàng đang trống. Hãy chọn món trước khi đặt.',
    INVALID_OFFER: 'Ưu đãi này chưa đủ điều kiện. Hãy bỏ mã hoặc chọn ưu đãi khác.',
    INVALID_ADDRESS: 'Địa chỉ này không còn dùng được. Hãy chọn địa chỉ khác.',
    ITEM_UNAVAILABLE: 'Có món hoặc lựa chọn đã ngừng bán. Hãy kiểm tra lại giỏ hàng.',
    INVALID_OPTIONS: 'Lựa chọn của món đã thay đổi. Hãy sửa lại món trong giỏ hàng.',
    INVALID_QUANTITY: 'Số lượng món chưa phù hợp. Hãy sửa lại giỏ hàng.',
    INVALID_PAYMENT: 'Phương thức thanh toán chưa phù hợp. Hãy chọn lại.',
    CHECKOUT_PENDING: 'Bạn có một thanh toán đang chờ. Hãy kiểm tra kết quả để tiếp tục.',
    CHECKOUT_IN_PROGRESS: 'Bạn có một thanh toán đang chờ. Hãy kiểm tra kết quả để tiếp tục.',
    PAYMENT_DECLINED: 'Ví thử nghiệm chưa thanh toán thành công. Giỏ hàng vẫn được giữ.',
    PAYMENT_FAILED: 'Ví thử nghiệm chưa thanh toán thành công. Giỏ hàng vẫn được giữ.',
    WALLET_FAILED: 'Ví thử nghiệm chưa thanh toán thành công. Giỏ hàng vẫn được giữ.',
    WALLET_CANCELLED: 'Thanh toán thử nghiệm đã được hủy. Giỏ hàng vẫn được giữ.',
    USER_CANCELLED: 'Bạn đã hủy thanh toán. Giỏ hàng vẫn được giữ.',
    ATTEMPT_STATE_CONFLICT: 'Thanh toán đã có kết quả. Hãy tải lại để xem thông tin mới nhất.',
    PAYMENT_CANCELLED: 'Bạn đã hủy thanh toán. Giỏ hàng vẫn được giữ.',
    QUOTE_EXPIRED_AFTER_PAYMENT: 'Giá đã thay đổi trong khi thanh toán. Khoản thanh toán thử nghiệm đã được hoàn.',
    NETWORK_ERROR: 'Chưa kết nối được. Hãy thử lại để kiểm tra kết quả.',
    NOT_FOUND: 'Không tìm thấy lần thanh toán này. Hãy quay lại kiểm tra đơn.',
    AUTH_REQUIRED: 'Bạn cần đăng nhập lại để tiếp tục.',
    FORBIDDEN: 'Tài khoản không thể thực hiện thao tác này.',
  };
  return messages[checkoutCode(error)] ?? 'Chưa thể hoàn tất. Hãy thử lại hoặc kiểm tra danh sách đơn của bạn.';
}
export type CheckoutReference = { key: string; quoteId: string; expectedCartVersion: number };
export function attemptReference(attempt: Attempt): CheckoutReference {
  // Older/demo attempts still replace the key. An absent snapshot can be looked up,
  // but must never be replayed with another attempt's payload.
  return { key: attempt.requestKey, quoteId: attempt.quoteId ?? '', expectedCartVersion: attempt.cartVersion ?? -1 };
}
type RecoveryApi = { current: () => Promise<Attempt | null>; byKey: (key: string) => Promise<Attempt>; place: (q: string, v: number, key: string) => Promise<Attempt> };
export async function recoverCheckout(api: RecoveryApi, saved: CheckoutReference | null): Promise<Attempt | null> {
  const current = await api.current();
  if (current) return current;
  if (!saved) return null;
  try { return await api.byKey(saved.key); }
  catch (error) {
    if ((error as { status?: number }).status !== 404 && checkoutCode(error) !== 'NOT_FOUND') throw error;
    if (!saved.quoteId || saved.expectedCartVersion < 0) throw new Error('NOT_FOUND');
    try { return await api.place(saved.quoteId, saved.expectedCartVersion, saved.key); }
    catch (error) {
      if (!['CHECKOUT_PENDING', 'CHECKOUT_IN_PROGRESS'].includes(checkoutCode(error))) throw error;
      const pending = await api.current();
      if (pending) return pending;
      throw error;
    }
  }
}
