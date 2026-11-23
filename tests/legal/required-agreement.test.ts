import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { separatorsForList } from '../../shared/legal/legal-flow-utils.ts';

// Every required document and consent of a flow is agreed to with one tick;
// each stays linked so it can be read on its own.

test('property: a list of any length reads as "A, B and C", every item once and in order', () => {
  for (let count = 0; count <= 8; count++) {
    const names = Array.from({ length: count }, (_, index) => `N${index}`);
    const separators = separatorsForList(count);
    const sentence = names.map((name, index) => separators[index] + name).join('');
    assert.equal(separators.length, count);
    const expected =
      count <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[count - 1]}`;
    assert.equal(sentence, expected);
  }
});

test('sign-up, checkout and the payment link each ask for everything required in one box', () => {
  for (const page of [
    'app/(public)/auth/signup/page.tsx',
    'app/(app)/app/checkout/page.tsx',
    'app/(public)/pay/[key]/PaymentLinkView.tsx',
  ]) {
    const source = readFileSync(page, 'utf8');
    assert.equal((source.match(/<RequiredAgreement\b/g) ?? []).length, 1, page);
    assert.doesNotMatch(source, /I accept the|I agree to the|I consent to/, page);
  }
});
