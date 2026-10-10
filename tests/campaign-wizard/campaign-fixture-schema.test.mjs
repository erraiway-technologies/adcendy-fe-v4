import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignFixtureSchema } from '../../e2e/campaign-wizard/campaign-fixture-schema.mjs';

const minimalFixture = {
  fixtureVersion: '1.0',
  fixtureStatus: 'ready',
  slug: 'schema-test',
  displayName: 'Schema Test',
  wizard: {
    step1: {
      marketingTargetType: 'whole_business',
      focusName: 'Schema Test',
      sourceType: 'manual_only',
      targetMarkets: ['IN'],
      primaryMarket: 'IN',
      marketScope: 'national',
      currency: 'INR',
    },
    step2: {
      businessName: 'Schema Test',
      industryCategory: 'SaaS',
      businessModel: 'B2B',
      audienceModel: 'single_sided',
      lifecycleStage: 'growth',
      businessDescription: 'A test business description.',
      productCategory: 'Software',
      productsServices: ['Test service'],
      priceRangeLow: 999,
      priceRangeHigh: 2999,
      sensitiveCategoryFlags: ['none'],
    },
    step3: {
      primaryTargetSegment: 'Test buyers',
      targetPersona: 'A test buyer',
      language: 'english',
      painPoints: ['One', 'Two', 'Three'],
      desiredOutcome: 'A tested outcome',
      decisionProcess: 'A buyer reviews and approves.',
      buyerRoles: ['Buyer'],
    },
    step4: {
      salesChannels: [{ channel: 'direct_sales', rank: 1 }],
      primaryConversionPath: 'book_call',
      trustSignals: ['Verified test signal'],
    },
    step5: {
      primaryGoal: 'leads',
      monthlyMarketingBudget: 0,
      paidAdsShare: 'none',
      marketingHandler: 'unknown',
      contentCapacity: 'unknown',
      marketingHoursPerWeek: 'unknown',
      creativeCapabilities: ['none'],
      deliveryDeadline: 'unknown',
      salesCapacity: 'not_sure',
      knownCompetitorStatus: 'unknown',
    },
    step6: {
      typicalDealValue: 25000,
      grossMarginBand: 'from_40_to_60_percent',
      paybackWindow: 'unknown',
    },
    step7: {
      confirmFocus: true,
      confirmBusiness: true,
      confirmAudience: true,
      confirmGoals: true,
      confirmEconomics: true,
      readyToGenerate: true,
      dataConsentOptIn: false,
      privacyProcessingConsent: true,
      aiProcessingConsent: true,
    },
  },
};

function issuePaths(result) {
  return result.error.issues.map((issue) => issue.path.join('.'));
}

test('accepts a complete canonical campaign fixture', () => {
  assert.equal(campaignFixtureSchema.safeParse(minimalFixture).success, true);
});

test('reports unsupported wizard fields before browser execution', () => {
  const invalid = structuredClone(minimalFixture);
  invalid.wizard.step2.unsupportedField = 'must fail';
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some(
      (issue) =>
        issue.code === 'unrecognized_keys' &&
        issue.path.join('.') === 'wizard.step2',
    ),
  );
});

test('reports conditional fixture failures with the field path', () => {
  const invalid = structuredClone(minimalFixture);
  invalid.wizard.step5.salesCapacity = '';
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some(
      (issue) => issue.path.join('.') === 'wizard.step5.salesCapacity',
    ),
  );
});

test('requires the gross margin band', () => {
  const invalid = structuredClone(minimalFixture);
  delete invalid.wizard.step6.grossMarginBand;
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(issuePaths(result).includes('wizard.step6.grossMarginBand'));
});

test('requires a deal or order amount so the wizard can be committed', () => {
  const invalid = structuredClone(minimalFixture);
  delete invalid.wizard.step6.typicalDealValue;
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(issuePaths(result).includes('wizard.step6.typicalDealValue'));

  const byOrder = structuredClone(minimalFixture);
  delete byOrder.wizard.step6.typicalDealValue;
  byOrder.wizard.step6.averageOrderValueAmount = 1500;
  assert.equal(campaignFixtureSchema.safeParse(byOrder).success, true);
});

test('refuses a price range whose highest price is below its lowest', () => {
  const invalid = structuredClone(minimalFixture);
  invalid.wizard.step2.priceRangeHigh = 10;
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(issuePaths(result).includes('wizard.step2.priceRangeHigh'));
});

test('requires every answer the wizard form asks before saving steps 5 and 6', () => {
  const invalid = structuredClone(minimalFixture);
  delete invalid.wizard.step5.marketingHoursPerWeek;
  delete invalid.wizard.step5.creativeCapabilities;
  delete invalid.wizard.step5.deliveryDeadline;
  delete invalid.wizard.step6.paybackWindow;
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  const paths = issuePaths(result);
  for (const expected of [
    'wizard.step5.marketingHoursPerWeek',
    'wizard.step5.creativeCapabilities',
    'wizard.step5.deliveryDeadline',
    'wizard.step6.paybackWindow',
  ]) {
    assert.ok(paths.includes(expected), `Expected an issue at ${expected}`);
  }
});

test('takes the backend camelCase values, not their snake_case tokens', () => {
  const invalid = structuredClone(minimalFixture);
  invalid.wizard.step5.deliveryDeadline = 'within_three_months';
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(issuePaths(result).includes('wizard.step5.deliveryDeadline'));
});

test('takes the budget as an amount and the paid-ads share as an option', () => {
  const asText = structuredClone(minimalFixture);
  asText.wizard.step5.monthlyMarketingBudget = 'INR 5,000';
  const textResult = campaignFixtureSchema.safeParse(asText);
  assert.equal(textResult.success, false);
  assert.ok(issuePaths(textResult).includes('wizard.step5.monthlyMarketingBudget'));

  const unlisted = structuredClone(minimalFixture);
  unlisted.wizard.step5.paidAdsShare = 'some';
  assert.ok(issuePaths(campaignFixtureSchema.safeParse(unlisted)).includes('wizard.step5.paidAdsShare'));
});

test('requires at least one creative capability, and keeps "none" on its own', () => {
  const empty = structuredClone(minimalFixture);
  empty.wizard.step5.creativeCapabilities = [];
  const emptyResult = campaignFixtureSchema.safeParse(empty);
  assert.equal(emptyResult.success, false);
  assert.ok(issuePaths(emptyResult).includes('wizard.step5.creativeCapabilities'));

  const combined = structuredClone(minimalFixture);
  combined.wizard.step5.creativeCapabilities = ['none', 'video'];
  const combinedResult = campaignFixtureSchema.safeParse(combined);
  assert.equal(combinedResult.success, false);
  assert.ok(issuePaths(combinedResult).includes('wizard.step5.creativeCapabilities'));
});

test('rejects normalized-contract length violations before browser execution', () => {
  const invalid = structuredClone(minimalFixture);
  invalid.wizard.step3.primaryTargetSegment = 'x'.repeat(161);
  const result = campaignFixtureSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some(
      (issue) =>
        issue.code === 'too_big' &&
        issue.path.join('.') === 'wizard.step3.primaryTargetSegment',
    ),
  );
});
