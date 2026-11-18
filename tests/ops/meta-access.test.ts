import assert from 'node:assert/strict';
import test from 'node:test';
import { describeMetaAccess, readMetaTokenHealth } from '../../shared/components/ops/metaAccess.ts';

// Backend V3-401: the Meta access admin page. Every status the backend sends
// gets one headline and what to do; the report is read wrapped or bare.

const STATUSES = ['disabled', 'active', 'expiring_soon', 'refreshed', 'refresh_failed', 'expired', 'missing'] as const;

test('V3-401: every status reads, wrapped in the api envelope or not, and gets a headline and a detail', () => {
  for (const status of STATUSES) {
    for (const expiresAt of [null, '2026-07-31T12:00:00.000Z']) {
      for (const needsReAuth of [true, false]) {
        const report = { status, message: 'm', expiresAt, daysRemaining: 3, lastRefreshAt: null, needsReAuth };
        for (const response of [report, { success: true, data: report }]) {
          const health = readMetaTokenHealth(response);
          assert.ok(health, `${status} reads`);
          const view = describeMetaAccess(health!);
          assert.ok(view.headline.length > 0 && view.detail.length > 0, status);
          assert.ok(['ok', 'warn', 'bad', 'off'].includes(view.tone));
        }
      }
    }
  }
});

test('V3-401: an expired token says so with its date and asks for a new one; a never-expiring one needs nothing', () => {
  const expired = describeMetaAccess(
    readMetaTokenHealth({
      status: 'expired',
      message: '',
      expiresAt: '2026-07-31T12:00:00.000Z',
      daysRemaining: 0,
      lastRefreshAt: null,
      needsReAuth: true,
    })!,
  );
  assert.equal(expired.tone, 'bad');
  assert.match(expired.headline, /31 Jul 2026/);
  assert.match(expired.detail, /paste a new one/);
  const systemUser = describeMetaAccess(
    readMetaTokenHealth({
      status: 'active',
      message: '',
      expiresAt: null,
      daysRemaining: null,
      lastRefreshAt: null,
      needsReAuth: false,
    })!,
  );
  assert.equal(systemUser.tone, 'ok');
  assert.match(systemUser.detail, /does not expire/);
});

test('V3-401: an unreadable report is null, never a guessed status', () => {
  for (const response of [null, undefined, 'x', {}, { status: 'unheard_of' }, { data: { status: 42 } }]) {
    assert.equal(readMetaTokenHealth(response), null);
  }
});
