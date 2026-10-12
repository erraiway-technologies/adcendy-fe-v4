import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CREATIVE_CAPABILITY_VALUES,
  DELIVERY_DEADLINE_VALUES,
  DIGITAL_PRESENCE_LINK_TYPE_VALUES,
  MARKETING_HANDLER_VALUES,
  MARKETING_HOURS_PER_WEEK_VALUES,
  MONTHLY_MARKETING_SPEND_VALUES,
  PAID_MEDIA_BUDGET_RANGE_VALUES,
  PAYBACK_WINDOW_VALUES,
  PRIMARY_GOAL_VALUES,
  normalizeCreativeCapabilities,
  toggleCreativeCapability,
} from '../../shared/types/wizard.ts';

// Wizard v2.1 intake answers. The backend step schemas are strict and these
// are the option values GET /api/v2/wizard/options lists, verbatim; its
// not-sure option is served as the one "Don't know", `unknown` (v3 rule 4).
// Their labels come from that response too (wizard-labels.test.ts).

test('option values match the backend wizard contract exactly', () => {
  assert.deepEqual([...MARKETING_HOURS_PER_WEEK_VALUES], [
    'underFive',
    'fiveToTen',
    'tenToTwenty',
    'twentyToForty',
    'fortyPlus',
    'unknown',
  ]);
  assert.deepEqual([...CREATIVE_CAPABILITY_VALUES], [
    'video',
    'photography',
    'copywriting',
    'design',
    'none',
  ]);
  assert.deepEqual([...DELIVERY_DEADLINE_VALUES], [
    'withinThreeMonths',
    'withinSixMonths',
    'noFixedDeadline',
    'unknown',
  ]);
  assert.deepEqual([...PAYBACK_WINDOW_VALUES], [
    'firstOrder',
    'withinThreeMonths',
    'withinSixMonths',
    'withinTwelveMonths',
    'longerThanTwelveMonths',
    'unknown',
  ]);
  assert.deepEqual([...MONTHLY_MARKETING_SPEND_VALUES], [
    'nothing',
    'under_5k',
    '5k_15k',
    '15k_50k',
    '50k_plus',
    'unknown',
  ]);
  assert.deepEqual([...PAID_MEDIA_BUDGET_RANGE_VALUES], [...MONTHLY_MARKETING_SPEND_VALUES]);
});

// V3-75: the values the backend serves (wizard-v2.seed.v2.json 1.12.0 and
// market-lists.v2.json), as snake_case tokens; older ones load as these.
test('goal, owner and presence-link values are the ones the backend serves', () => {
  assert.deepEqual([...PRIMARY_GOAL_VALUES], [
    'revenue_growth',
    'new_customers',
    'leads',
    'awareness',
    'launch',
    'repeat_purchase_retention',
    'footfall',
    'market_expansion',
    'other',
  ]);
  assert.deepEqual([...MARKETING_HANDLER_VALUES], [
    'founder_led',
    'in_house_marketer',
    'in_house_team',
    'agency',
    'freelancer',
    'nobody_yet',
  ]);
  // Every market's presence-link types; no social or retired marketplace type.
  assert.deepEqual([...DIGITAL_PRESENCE_LINK_TYPE_VALUES], [
    'amazon',
    'marketplace_listing',
    'google_business',
    'google_reviews',
    'trustpilot',
    'zomato_swiggy',
    'practo',
    'app_store',
    'other',
  ]);
});

test('selecting "None of these" clears the others, and any other choice clears it', () => {
  assert.deepEqual(toggleCreativeCapability(['video', 'design'], 'none'), ['none']);
  assert.deepEqual(toggleCreativeCapability(['none'], 'video'), ['video']);
  assert.deepEqual(toggleCreativeCapability(['video'], 'design'), ['video', 'design']);
  assert.deepEqual(toggleCreativeCapability(['video', 'design'], 'video'), ['design']);
  assert.deepEqual(toggleCreativeCapability(['none'], 'none'), []);
});

test('creative capabilities are normalized the way the backend reads them', () => {
  assert.deepEqual(normalizeCreativeCapabilities(['video', 'video', ' design ']), ['video', 'design']);
  assert.deepEqual(normalizeCreativeCapabilities(['none', 'video']), ['video']);
  assert.deepEqual(normalizeCreativeCapabilities(['none']), ['none']);
  assert.deepEqual(normalizeCreativeCapabilities(['Video', 'drone_footage', 42]), []);
  assert.deepEqual(normalizeCreativeCapabilities('video'), []);
});
