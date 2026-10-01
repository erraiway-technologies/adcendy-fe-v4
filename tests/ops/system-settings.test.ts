import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  normalizeSettingHistory,
  normalizeSystemSettingsListing,
} from '../../shared/types/systemSettings.ts';

function read(relativePath: string): string {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

test('keeps the effect, limits and lock of each setting', () => {
  const listing = normalizeSystemSettingsListing({
    data: undefined,
    categories: [{ id: 'providers', label: 'Data providers', description: 'Provider limits.' }],
    settings: [
      {
        key: 'pipeline_v2.provider_max_concurrency_per_provider',
        label: 'Parallel calls per data provider',
        category: 'providers',
        unit: 'calls',
        effect: 'How many requests one run may have open at once against a single provider.',
        appliesWhen: 'new_runs',
        min: 1,
        max: 16,
        integer: true,
        editable: true,
        valueType: 'number',
        value: 6,
        defaultValue: 4,
        isDefault: false,
        isSet: true,
        updatedAt: '2026-10-01T10:00:00.000Z',
        lastChange: {
          id: 'chg_1',
          key: 'pipeline_v2.provider_max_concurrency_per_provider',
          previousValue: 4,
          newValue: 6,
          changeKind: 'update',
          reason: 'Firecrawl raised our limit',
          revertOfChangeId: null,
          changedBy: 'ops@adcendy.com',
          changedAt: '2026-10-01T10:00:00.000Z',
        },
      },
      {
        key: 'pipeline_v2.section_human_approval_required',
        label: 'Human approval of every section',
        category: 'review',
        effect: 'Every section waits for a reviewer.',
        appliesWhen: 'new_runs',
        editable: false,
        lockedReason: 'A product rule that cannot be switched off from here.',
        valueType: 'boolean',
        value: true,
        defaultValue: true,
        isDefault: true,
      },
      { label: 'no key, dropped' },
    ],
  });

  assert.equal(listing.settings.length, 2);
  const [concurrency, approval] = listing.settings;
  assert.equal(concurrency.min, 1);
  assert.equal(concurrency.max, 16);
  assert.equal(concurrency.integer, true);
  assert.equal(concurrency.isDefault, false);
  assert.equal(concurrency.lastChange?.reason, 'Firecrawl raised our limit');
  assert.equal(approval.editable, false);
  assert.match(approval.lockedReason ?? '', /product rule/);
  assert.equal(approval.min, null);
});

test('an unknown applies-when reads as new runs, never as live', () => {
  const listing = normalizeSystemSettingsListing({
    categories: [],
    settings: [{ key: 'k', effect: 'x', appliesWhen: 'sometimes', editable: true }],
  });
  assert.equal(listing.settings[0].appliesWhen, 'new_runs');
  assert.equal(listing.settings[0].label, 'k');
});

test('reads setting history newest first as given', () => {
  const changes = normalizeSettingHistory({
    changes: [
      { id: 'b', key: 'k', previousValue: 6, newValue: 4, changeKind: 'revert', reason: 'too many 429s', revertOfChangeId: 'a', changedBy: null, changedAt: '2026-10-02T00:00:00.000Z' },
      { id: 'a', key: 'k', previousValue: 4, newValue: 6, changeKind: 'update', reason: 'faster runs', revertOfChangeId: null, changedBy: 'ops@adcendy.com', changedAt: '2026-10-01T00:00:00.000Z' },
      'garbage',
    ],
  });
  assert.deepEqual(changes.map((change) => change.id), ['b', 'a']);
  assert.equal(changes[0].revertOfChangeId, 'a');
});

test('the settings screen calls the routes the backend serves', () => {
  const realAdapter = read('shared/api/real/systemSettings.real.ts');
  assert.match(realAdapter, /'\/api\/v2\/admin\/pipeline-v2\/config'/);
  assert.match(realAdapter, /method: 'PUT', body: \{ value: payload\.value, reason: payload\.reason \}/);
  assert.match(realAdapter, /\/changes\/\$\{encodeURIComponent\(payload\.changeId\)\}\/revert/);
});

test('settings is an admin-only route', () => {
  const rbac = read('features/auth/rbac.ts');
  assert.match(rbac, /'\/admin\/settings': 'ADMIN'/);
  assert.match(rbac, /'\/app\/admin\/settings': 'ADMIN'/);
});
