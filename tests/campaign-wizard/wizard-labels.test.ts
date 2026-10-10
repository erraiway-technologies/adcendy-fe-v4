import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTENT_CAPACITY_LABELS,
  KNOWN_COMPETITOR_STATUS_LABELS,
  MARKETING_HANDLER_LABELS,
  PRIMARY_GOAL_LABELS,
  SENSITIVE_CATEGORY_FLAG_LABELS,
  formatAudienceModel,
  formatContentCapacity,
  formatKnownCompetitorStatus,
  formatMarketingHandler,
  formatMarketingTargetType,
  formatPrimaryGoal,
  formatSensitiveCategoryFlags,
} from '../../shared/types/wizard.ts';

// What the backend serves today (adcendy-be-v4,
// config/pipeline-v2/wizard-v2.seed.v2.json and system-config.seed.v2.json),
// as the dropdown sends it: each must read in words, not as its value.
const SERVED = {
  primaryGoal: ['revenue_growth', 'lead_generation', 'awareness', 'launch_readiness', 'retention', 'market_expansion', 'other'],
  marketingHandler: ['founder_led', 'internal_marketer', 'agency', 'in_house_team', 'not_sure'],
  contentCapacity: ['none', 'low', 'medium', 'high', 'not_sure'],
  knownCompetitorStatus: ['provided', 'none_known', 'not_sure'],
  sensitiveCategoryFlags: [
    'none', 'not_sure', 'healthcare', 'wellness', 'supplements', 'finance', 'legal', 'education_claims',
    'b2b_security_compliance', 'alcohol_tobacco_restricted', 'healthcare_wellness', 'restricted_products',
  ],
};

test('every answer the backend serves today has a written label', () => {
  const maps: Record<keyof typeof SERVED, Record<string, string>> = {
    primaryGoal: PRIMARY_GOAL_LABELS,
    marketingHandler: MARKETING_HANDLER_LABELS,
    contentCapacity: CONTENT_CAPACITY_LABELS,
    knownCompetitorStatus: KNOWN_COMPETITOR_STATUS_LABELS,
    sensitiveCategoryFlags: SENSITIVE_CATEGORY_FLAG_LABELS,
  };
  const missing = Object.entries(SERVED).flatMap(([field, values]) =>
    values.filter((value) => !maps[field as keyof typeof SERVED][value]).map((value) => `${field}: ${value}`),
  );
  assert.deepEqual(missing, []);
});

test('the review reads the goal and owner the dropdown sent', () => {
  assert.equal(formatPrimaryGoal('revenue_growth'), 'Revenue growth');
  assert.equal(formatMarketingHandler('founder_led'), 'Founder-led');
  assert.equal(formatContentCapacity('not_sure'), 'Not sure');
  assert.equal(formatKnownCompetitorStatus('none_known'), 'None known');
});

test('older campaigns keep their v1 labels', () => {
  assert.equal(formatPrimaryGoal('more_sales'), 'Get more sales');
  assert.equal(formatMarketingHandler('self'), 'I handle it myself');
});

test('a value saved in another spelling still finds its label', () => {
  assert.equal(formatPrimaryGoal('revenueGrowth'), 'Revenue growth');
  assert.equal(formatMarketingHandler('inHouseTeam'), 'In-house team');
  // The backend rewrites these on save.
  assert.equal(formatMarketingTargetType('product_service'), 'Product or service');
  assert.equal(formatAudienceModel('single_audience'), 'One audience');
  assert.equal(formatAudienceModel('marketplace_two_sided'), 'Marketplace / two-sided platform');
});

test('sensitive flags read as a list, and an unknown flag keeps its own value', () => {
  assert.equal(formatSensitiveCategoryFlags(['education_claims', 'none']), 'Education claims, None');
  assert.equal(formatSensitiveCategoryFlags(['new_admin_flag']), 'new_admin_flag');
  assert.equal(formatSensitiveCategoryFlags([]), null);
});
