import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeWholeNumber } from '../../shared/components/campaigns/wholeNumber.ts';

// Step 20 (V3-348): the customers-so-far answer is a whole number or not
// answered; nothing unreadable is ever sent as zero.

test('every answer form maps to a whole number or to not answered', () => {
  const forms: Array<[unknown, number | null]> = [
    [0, 0],
    [4, 4],
    ['0', 0],
    ['12', 12],
    [' 7 ', 7],
    ['1,200', 1200],
    [-1, null],
    [2.5, null],
    ['2.5', null],
    ['3-5', null],
    ['about 10', null],
    ['none', null],
    ['', null],
    [null, null],
    [undefined, null],
    [Number.NaN, null],
  ];
  for (const [given, expected] of forms) {
    assert.deepEqual({ given, read: normalizeWholeNumber(given) }, { given, read: expected });
  }
});

test('property: digits read back as themselves; digits with words are not answered', () => {
  for (let n = 0; n < 2000; n += 1) {
    assert.equal(normalizeWholeNumber(String(n * 13)), n * 13);
    assert.equal(normalizeWholeNumber(`${n} customers`), null);
  }
});
