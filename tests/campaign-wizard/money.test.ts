import assert from 'node:assert/strict';
import test from 'node:test';
import {
  amountTextFromSaved,
  currencySymbol,
  formatAmountText,
  formatMoney,
  parseAmountText,
  toMoneyAnswer,
} from '../../shared/types/money.ts';

test('reads the amount a client types, grouping and all', () => {
  assert.equal(parseAmountText('2,500'), 2500);
  assert.equal(parseAmountText(' 1,00,000 '), 100000);
  assert.equal(parseAmountText('2500.5'), 2500.5);
  assert.equal(parseAmountText('0'), 0);
});

test('an empty, negative or wordy entry is not an amount', () => {
  for (const text of ['', '   ', '-5', 'about 5k', '5k', '1.234', null, undefined]) {
    assert.equal(parseAmountText(text), null, String(text));
  }
});

test('groups digits the way the currency is written', () => {
  assert.equal(formatAmountText(1500000, 'INR'), '15,00,000');
  assert.equal(formatAmountText(1500000, 'GBP'), '1,500,000');
});

test('shows the currency symbol in front', () => {
  assert.equal(currencySymbol('GBP'), '£');
  assert.equal(currencySymbol('INR'), '₹');
  assert.equal(formatMoney({ amount: 2500, currency: 'GBP' }), '£2,500');
  assert.equal(formatMoney(null), null);
});

test('sends an amount in the campaign currency, or nothing', () => {
  assert.deepEqual(toMoneyAnswer('2,000', 'GBP'), { amount: 2000, currency: 'GBP' });
  assert.equal(toMoneyAnswer('', 'GBP'), undefined);
  assert.equal(toMoneyAnswer('2000', null), undefined);
});

test('reads a saved answer back into the field', () => {
  assert.equal(
    amountTextFromSaved({ amount: 2000, currency: 'GBP', amount_usd: 2500, fx_rate: 0.8 }),
    '2000',
  );
  assert.equal(amountTextFromSaved('5k_15k'), '');
  assert.equal(amountTextFromSaved(null), '');
});
