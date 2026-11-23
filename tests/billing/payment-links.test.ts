import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paymentLinksMockAdapter } from '../../shared/api/mock/paymentLinks.mock.ts';
import {
  PAYMENT_LINK_CLOSED_MESSAGES,
  normalizeAdminPaymentLinkPage,
  paymentLinkAmountRows,
  readPaymentLinkKey,
} from '../../shared/types/paymentLinks.ts';

// R-14b: an admin makes a payment link for a client; the client opens it with
// their email on any device and pays; the Backend holds every amount.

test('property: the rows under a link add up to its total, with and without a discount or tax', () => {
  for (const subtotalMinor of [100, 1_990_000, 5_970_000, 9_999_999]) {
    for (const discountMinor of [0, 1, Math.floor(subtotalMinor / 7)]) {
      for (const tax of [{ label: 'GST', rateBasisPoints: 1800 }, null]) {
        const taxableMinor = subtotalMinor - discountMinor;
        const taxMinor = tax ? Math.round((taxableMinor * tax.rateBasisPoints) / 10_000) : 0;
        const rows = paymentLinkAmountRows({
          subtotalMinor,
          discountMinor,
          taxMinor,
          totalMinor: taxableMinor + taxMinor,
          tax,
        });
        const total = rows.at(-1)!;
        assert.equal(total.label, 'Total');
        assert.equal(
          rows.slice(0, -1).reduce((sum, row) => sum + row.amountMinor, 0),
          total.amountMinor,
        );
        assert.equal(rows.some((row) => row.label === 'Discount'), discountMinor > 0);
        assert.equal(rows.some((row) => row.label === 'GST (18%)'), Boolean(tax));
      }
    }
  }
});

test('only a 43-character URL-safe key is read from the address', () => {
  const key = 'A'.repeat(21) + '-_' + 'z9'.repeat(10);
  assert.equal(readPaymentLinkKey(key), key);
  for (const value of ['', 'cmwt1ffs3001z01pcwn3j61gh', `${key}=`, key.slice(1), '../../etc', undefined, 42]) {
    assert.equal(readPaymentLinkKey(value), null);
  }
});

test('the admin list keeps only well-formed links and reads a lock', () => {
  const page = normalizeAdminPaymentLinkPage({
    items: [
      { id: 'l1', state: 'open', locked: true, client: { email: 'a@b.co' }, totalMinor: 6_454_600, lines: [{ sku: 'Launch', quantity: 3 }] },
      { state: 'open' },
      { id: 'l2', state: 'weird' },
    ],
    total: 3,
  });
  assert.deepEqual(page.items.map((item) => [item.id, item.state, item.locked]), [
    ['l1', 'open', true],
    ['l2', 'open', false],
  ]);
  assert.equal(page.items[0].lines[0].quantity, 3);
});

test('every closed state has a message for the payer', () => {
  for (const state of ['paid', 'cancelled', 'expired', 'locked'] as const) {
    assert.ok(PAYMENT_LINK_CLOSED_MESSAGES[state].length > 20);
  }
});

test('mock flow: a link is made, a wrong email is refused, paying marks it paid', async () => {
  const preview = await paymentLinksMockAdapter.preview({
    clientEmail: 'client@example.com',
    pricingCountryCode: 'IN',
    lines: [{ sku: 'Launch', quantity: 3 }],
    discountMinor: 500_000,
    billingDetails: { stateCode: '27', postalCode: '411001' },
  });
  assert.equal(preview.totalMinor, 6_454_600);
  assert.equal(preview.credits, 3);
  const issued = await paymentLinksMockAdapter.create({
    clientEmail: 'client@example.com',
    pricingCountryCode: 'IN',
    lines: [{ sku: 'Launch', quantity: 3 }],
    discountMinor: 500_000,
    billingDetails: { stateCode: '27', postalCode: '411001' },
  });
  const key = issued.url.split('/pay/')[1];
  assert.ok(readPaymentLinkKey(key));
  await assert.rejects(paymentLinksMockAdapter.open(key, 'someone@example.com'), /doesn't match/);
  const opened = await paymentLinksMockAdapter.open(key, ' CLIENT@example.com ');
  assert.equal(opened.totalMinor, 6_454_600);
  const payment = await paymentLinksMockAdapter.pay(key);
  assert.equal(payment.amountMinor, opened.totalMinor);
  assert.deepEqual(await paymentLinksMockAdapter.verify(key), { state: 'paid' });
  assert.deepEqual(await paymentLinksMockAdapter.publicState(key), { state: 'paid' });
});

test('the payment page is never indexed, never sends its address on, and asks for the email before showing anything', () => {
  const page = readFileSync('app/(public)/pay/[key]/page.tsx', 'utf8');
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /referrer: 'no-referrer'/);
  const view = readFileSync('app/(public)/pay/[key]/PaymentLinkView.tsx', 'utf8');
  // The summary renders only from what the email check returned.
  assert.ok(view.indexOf('if (!link)') < view.indexOf('payment-link-summary'));
  assert.match(view, /paymentLinksRepository\.pay\(key, \{\s*email/);
  assert.doesNotMatch(view, /amountMinor:\s*link\./);
  const robots = readFileSync('app/robots.ts', 'utf8');
  assert.match(robots, /'\/pay\/'/);
});

test('the admin orders screen carries the payment links panel, which shows a new link once to copy', () => {
  const orders = readFileSync('app/(app)/app/admin/orders/page.tsx', 'utf8');
  assert.match(orders, /<PaymentLinksPanel \/>/);
  const panel = readFileSync('shared/components/billing/PaymentLinksPanel.tsx', 'utf8');
  assert.match(panel, /navigator\.clipboard\.writeText\(issued\.url\)/);
  assert.match(panel, /paymentLinksRepository\.renew\(link\.id\)/);
  assert.match(panel, /paymentLinksRepository\.cancel\(link\.id\)/);
});
