import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderValueHoldAnswer,
  isOrderValueHoldTask,
  readOrderValueHoldModel,
  readOrderValueRefusal,
} from '../../shared/components/ops/orderValueHold.ts';

// The order-value hold (backend V3-266): the task the backend raises at
// intake when the order value does not fit the price range or the currency.

const task = {
  failureMode: 'order_value_hold',
  questionPayload: {
    clientName: 'Huel',
    holdsSummary: 'The order value, 10000 GBP, is more than 3 times the highest price, 45 GBP.',
    questionContext: {
      holds: [
        {
          reason: 'above_price_multiple',
          diagnosis: 'The order value, 10000 GBP, is more than 3 times the highest price, 45 GBP.',
        },
      ],
      marketCurrency: 'GBP',
      averageOrderValue: '10000',
      priceRange: '35_45',
    },
  },
};

test('recognises the task in any casing', () => {
  assert.equal(isOrderValueHoldTask('order_value_hold'), true);
  assert.equal(isOrderValueHoldTask('Order-Value Hold'), true);
  assert.equal(isOrderValueHoldTask('unmatched_channel_hold'), false);
});

test('reads what was held, and nothing from a task with no hold', () => {
  assert.deepEqual(readOrderValueHoldModel(task), {
    clientName: 'Huel',
    diagnoses: ['The order value, 10000 GBP, is more than 3 times the highest price, 45 GBP.'],
    marketCurrency: 'GBP',
    orderValue: '10000',
    priceRange: '35_45',
  });
  assert.equal(readOrderValueHoldModel({ questionPayload: { clientName: 'Huel' } }), null);
});

test('builds a confirmation or a correction, each with its reason', () => {
  assert.deepEqual(buildOrderValueHoldAnswer({ decision: 'confirm', reason: 'Bundles of four.' }), {
    answer: { decision: 'confirm', reason: 'Bundles of four.' },
  });
  assert.deepEqual(buildOrderValueHoldAnswer({ decision: 'correct', amount: '1,055.50', reason: 'Client email.' }), {
    answer: { decision: 'correct', average_order_value: 1055.5, reason: 'Client email.' },
  });
});

test('refuses to send an answer missing its decision, reason or amount', () => {
  for (const input of [
    { decision: null, reason: 'Fine.' },
    { decision: 'confirm' as const, reason: '' },
    { decision: 'correct' as const, amount: '', reason: 'Client email.' },
    { decision: 'correct' as const, amount: '0', reason: 'Client email.' },
    { decision: 'correct' as const, amount: '£55', reason: 'Client email.' },
  ]) {
    assert.ok('error' in buildOrderValueHoldAnswer(input));
  }
});

test("reads the backend's refusal without its code", () => {
  assert.equal(
    readOrderValueRefusal('400 ORDER_VALUE_ANSWER_REJECTED_V2: a correction needs the order value'),
    'a correction needs the order value',
  );
  assert.equal(readOrderValueRefusal('Network error'), null);
});
