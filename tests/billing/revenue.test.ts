import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { billingReportsMockAdapter } from '../../shared/api/mock/billingReports.mock.ts';
import { currentIndiaMonth, keptPercent, previousMonth } from '../../shared/types/billingReports.ts';

// R-14c: the Revenue page shows what was charged, refunded and kept, never
// adding currencies, and downloads the month's GST register.

test('the month in India turns at 18:30 UTC, and the month before wraps the year', () => {
  assert.equal(currentIndiaMonth(new Date('2026-11-30T18:29:59Z')), '2026-11');
  assert.equal(currentIndiaMonth(new Date('2026-11-30T18:30:00Z')), '2026-12');
  assert.equal(previousMonth('2026-01'), '2025-12');
  assert.equal(previousMonth('2026-11'), '2026-10');
});

test('property: walking back a month always lands on a real month, twelve steps a year', () => {
  let month = '2030-05';
  for (let i = 0; i < 120; i++) {
    const before = previousMonth(month);
    assert.match(before, /^\d{4}-(0[1-9]|1[0-2])$/);
    assert.ok(before < month);
    month = before;
  }
  assert.equal(month, '2020-05');
});

test('the kept share is of what was charged, and empty when nothing was', () => {
  assert.equal(keptPercent({ grossMinor: 1000, netMinor: 900 }), 90);
  assert.equal(keptPercent({ grossMinor: 0, netMinor: 0 }), null);
});

test('every view of the mock overview adds up to its totals, per currency', async () => {
  const overview = await billingReportsMockAdapter.overview({});
  for (const total of overview.totals) {
    for (const view of [overview.byMonth, overview.byCountry, overview.byChannel, overview.byClient]) {
      const lines = view.filter((line) => line.currency === total.currency);
      assert.equal(
        lines.reduce((sum, line) => sum + line.netMinor, 0),
        total.netMinor,
      );
    }
    assert.equal(total.netMinor, total.grossMinor - total.refundedMinor);
  }
});

test('the Revenue page is in the admin menu, admin-only, and downloads the register as CSV', () => {
  const shell = readFileSync('shared/components/layout/AppShell.tsx', 'utf8');
  assert.match(shell, /href: '\/admin\/revenue', label: 'Revenue', minimumRole: 'ADMIN'/);
  const rbac = readFileSync('features/auth/rbac.ts', 'utf8');
  assert.match(rbac, /'\/admin\/revenue': 'ADMIN'/);
  assert.match(rbac, /'\/app\/admin\/revenue': 'ADMIN'/);
  const page = readFileSync('app/(app)/app/admin/revenue/page.tsx', 'utf8');
  assert.match(page, /billingReportsRepository\.gstMonthCsv\(month\)/);
  assert.match(page, /user\?\.role === 'ADMIN'/);
});
