import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  ADMIN_CAMPAIGN_STATUS_LABELS,
  ADMIN_CAMPAIGN_STATUS_VALUES,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_VALUES,
} from '../../shared/types/campaign.ts';

// V3-449: a campaign's status follows its latest run, and every status the
// backend writes reads as itself, in the client's words and the admin's.

const backendStatuses = [...ADMIN_CAMPAIGN_STATUS_VALUES];

test('every backend status has a client label and an admin label', () => {
  for (const status of backendStatuses) {
    assert.ok(ADMIN_CAMPAIGN_STATUS_LABELS[status], `admin label for ${status}`);
    const clientStatus = status === 'WIZARD_DRAFT' ? 'DRAFT' : status;
    assert.ok(
      (CAMPAIGN_STATUS_VALUES as readonly string[]).includes(clientStatus),
      `client status for ${status}`,
    );
    assert.ok(
      CAMPAIGN_STATUS_LABELS[clientStatus as keyof typeof CAMPAIGN_STATUS_LABELS],
      `client label for ${status}`,
    );
  }
});

test('the client reads every backend status as itself, not as a draft', () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), 'shared', 'api', 'real', 'campaigns.real.ts'),
    'utf8',
  );
  assert.match(
    source,
    /\(CAMPAIGN_STATUS_VALUES as readonly string\[\]\)\.includes\(normalized\)/,
  );
  // A status the client used to fold into another now reads as itself.
  assert.doesNotMatch(source, /normalized === 'STRATEGY_GENERATION'\) \{\s*return 'SUBMITTED_FOR_REVIEW'/);
});

test('the admin pages use the admin wording, and the list filters by backend values', () => {
  for (const page of [
    ['app', '(app)', 'app', 'admin', 'campaigns', 'page.tsx'],
    ['app', '(app)', 'app', 'admin', 'campaigns', '[campaignId]', 'page.tsx'],
    ['app', '(app)', 'app', 'admin', 'page.tsx'],
  ]) {
    const source = fs.readFileSync(path.resolve(process.cwd(), ...page), 'utf8');
    assert.match(source, /formatAdminCampaignStatus\(/, page.join('/'));
    assert.doesNotMatch(source, /formatCampaignStatus\(/, page.join('/'));
  }
  const list = fs.readFileSync(
    path.resolve(process.cwd(), 'app', '(app)', 'app', 'admin', 'campaigns', 'page.tsx'),
    'utf8',
  );
  assert.match(list, /ADMIN_CAMPAIGN_STATUS_VALUES\.map/);
  assert.doesNotMatch(list, /value="DRAFT"/);
});
