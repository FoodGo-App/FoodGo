import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conversationPeer, callDuration, ratingDescription } from '../src/features/communication/lib/presentation.ts';

test('peer identity is supplied by the current conversation for either role', () => {
  const participants = [{ id: 'c', displayName: 'Khách thật' }, { id: 'd', displayName: 'Tài xế thật', avatarUrl: 'https://example.test/driver.jpg' }];
  assert.equal(conversationPeer(participants, 'c').displayName, 'Tài xế thật');
  assert.equal(conversationPeer(participants, 'd').displayName, 'Khách thật');
  assert.equal(conversationPeer(participants, 'c').avatarUrl, 'https://example.test/driver.jpg');
  assert.equal(conversationPeer(participants, 'd').avatarUrl, undefined);
  assert.equal(conversationPeer([], 'c'), undefined);
  assert.equal(conversationPeer([participants[0]], 'c'), undefined);
});

test('call elapsed time handles minute transitions and remains cumulative after an hour', () => {
  assert.equal(callDuration(0), '00:00');
  assert.equal(callDuration(59), '00:59');
  assert.equal(callDuration(60), '01:00');
  assert.equal(callDuration(3601), '60:01');
});

test('rating caption follows the persisted score instead of always claiming satisfaction', () => {
  assert.equal(ratingDescription(1), 'Chưa hài lòng');
  assert.equal(ratingDescription(3), 'Bình thường');
  assert.equal(ratingDescription(5), 'Rất hài lòng');
});
