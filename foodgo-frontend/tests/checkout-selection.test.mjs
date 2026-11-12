import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offerGroups } from '../src/features/checkout/offerSelection.ts';

test('offer search retains disabled reasons and reflects changed payment/cart eligibility', () => {
  const offers = [
    { id: 'food', code: 'TRUA10', name: 'Bữa trưa', minSubtotal: 100, kind: 'PERCENT' },
    { id: 'wallet', code: 'VI10', name: 'Bữa trưa với ví', minSubtotal: 0, requiredMethod: 'MOCK_WALLET', kind: 'PERCENT' },
    { id: 'other', code: 'SHIP', name: 'Giao hàng', minSubtotal: 0, restaurantId: 'other', kind: 'FREE_DELIVERY' },
  ];
  const initial = offerGroups(offers, '  BỮA TRƯA ', 99, 'COD', 'r');
  assert.deepEqual(initial.available, []);
  assert.deepEqual(initial.unavailable.map(o => o.id), ['food', 'wallet']);
  const changed = offerGroups(offers, '', 100, 'MOCK_WALLET', 'r');
  assert.deepEqual(changed.available.map(o => o.id), ['food', 'wallet']);
  assert.deepEqual(changed.unavailable.map(o => o.id), ['other']);
  assert.deepEqual(offers.map(o => o.id), ['food', 'wallet', 'other']);
});
