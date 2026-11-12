import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DemoEngine } from '../src/shared/api/demo.ts';
import { demoInvalidatesResources } from '../src/providers/demoInvalidation.ts';

test('demo quote survives persistence without causing a cart reload and repricing loop', () => {
  const engine = new DemoEngine();
  const cart = engine.request('customer-1', '/cart');
  const addresses = engine.request('customer-1', '/addresses');
  const quote = engine.request('customer-1', '/checkout/quotes', 'POST', {
    addressId: addresses[0].id, paymentMethod: 'COD', expectedCartVersion: cart.version,
  });
  const restored = new DemoEngine(engine.snapshot());
  assert.deepEqual(restored.request('customer-1', '/cart'), cart);
  assert.equal(demoInvalidatesResources('/checkout/quotes', 'POST'), false);
  const attempt = restored.request('customer-1', '/checkout/attempts', 'POST', {
    quoteId: quote.id, expectedCartVersion: cart.version,
  }, 'pricing-regression');
  assert.equal(attempt.result, 'SUCCEEDED');
  assert.equal(demoInvalidatesResources('/checkout/attempts', 'POST'), true);
  assert.equal(demoInvalidatesResources('/cart/items/x', 'DELETE'), true);
});
