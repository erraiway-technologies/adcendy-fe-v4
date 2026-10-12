import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CREATIVE_CAPABILITY_VALUES,
  DELIVERY_DEADLINE_VALUES,
  MARKETING_HOURS_PER_WEEK_VALUES,
  MONTHLY_MARKETING_SPEND_VALUES,
  PAID_MEDIA_BUDGET_RANGE_VALUES,
  PAYBACK_WINDOW_VALUES,
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
  assert.deepEqual([...PAID_MEDIA_BUDGET_RANGE_VALUES], [...MONTHLY_MARKETING_SPEND_VALUES, 'unknown']);
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
