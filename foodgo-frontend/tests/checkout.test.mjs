import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QuoteCoordinator, offerProblem, recoverCheckout, checkoutMessage, attemptReference, canQuoteCart, readAttempt } from '../src/features/checkout/checkoutFlow.ts';
import { normalizeCart } from '../src/shared/api/adapters.ts';

const input = (addressId = 'a') => ({ addressId, paymentMethod: 'COD', expectedCartVersion: 1 });
const quote = (i, id = 'q', expiresAt = 5000) => ({ ...i, id, expiresAt: new Date(expiresAt).toISOString(), total: 100 });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function clock() { let now = 0, id = 0; const timers = new Map(); return { now: () => now, setTimer(fn, delay) { timers.set(++id, { at: now + delay, fn }); return id; }, clearTimer(id) { timers.delete(id); }, advance(ms) { now += ms; for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.fn(); } } }; }
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
test('debounces edits, ignores late ABA results, only permits current fresh snapshot', async () => {
  const c = clock(), requests = [], states = [];
  const flow = new QuoteCoordinator((i) => { const d = deferred(); requests.push({ i, ...d }); return d.promise; }, s => states.push(s), c);
  flow.select(input()); c.advance(180);
  flow.invalidate(); flow.select(input('b')); c.advance(180);
  flow.invalidate(); flow.select(input()); c.advance(180);
  requests[0].resolve(quote(input(), 'old-a')); requests[1].resolve(quote(input('b'), 'b')); await flush();
  assert.equal(flow.currentQuote(input()), null);
  requests[2].resolve(quote(input(), 'new-a')); await flush();
  assert.equal(flow.currentQuote(input()).id, 'new-a');
  assert.equal(flow.currentQuote(input('b')), null);
  c.advance(5000); assert.equal(flow.currentQuote(input()), null);
  assert.equal(states.at(-1).status, 'loading');
  flow.dispose();
});
test('expiry refreshes automatically, failed quote hides old price, retry succeeds, unmount rejects late response', async () => {
  const c = clock(), requests = [], states = [];
  const flow = new QuoteCoordinator((i) => { const d = deferred(); requests.push({ i, ...d }); return d.promise; }, s => states.push(s), c);
  flow.select(input()); c.advance(180); requests[0].resolve(quote(input())); await flush();
  c.advance(4500); c.advance(180); requests[1].reject(new Error('NETWORK_ERROR')); await flush();
  assert.equal(states.at(-1).status, 'error'); assert.equal(states.at(-1).quote, null);
  flow.select(input()); c.advance(180); requests[2].resolve(quote(input(), 'retry', 15000)); await flush();
  assert.equal(flow.currentQuote(input()).id, 'retry');
  flow.select(input('b')); c.advance(180); flow.dispose(); const count = states.length;
  requests[3].resolve(quote(input('b'), 'late', 15000)); await flush(); assert.equal(states.length, count);
});
test('eligibility accounts for subtotal, payment and restaurant scope', () => {
  const o = { minSubtotal: 100, requiredMethod: 'MOCK_WALLET', restaurantId: 'r' };
  assert.match(offerProblem(o, 99, 'COD', 'r'), /100/);
  assert.match(offerProblem(o, 100, 'COD', 'r'), /ví/);
  assert.match(offerProblem(o, 100, 'MOCK_WALLET', 'other'), /nhà hàng/);
  assert.equal(offerProblem(o, 100, 'MOCK_WALLET', 'r'), null);
});
test('cross-device pending replaces uncreated local reference without POST loop', async () => {
  let posts = 0;
  const remote = { id: 'remote', requestKey: 'remote-key', result: 'PENDING', quoteId: 'q', cartVersion: 2 };
  const api = { current: async () => null, byKey: async () => { throw { status: 404 }; }, place: async () => { posts++; throw { code: 'CHECKOUT_PENDING' }; } };
  let checks = 0; api.current = async () => ++checks === 1 ? null : remote;
  assert.equal(await recoverCheckout(api, { key: 'local', quoteId: 'q0', expectedCartVersion: 1 }), remote);
  assert.equal(posts, 1);
});
test('REFUNDED lookup is terminal and unknown reason codes never appear in copy', async () => {
  const refunded = { result: 'REFUNDED', orderId: 'order' };
  assert.equal(await recoverCheckout({ current: async () => null, byKey: async () => refunded }, { key: 'k' }), refunded);
  assert.doesNotMatch(checkoutMessage('INTERNAL_UUID_ERROR'), /INTERNAL|UUID/);
});
test('unknown lookup outcome never posts another request; authoritative refusal escapes retry', async () => {
  let posts = 0;
  const saved = { key: 'same', quoteId: 'q', expectedCartVersion: 3 };
  const api = { current: async () => null, byKey: async () => { throw { code: 'NETWORK_ERROR' }; }, place: async () => { posts++; throw { code: 'QUOTE_EXPIRED' }; } };
  await assert.rejects(recoverCheckout(api, saved), e => e.code === 'NETWORK_ERROR');
  assert.equal(posts, 0);
  api.byKey = async () => { throw { status: 404 }; };
  await assert.rejects(recoverCheckout(api, saved), e => e.code === 'QUOTE_EXPIRED');
  assert.equal(posts, 1);
});
test('a server snapshot that disagrees with selection or is already expired cannot be placed', async () => {
  for (const bad of [quote(input('other')), quote(input(), 'expired', 100)]) {
    const c = clock(), states = [];
    const flow = new QuoteCoordinator(async () => bad, s => states.push(s), c);
    flow.select(input()); c.advance(180); await flush();
    assert.equal(flow.currentQuote(input()), null);
    assert.equal(states.at(-1).status, 'error'); flow.dispose();
  }
});
test('legacy pending replaces the key and cannot replay an absent snapshot on lookup404', async () => {
  const ref = attemptReference({ requestKey: 'authoritative', id: 'a', result: 'PENDING' });
  assert.equal(ref.key, 'authoritative');
  let posts = 0;
  await assert.rejects(recoverCheckout({ current: async () => null, byKey: async () => { throw { status: 404 }; }, place: async () => { posts++; } }, ref), /NOT_FOUND/);
  assert.equal(posts, 0);
});
test('invalid cart remains readable and stops pricing until only the invalid line is removed', () => {
  const cart = normalizeCart({ items: [{ id: 'good', available: true }, { id: 'bad', available: false, validationMessage: 'Món hiện ngừng phục vụ.' }] });
  assert.equal(cart.items[1].available, false);
  assert.equal(cart.items[1].validationMessage, 'Món hiện ngừng phục vụ.');
  assert.equal(canQuoteCart(cart), false);
  assert.equal(canQuoteCart({ ...cart, items: cart.items.filter(i => i.id !== 'bad') }), true);
  assert.equal(canQuoteCart({ items: [] }), false);
  assert.equal(canQuoteCart({ items: [{ id: 'legacy' }] }), true);
});
test('pending404 fallback is read-only and resolves the current authoritative attempt', async () => {
  let lookups = 0;
  const pending = { id: 'new', result: 'PENDING', requestKey: 'remote' };
  assert.equal(await readAttempt({ attempt: async () => { throw { status: 404 }; }, current: async () => { lookups++; return pending; } }, 'old'), pending);
  assert.equal(lookups, 1);
  await assert.rejects(readAttempt({ attempt: async () => { throw { code: 'NETWORK_ERROR' }; }, current: async () => { throw new Error('must not run'); } }, 'old'), e => e.code === 'NETWORK_ERROR');
});
