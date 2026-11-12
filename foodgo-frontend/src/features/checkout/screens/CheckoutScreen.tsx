import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../../providers/AppProvider';
import { Banner, Button, Card, Chip, Empty, Heading, Label, LoadState, MealItems, MoneyRows, RequireRole, Screen, styles } from '../../../shared/components/ui';
import { AnimatedChange } from '../../../shared/components/Motion';
import { useResource } from '../../../shared/hooks/useResource';
import { newRequestKey } from '../../../shared/utils/id';
import { money } from '../../../shared/theme/theme';
import { readStore, removeStore, writeStore } from '../../../shared/storage/store';
import { shouldKeepCheckoutReference } from '../../../shared/api/adapters';
import { checkoutService } from '../services/checkoutService';
import { attemptReference, canQuoteCart, checkoutCode, checkoutMessage, offerProblem, QuoteCoordinator, quoteIdentity, recoverCheckout } from '../checkoutFlow';
import type { CheckoutReference, QuoteState } from '../checkoutFlow';
import type { Attempt, PaymentMethod } from '../../../shared/types/domain';

export default function CheckoutScreen() {
  return <RequireRole roles={['CUSTOMER']}><Checkout /></RequireRole>;
}
function Checkout() {
  const { request, session, mode } = useApp();
  const service = useMemo(() => checkoutService(request), [request]);
  const context = useResource(() => service.context());
  const reloadContext = context.reload;
  const [addressId, setAddress] = useState(''), [offerId, setOffer] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('COD');
  const [pricing, setPricing] = useState<QuoteState>({ status: 'idle', quote: null, error: null, identity: '' });
  const coordinator = useMemo(() => new QuoteCoordinator(service.quote, setPricing), [service]);
  const [busy, setBusy] = useState(false), [checkedAccount, setCheckedAccount] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<CheckoutReference | null>(null);
  const [offersOpen, setOffersOpen] = useState(false), [retry, setRetry] = useState(0), [initRetry, setInitRetry] = useState(0);
  const lock = useRef(false), storeKey = `checkout:${session!.user.id}`;
  const alive = useRef(true);
  const ready = checkedAccount === storeKey;
  const data = context.data;
  const cartValid = canQuoteCart(data?.cart);
  const invalidItems = data?.cart.items.filter(item => item.available === false) ?? [];
  const selectedAddress = data?.addresses.some(a => a.id === addressId) ? addressId : data?.addresses[0]?.id || '';
  const subtotal = data?.cart.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ?? 0;
  const selectedOffer = data?.offers.find(o => o.id === offerId);
  const invalidOffer = selectedOffer ? offerProblem(selectedOffer, subtotal, method, data!.cart.restaurantId) : offerId ? 'Ưu đãi không còn khả dụng.' : null;
  const effectiveOfferId = invalidOffer ? '' : offerId;
  const input = { addressId: selectedAddress, offerId: effectiveOfferId || undefined, paymentMethod: method, expectedCartVersion: data?.cart.version ?? 0 };
  const identity = quoteIdentity(input);
  const quote = cartValid && pricing.identity === identity ? coordinator.currentQuote(input) : null;
  const editable = ready && !pending && !busy;

  useEffect(() => { alive.current = true; return () => { alive.current = false; coordinator.dispose(); }; }, [coordinator]);
  // Adjust the stored selection as soon as refreshed cart/catalog data invalidates it.
  // The effective selection above already excludes it in this render.
  if (invalidOffer && offerId) {
    setOffer('');
    setNotice(`Đã bỏ mã ưu đãi. ${invalidOffer}`);
  }
  useEffect(() => {
    coordinator.select(ready && !pending && !busy && !context.error && cartValid && data && selectedAddress ? { addressId: selectedAddress, offerId: effectiveOfferId || undefined, paymentMethod: method, expectedCartVersion: data.cart.version } : null);
    return () => coordinator.dispose();
  }, [coordinator, identity, ready, pending, busy, retry, data, context.error, selectedAddress, effectiveOfferId, method, cartValid]);

  const handleAttempt = useCallback(async (attempt: Attempt) => {
    if (!alive.current) return;
    if (attempt.result === 'PENDING') {
      const reference = attemptReference(attempt);
      await writeStore(storeKey, reference);
      if (!alive.current) return;
      setPending(reference);
      router.replace({ pathname: '/checkout/pending', params: { id: attempt.id } });
      return;
    }
    await removeStore(storeKey); if (!alive.current) return; setPending(null); coordinator.invalidate();
    if (attempt.orderId) router.replace({ pathname: '/orders/[id]', params: { id: attempt.orderId, ...(attempt.result === 'SUCCEEDED' ? { success: '1' } : {}) } });
    else {
      setError(attempt.result === 'REFUNDED' ? 'Khoản thanh toán thử nghiệm đã được hoàn. Bạn có thể kiểm tra và đặt lại.' : checkoutMessage(attempt.reasonCode || (attempt.result === 'CANCELLED' ? 'PAYMENT_CANCELLED' : 'PAYMENT_FAILED')));
      void reloadContext();
    }
  }, [storeKey, coordinator, reloadContext]);
  useEffect(() => {
    let active = true;


    void (async () => {
      try {
        const saved = await readStore<CheckoutReference>(storeKey);
        if (!active) return;
        setPending(saved);
        const current = await service.current();
        if (!active) return;
        if (current) await handleAttempt(current);
        setCheckedAccount(storeKey);
      } catch (e) { if (active) setError(checkoutMessage(e)); }
      finally { if (active) setInitializing(false); }
    })();
    return () => { active = false; };
  }, [storeKey, initRetry, service, handleAttempt]);

  const run = async (task: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); coordinator.invalidate();
    try { await task(); }
    catch (e) {
      if (['CHECKOUT_PENDING', 'CHECKOUT_IN_PROGRESS'].includes(checkoutCode(e))) {
        try {
          const current = await service.current();
          if (current) { await handleAttempt(current); return; }
        } catch (lookupError) { setError(checkoutMessage(lookupError)); return; }
      }
      if (!shouldKeepCheckoutReference(e)) {
        await removeStore(storeKey); setPending(null); void context.reload();
      }
      if (alive.current) setError(checkoutMessage(e));
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const changed = () => { coordinator.invalidate(); setError(null); setNotice(null); setRetry(n => n + 1); };
  const recover = () => void run(async () => {
    const attempt = await recoverCheckout(service, pending);
    if (attempt) await handleAttempt(attempt);
    else { await removeStore(storeKey); setPending(null); }
  });
  const place = () => {
    // Check the snapshot synchronously: expiry and rapid edits cannot pass this gate.
    const fresh = coordinator.currentQuote(input);
    if (!fresh || !editable || context.error || !cartValid) return;
    void run(async () => {
      const reference = { key: newRequestKey(), quoteId: fresh.id, expectedCartVersion: fresh.expectedCartVersion };
      await writeStore(storeKey, reference); setPending(reference);
      await handleAttempt(await service.place(reference.quoteId, reference.expectedCartVersion, reference.key));
    });
  };
  const updating = editable && !context.error && cartValid && !!selectedAddress && (pricing.status === 'loading' || pricing.identity !== identity);
  const availableOffers = data?.offers.filter(o => !offerProblem(o, subtotal, method, data.cart.restaurantId)) ?? [];
  const sortedOffers = [...(data?.offers ?? [])].sort((a, b) => Number(!!offerProblem(a, subtotal, method, data!.cart.restaurantId)) - Number(!!offerProblem(b, subtotal, method, data!.cart.restaurantId)));
  return <Screen title="Kiểm tra đơn" subtitle="Một bữa ngon, giao đến đúng nơi." back onRefresh={() => { changed(); void context.reload(); }} footer={
    !ready ? <Button title={initializing ? 'Đang kiểm tra thanh toán…' : 'Kiểm tra lại thanh toán'} busy={initializing} onPress={() => { setError(null); setCheckedAccount(null); setInitializing(true); setInitRetry(n => n + 1); }} /> : pending ? <Button title="Kiểm tra kết quả đặt món" busy={busy} onPress={recover} /> : <>
      <View style={styles.between}><Label muted>Tổng thanh toán</Label><Text accessibilityLiveRegion="polite" style={styles.bigPrice}>{quote ? money(quote.total) : updating && data?.cart.items.length && selectedAddress ? 'Đang tính…' : 'Chưa có giá'}</Text></View>
      <Button title={invalidItems.length ? 'Bỏ món chưa hợp lệ để tiếp tục' : quote ? 'Đặt món' : updating ? 'Đang cập nhật giá…' : 'Chờ giá mới'} disabled={!quote || !editable || !!context.error || !cartValid} busy={busy} onPress={place} />
      {pricing.status === 'error' && <Button title="Thử cập nhật giá lại" variant="secondary" onPress={() => setRetry(n => n + 1)} />}
    </>
  }>
    <LoadState loading={context.loading} error={context.error ? 'Chưa tải được thông tin đơn. Vui lòng thử lại.' : null} retry={() => { void context.reload(); }} />
    {error && <Banner error>{error}</Banner>}
    {notice && <Banner>{notice}</Banner>}
    {pending && <Banner>Yêu cầu đặt món đang được kiểm tra. Hãy xem kết quả trước khi đặt tiếp.</Banner>}
    {data && !data.cart.items.length && !pending ? <Empty title="Giỏ hàng đang trống" detail="Chọn món yêu thích rồi quay lại kiểm tra đơn." action={{ title: 'Về trang chủ', onPress: () => router.replace('/') }} /> : data && <>
      <Heading>Giao đến</Heading>
      {data.addresses.length ? data.addresses.map(a => <Card key={a.id}>
        <View style={styles.between}><Heading>{a.label} · {a.recipientName}</Heading><Chip title={selectedAddress === a.id ? 'Đã chọn' : 'Chọn'} selected={selectedAddress === a.id} disabled={!editable} onPress={() => { changed(); setAddress(a.id); }} /></View>
        <Label muted>{a.addressText}</Label><Label muted>{a.recipientPhone}</Label>
      </Card>) : <Banner error>Thêm địa chỉ nhận món để tiếp tục nhé.</Banner>}
      {mode === 'api' && <Button title={data.addresses.length ? 'Thêm hoặc sửa địa chỉ' : 'Thêm địa chỉ nhận món'} variant="secondary" disabled={!editable} onPress={() => { changed(); router.push('/addresses'); }} />}
      <Card><Heading>{data.cart.restaurantName}</Heading><MealItems items={data.cart.items} />
        {!!invalidItems.length && <Banner error>Có món chưa thể đặt. Bỏ các món dưới đây để tiếp tục; những món khác vẫn được giữ.</Banner>}
        {invalidItems.map(item => <View key={item.id} style={{ gap: 8 }}><Heading>{item.foodName}</Heading><Label muted>{item.validationMessage || 'Món hoặc lựa chọn hiện không còn phục vụ.'}</Label><Button title={`Bỏ ${item.foodName} khỏi giỏ`} variant="secondary" disabled={!editable} busy={busy} onPress={() => void run(async () => { await service.removeItem(item.id, data.cart.version); await context.reload(); setNotice('Đã bỏ món khỏi giỏ. Giá sẽ tự cập nhật cho các món còn lại.'); })} /></View>)}
      </Card>
      <Heading>Thanh toán</Heading>
      <View style={{ gap: 10 }}>{(['COD', 'MOCK_WALLET'] as const).map(m => <Chip key={m} title={m === 'COD' ? 'Tiền mặt khi nhận món' : 'Ví thử nghiệm · Không chuyển tiền thật'} selected={method === m} disabled={!editable} onPress={() => { changed(); setMethod(m); }} />)}</View>
      <Card>
        <View style={styles.between}><Heading>Ưu đãi của bạn</Heading><Chip title={offersOpen ? 'Thu gọn' : `Chọn mã (${availableOffers.length})`} selected={offersOpen} disabled={!editable} onPress={() => setOffersOpen(v => !v)} /></View>
        <Label muted>{selectedOffer && !invalidOffer ? `${selectedOffer.code} · ${selectedOffer.name}` : 'Chưa dùng ưu đãi'}</Label>
        {!!effectiveOfferId && <Button title="Bỏ mã ưu đãi" variant="ghost" disabled={!editable} onPress={() => { changed(); setOffer(''); }} />}
        {offersOpen && <ScrollView nestedScrollEnabled style={{ maxHeight: 270 }} contentContainerStyle={{ gap: 12, paddingVertical: 6 }}>
          {sortedOffers.length ? sortedOffers.map(offer => { const problem = offerProblem(offer, subtotal, method, data.cart.restaurantId); return <View key={offer.id} style={{ gap: 4, paddingVertical: 6 }}>
            <Chip title={`${offer.code} · ${offer.name}`} selected={offerId === offer.id && !problem} disabled={!editable || !!problem} onPress={() => { changed(); setOffer(offer.id); setOffersOpen(false); }} />
            <Label muted>{problem || `Áp dụng từ ${money(offer.minSubtotal)} tiền món`}</Label>
          </View>; }) : <Label muted>Hiện chưa có ưu đãi.</Label>}
        </ScrollView>}
      </Card>
      <AnimatedChange changeKey={quote?.id ?? pricing.status}><Card>
        <Heading>Chi tiết thanh toán</Heading>
        {quote ? <><MoneyRows data={quote} /><Label muted>Giao đến {quote.address?.addressText || data.addresses.find(a => a.id === selectedAddress)?.addressText} · {quote.paymentMethod === 'COD' ? 'Tiền mặt' : 'Ví thử nghiệm'}</Label></> : <View style={{ gap: 12 }}>
          {['Tiền món', 'Phí giao hàng', 'Ưu đãi', 'Tổng thanh toán'].map(label => <View key={label} style={styles.between}><Label muted>{label}</Label><Label>{updating ? 'Đang cập nhật…' : '—'}</Label></View>)}
          {pricing.status === 'error' && <Banner error>{checkoutMessage(pricing.error)}</Banner>}
          {!!invalidItems.length && <Label muted>Vui lòng bỏ món chưa hợp lệ để xem giá và đặt món.</Label>}
          {!pending && <Label muted>Giá tự cập nhật khi bạn đổi địa chỉ, ưu đãi hoặc cách thanh toán.</Label>}
        </View>}
      </Card></AnimatedChange>
      <Label muted>Chỉ hủy trong lúc chờ nhà hàng xác nhận. Không có phí ngoài tổng thanh toán.</Label>
    </>}
  </Screen>;
}
