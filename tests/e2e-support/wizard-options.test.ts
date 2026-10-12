import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWizardE2eOptionLabels,
  optionsFieldForPath,
  unwrapWizardOptions,
} from '../../e2e/campaign-wizard/wizard-options.ts';

// V3-76: the campaign wizard E2E clicks options by the labels the options
// response serves, so these are whatever the seed says, not a local copy.
const option = (value: string, label: string, canonicalToken = value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()) =>
  ({ value, label, canonicalToken });

const marketList = (salesChannels: Array<{ value: string; label: string }>) => ({
  salesChannels,
  socialPlatforms: [{ value: 'twitter', label: 'X (Twitter)' }],
  presenceLinkTypes: [{ value: 'google_business', label: 'Google Business profile' }],
  peakSeasons: [{ value: 'diwali', label: 'Diwali' }],
  competitorPlaceholder: '',
  complianceRegime: null,
});

const SERVED = {
  fieldOptions: {
    targetMarkets: [option('IN', 'India', 'in'), option('GB', 'United Kingdom', 'gb')],
    currency: [option('INR', 'Indian rupee (INR)', 'inr')],
    sellsVia: [option('own_channel', 'Own website or store (renamed in seed)')],
    marketingHoursPerWeek: [option('underFive', 'Under 5 hours'), option('unknown', "Don't know")],
    audienceModel: [option('singleSided', 'One audience')],
    primaryGoal: [option('leads', 'Leads')],
    salesShare: [option('over_60', 'Over 60%')],
    currentMarketingActivityStatus: [option('active', 'Running now')],
  },
  marketLists: {
    IN: marketList([{ value: 'other_marketplace', label: 'Another marketplace' }]),
    global: marketList([
      { value: 'other_marketplace', label: 'A marketplace' },
      { value: 'etsy', label: 'Etsy' },
    ]),
  },
};

test('reads the options body with or without the data envelope', () => {
  assert.equal(unwrapWizardOptions({ success: true, data: SERVED }), SERVED);
  assert.equal(unwrapWizardOptions(SERVED), SERVED);
  assert.throws(() => unwrapWizardOptions({ data: {} }), /no fieldOptions/);
});

test('a row control reads the list it is filled from', () => {
  assert.equal(optionsFieldForPath('salesChannels.0.channel'), 'salesChannels');
  assert.equal(optionsFieldForPath('salesChannels.2.salesShare'), 'salesShare');
  assert.equal(optionsFieldForPath('socialHandles.1.platform'), 'socialPlatforms');
  assert.equal(optionsFieldForPath('digitalPresenceLinks.0.type'), 'presenceLinkTypes');
  assert.equal(optionsFieldForPath('currentMarketingActivity.0.status'), 'currentMarketingActivityStatus');
  assert.equal(
    optionsFieldForPath('currentMarketingActivity.0.workingAssessment'),
    'currentMarketingActivityAssessment',
  );
  assert.equal(optionsFieldForPath('sellsVia'), 'sellsVia');
});

test('a stored value reads as the label the seed serves', () => {
  const labels = createWizardE2eOptionLabels({ data: SERVED });
  assert.equal(labels.optionLabel('sellsVia', 'own_channel'), 'Own website or store (renamed in seed)');
  assert.equal(labels.optionLabel('currency', 'INR'), 'Indian rupee (INR)');
  assert.equal(labels.optionLabel('salesChannels.0.salesShare', 'over_60'), 'Over 60%');
  assert.equal(labels.optionLabel('currentMarketingActivity.0.status', 'active'), 'Running now');
  // camelCase and snake_case spellings of one value, as the wizard reads them.
  assert.equal(labels.optionLabel('marketingHoursPerWeek', 'underFive'), 'Under 5 hours');
  assert.equal(labels.optionLabel('audienceModel', 'single_sided'), 'One audience');
  // Renamed (v1) values map the way the app maps them.
  assert.equal(labels.optionLabel('audienceModel', 'single_audience'), 'One audience');
  assert.equal(labels.optionLabel('primaryGoal', 'lead_generation'), 'Leads');
  // Not served: the wizard does not offer it.
  assert.equal(labels.optionLabel('sellsVia', 'carrier_pigeon'), null);
});

test('a market list is the campaign market own, else the global one', () => {
  const labels = createWizardE2eOptionLabels(SERVED);
  assert.equal(labels.optionLabel('salesChannels.0.channel', 'other_marketplace', 'IN'), 'Another marketplace');
  assert.equal(labels.optionLabel('salesChannels.0.channel', 'other_marketplace', 'KE'), 'A marketplace');
  assert.equal(labels.optionLabel('salesChannels.0.channel', 'other_marketplace', null), 'A marketplace');
  // India's list does not offer Etsy, so the wizard shows no such option there.
  assert.equal(labels.optionLabel('salesChannels.0.channel', 'etsy', 'IN'), null);
  assert.equal(labels.optionLabel('salesChannels.0.channel', 'etsy', 'GB'), 'Etsy');
  assert.equal(labels.optionLabel('socialHandles.0.platform', 'twitter', 'IN'), 'X (Twitter)');
  assert.equal(labels.optionLabel('digitalPresenceLinks.0.type', 'google_business', 'GB'), 'Google Business profile');
});

test('controls the wizard lists itself keep its own labels', () => {
  const labels = createWizardE2eOptionLabels(SERVED);
  assert.equal(labels.optionLabel('googleAnalyticsConnected', 'true'), 'Connected');
  assert.equal(labels.optionLabel('googleAnalyticsConnected', 'unknown'), "Don't know");
  assert.equal(labels.optionLabel('subscriptionOffered', 'no'), 'No');
  assert.equal(typeof labels.optionLabel('grossMarginBand', 'from_20_to_40_percent'), 'string');
  assert.equal(labels.optionLabel('grossMarginBand', 'nope'), null);
});

test('countries read by their served name; the review falls back to the answer', () => {
  const labels = createWizardE2eOptionLabels(SERVED);
  assert.equal(labels.country('GB'), 'United Kingdom');
  assert.equal(labels.country('KE'), 'Kenya');
  assert.equal(labels.reviewLabel('peakSeasons', 'diwali', 'IN'), 'Diwali');
  assert.equal(labels.reviewLabel('pricePosition', 'premium'), 'premium');
});
