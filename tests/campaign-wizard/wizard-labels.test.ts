import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  createWizardOptionLabels,
  toCurrentWizardValue,
  withCurrentPresenceLinks,
  type WizardOptionsResponseV2,
} from '../../shared/types/wizard.ts';

// GET /api/v2/wizard/options as the backend serves it (adcendy-be-v4,
// config/pipeline-v2/wizard-v2.seed.v2.json v1.12.0 through
// toPublicWizardOptionItemV2): each option its seeded `{ value, label }`, the
// snake_case canonical token beside it, and every not-sure answer served as
// the one `unknown`, "Don't know".
const option = (value: string, label: string, canonicalToken = value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()) =>
  ({ value, label, canonicalToken });
const dontKnow = { value: 'unknown', label: "Don't know", canonicalToken: 'unknown' };

const SERVED: Pick<WizardOptionsResponseV2, 'fieldOptions' | 'marketLists'> = {
  fieldOptions: {
    marketingTargetType: [option('whole_business', 'Whole business'), option('productOrService', 'Product or service')],
    sourceType: [option('website', 'Website'), option('digitalPresenceOnly', 'Digital presence only')],
    targetMarkets: [option('IN', 'India', 'in'), option('GB', 'United Kingdom', 'gb')],
    audienceModel: [
      option('singleSided', 'One audience'),
      option('b2b2c', 'Business + end customer (B2B2C)'),
      option('marketplacePlatform', 'Marketplace / two-sided platform'),
      dontKnow,
    ],
    primaryGoal: [
      option('revenueGrowth', 'Revenue growth'),
      option('newCustomers', 'New customers'),
      option('awareness', 'Awareness'),
      option('marketExpansion', 'Market expansion'),
      option('other', 'Other'),
      option('leads', 'Leads'),
      option('launch', 'Launch'),
      option('repeatPurchaseRetention', 'Repeat purchase & retention'),
    ],
    marketingHandler: [
      option('founderLed', 'Founder'),
      option('inHouseMarketer', 'One in-house marketer'),
      option('inHouseTeam', 'In-house team'),
      option('agency', 'Agency'),
      option('nobodyYet', 'Nobody yet'),
    ],
    contentCapacity: [option('none', 'Nothing yet'), option('low', 'A post or two a week'), dontKnow],
    marketingHoursPerWeek: [option('fortyPlus', '40+ hours (full-time or more)'), dontKnow],
    creativeCapabilities: [option('video', 'Video'), option('copywriting', 'Copywriting'), option('none', 'None of these')],
    paidMediaBudgetRange: [option('5k_15k', 'INR 5,000 to INR 15,000'), dontKnow],
    monthlyWebsiteTraffic: [option('500_2000', '500–2,000'), dontKnow],
    sensitiveCategoryFlags: [option('none', 'None'), option('educationClaims', 'Education claims'), dontKnow],
    dataConsentOptIn: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }],
  },
  marketLists: {
    IN: {
      salesChannels: [
        { value: 'flipkart', label: 'Flipkart' },
        { value: 'other_marketplace', label: 'Another marketplace' },
      ],
      socialPlatforms: [{ value: 'twitter', label: 'X (Twitter)' }],
      presenceLinkTypes: [{ value: 'zomato_swiggy', label: 'Zomato / Swiggy' }],
      peakSeasons: [{ value: 'diwali', label: 'Diwali' }],
      competitorPlaceholder: '',
      complianceRegime: null,
    },
    global: {
      salesChannels: [
        { value: 'own_website', label: 'Own website' },
        { value: 'other_marketplace', label: 'A marketplace' },
      ],
      socialPlatforms: [{ value: 'instagram', label: 'Instagram' }],
      presenceLinkTypes: [
        { value: 'google_business', label: 'Google Business profile' },
        { value: 'marketplace_listing', label: 'Marketplace listing' },
        { value: 'other', label: 'Other' },
      ],
      peakSeasons: [],
      competitorPlaceholder: '',
      complianceRegime: null,
    },
  },
};

const labels = createWizardOptionLabels(SERVED);

test('an answer reads by the label the backend serves, as the dropdown sent it or as saved', () => {
  // The dropdowns send the canonical token; the backend may hand back its own spelling.
  assert.equal(labels.label('primaryGoal', 'revenue_growth'), 'Revenue growth');
  assert.equal(labels.label('primaryGoal', 'revenueGrowth'), 'Revenue growth');
  assert.equal(labels.label('marketingHandler', 'founder_led'), 'Founder');
  assert.equal(labels.label('marketingHandler', 'inHouseTeam'), 'In-house team');
  assert.equal(labels.label('sourceType', 'digital_presence_only'), 'Digital presence only');
  assert.equal(labels.label('marketingHoursPerWeek', 'fortyPlus'), '40+ hours (full-time or more)');
  assert.equal(labels.label('paidMediaBudgetRange', '5k_15k'), 'INR 5,000 to INR 15,000');
  assert.equal(labels.label('monthlyWebsiteTraffic', '500_2000'), '500–2,000');
  assert.equal(labels.label('targetMarkets', 'GB'), 'United Kingdom');
  assert.equal(labels.label('dataConsentOptIn', true), 'Yes');
});

test('the label is the served one, never a local wording', () => {
  const relabelled = createWizardOptionLabels({
    fieldOptions: { contentCapacity: [option('low', 'One or two posts a week')] },
  });
  assert.equal(relabelled.label('contentCapacity', 'low'), 'One or two posts a week');
});

test("every not-sure answer reads as the served \"Don't know\"", () => {
  assert.equal(labels.label('contentCapacity', 'unknown'), "Don't know");
  assert.equal(labels.label('contentCapacity', 'not_sure'), "Don't know");
  assert.equal(labels.label('audienceModel', 'notSure'), "Don't know");
  assert.equal(labels.label('paidMediaBudgetRange', 'not_sure'), "Don't know");
});

test('a saved alias is read as its current value before its label is looked up', () => {
  // The backend rewrites these on save.
  assert.equal(labels.label('marketingTargetType', 'product_service'), 'Product or service');
  assert.equal(labels.label('audienceModel', 'single_audience'), 'One audience');
  assert.equal(labels.label('audienceModel', 'business_and_end_customer'), 'Business + end customer (B2B2C)');
  assert.equal(labels.label('audienceModel', 'marketplace_two_sided'), 'Marketplace / two-sided platform');
  // ... and the goal and owner names v3 renamed.
  assert.equal(labels.label('primaryGoal', 'lead_generation'), 'Leads');
  assert.equal(labels.label('primaryGoal', 'retention'), 'Repeat purchase & retention');
  assert.equal(labels.label('primaryGoal', 'launch_readiness'), 'Launch');
  assert.equal(labels.label('marketingHandler', 'internal_marketer'), 'One in-house marketer');
  assert.equal(labels.label('marketingHandler', 'not_sure'), 'Nobody yet');
});

test('a v1 goal or owner reads as the v3 one it maps to (V3-77)', () => {
  // The backend reads and backfills them the same way
  // (adcendy-be-v4 src/wizard-v2/wizard-legacy-values-v2.ts).
  assert.equal(labels.label('primaryGoal', 'more_sales'), 'Revenue growth');
  assert.equal(labels.label('primaryGoal', 'more_customers'), 'New customers');
  assert.equal(labels.label('primaryGoal', 'new_market'), 'Market expansion');
  assert.equal(labels.label('primaryGoal', 'launch_product'), 'Launch');
  assert.equal(labels.label('primaryGoal', 'brand_awareness'), 'Awareness');
  assert.equal(labels.label('primaryGoal', 'beat_competitor'), 'New customers');
  assert.equal(labels.label('primaryGoal', 'reduce_channel_dependence'), 'Other');
  assert.equal(labels.label('marketingHandler', 'self'), 'Founder');
  assert.equal(labels.label('marketingHandler', 'team_member'), 'One in-house marketer');
  assert.equal(labels.label('marketingHandler', 'freelancer_agency'), 'Agency');
  assert.equal(labels.label('marketingHandler', 'nobody'), 'Nobody yet');
});

test('a saved answer loads as its current value', () => {
  assert.equal(toCurrentWizardValue('primaryGoal', 'more_sales'), 'revenue_growth');
  assert.equal(toCurrentWizardValue('primaryGoal', 'leadGeneration'), 'leads');
  assert.equal(toCurrentWizardValue('primaryGoal', 'leads'), 'leads');
  assert.equal(toCurrentWizardValue('marketingHandler', 'self'), 'founder_led');
  assert.equal(toCurrentWizardValue('marketingHandler', 'not_sure'), 'nobody_yet');
  assert.equal(toCurrentWizardValue('monthlyMarketingSpend', 'not_sure'), 'unknown');
  assert.equal(toCurrentWizardValue('monthlyMarketingSpend', '5k_15k'), '5k_15k');
  assert.equal(toCurrentWizardValue('presenceLinkTypes', 'flipkart'), 'marketplace_listing');
  assert.equal(toCurrentWizardValue('primaryGoal', ''), '');
});

test('a presence link saved under an older type loads as a current one, dropping nothing (A7)', () => {
  const { digitalPresenceLinks, socialHandles } = withCurrentPresenceLinks(
    [
      { type: 'instagram' as never, url: 'https://instagram.com/acme' },
      { type: 'linkedin' as never, url: 'https://linkedin.com/company/acme-old', label: '' },
      { type: 'flipkart' as never, url: 'https://www.flipkart.com/acme' },
      { type: 'whatsapp' as never, url: 'https://wa.me/1', label: 'Orders' },
      { type: 'trustpilot', url: 'https://trustpilot.com/acme' },
    ],
    [{ platform: 'linkedin', handle: 'acme' }],
    (type) => labels.find('socialPlatforms', type) ?? labels.find('salesChannels', type) ?? type,
  );
  assert.deepEqual(socialHandles, [
    { platform: 'linkedin', handle: 'acme' },
    { platform: 'instagram', handle: 'https://instagram.com/acme' },
  ]);
  assert.deepEqual(digitalPresenceLinks, [
    { type: 'other', url: 'https://linkedin.com/company/acme-old', label: 'linkedin' },
    { type: 'marketplace_listing', url: 'https://www.flipkart.com/acme', label: 'Flipkart' },
    { type: 'other', url: 'https://wa.me/1', label: 'Orders' },
    { type: 'trustpilot', url: 'https://trustpilot.com/acme' },
  ]);
});

test('a value the backend has no label for shows as itself', () => {
  assert.equal(labels.label('sensitiveCategoryFlags', 'new_admin_flag'), 'new_admin_flag');
  assert.equal(labels.find('sensitiveCategoryFlags', 'new_admin_flag'), null);
  assert.equal(labels.label('primaryGoal', 'grow_somehow'), 'grow_somehow');
  assert.equal(labels.label('paidMediaBudgetRange', 'around INR 8k a month'), 'around INR 8k a month');
  assert.equal(labels.label('unservedField', 'some_value'), 'some_value');
});

test('until the options load, an answer shows as itself and nothing is found', () => {
  const empty = createWizardOptionLabels(undefined);
  assert.equal(empty.label('primaryGoal', 'revenue_growth'), 'revenue_growth');
  assert.equal(empty.find('primaryGoal', 'revenue_growth'), null);
  assert.equal(empty.list('creativeCapabilities', ['video']), 'video');
});

test('an unanswered field reads as nothing', () => {
  assert.equal(labels.label('primaryGoal', undefined), null);
  assert.equal(labels.label('primaryGoal', null), null);
  assert.equal(labels.label('primaryGoal', ''), null);
  assert.equal(labels.label('primaryGoal', '   '), null);
  assert.equal(labels.list('creativeCapabilities', []), null);
  assert.equal(labels.list('creativeCapabilities', undefined), null);
});

test('several answers read as their labels, joined', () => {
  assert.equal(labels.list('creativeCapabilities', ['video', 'copywriting']), 'Video, Copywriting');
  assert.equal(labels.list('creativeCapabilities', ['none']), 'None of these');
  assert.equal(labels.list('sensitiveCategoryFlags', ['education_claims', 'none']), 'Education claims, None');
  assert.equal(labels.list('sensitiveCategoryFlags', ['new_admin_flag']), 'new_admin_flag');
});

test("a market's own list reads first, then the global one, then any other market's", () => {
  assert.equal(labels.label('salesChannels', 'other_marketplace', 'IN'), 'Another marketplace');
  assert.equal(labels.label('salesChannels', 'other_marketplace', 'GB'), 'A marketplace');
  assert.equal(labels.label('salesChannels', 'other_marketplace'), 'A marketplace');
  assert.equal(labels.label('salesChannels', 'flipkart', 'GB'), 'Flipkart');
  assert.equal(labels.label('socialPlatforms', 'twitter'), 'X (Twitter)');
  assert.equal(labels.label('presenceLinkTypes', 'google_business', 'IN'), 'Google Business profile');
  assert.equal(labels.list('peakSeasons', ['diwali'], 'IN'), 'Diwali');
  // A presence link saved under an older type reads as its current type,
  // and a social one by its platform (A7).
  assert.equal(labels.label('presenceLinkTypes', 'flipkart', 'IN'), 'Marketplace listing');
  assert.equal(labels.label('presenceLinkTypes', 'whatsapp', 'IN'), 'Other');
  assert.equal(labels.label('presenceLinkTypes', 'instagram', 'IN'), 'Instagram');
});

test('the frontend keeps no local copy of a list the backend serves (V3-03)', () => {
  const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const types = read('shared/types/wizard.ts');
  for (const name of [
    'MARKETING_TARGET_TYPE_LABELS',
    'SOURCE_TYPE_LABELS',
    'AUDIENCE_MODEL_LABELS',
    'PRIMARY_GOAL_LABELS',
    'MARKETING_HANDLER_LABELS',
    'CONTENT_CAPACITY_LABELS',
    'SENSITIVE_CATEGORY_FLAG_LABELS',
    'SALES_CHANNEL_LABELS',
    'MONTHLY_MARKETING_SPEND_LABELS',
    'PAID_MEDIA_BUDGET_RANGE_LABELS',
    'MARKETING_HOURS_PER_WEEK_LABELS',
    'PAYBACK_WINDOW_LABELS',
    'EMAIL_LIST_SIZE_LABELS',
    'MONTHLY_WEBSITE_TRAFFIC_LABELS',
  ]) {
    assert.doesNotMatch(types, new RegExp(`\\b${name}\\b`), `${name} is served by the backend`);
  }
  const wizard = read('shared/components/campaigns/CampaignWizardModal.tsx');
  assert.doesNotMatch(wizard, /_FALLBACK_OPTIONS\b/);
  assert.doesNotMatch(wizard, /\bformat(PrimaryGoal|MarketingHandler|ContentCapacity|SourceType|SalesChannel)\(/);
});

test('an industry an earlier draft holds reads by its served label, never its key (V3-125)', () => {
  const labels = createWizardOptionLabels({
    fieldOptions: {
      industryCategory: [option('healthcare_clinics', 'Healthcare & clinics')],
      industryCategoryEarlier: [option('healthcare_wellness', 'Healthcare & wellness')],
    },
    marketLists: {},
  });
  assert.equal(labels.find('industryCategory', 'healthcare_clinics'), 'Healthcare & clinics');
  assert.equal(labels.find('industryCategory', 'healthcare_wellness'), 'Healthcare & wellness');
  assert.equal(labels.label('industryCategory', 'healthcare_wellness'), 'Healthcare & wellness');
  // The earlier labels name a saved answer; they are not another field's.
  assert.equal(labels.find('audienceModel', 'healthcare_wellness'), null);
});
