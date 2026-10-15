import type { ID, ISODateTime } from './common';
import type { BusinessModel, BusinessType, CampaignStatus, MarketScope } from './campaign';
import type { MoneyAnswer } from './money';

export type WizardStepKey = 'STEP_1' | 'STEP_2' | 'STEP_3' | 'STEP_4' | 'STEP_5' | 'STEP_6' | 'STEP_7';

export interface WizardStepState {
  campaignId: ID;
  stepKey: WizardStepKey;
  data: Record<string, unknown>;
  updatedAt: ISODateTime;
  version?: number;
}

export const MARKETING_TARGET_TYPE_VALUES = [
  'whole_business',
  'product_or_service',
  'launch',
  'market_expansion',
  'specific_audience',
  'other',
] as const;

export type MarketingTargetType = (typeof MARKETING_TARGET_TYPE_VALUES)[number];

export const SOURCE_TYPE_VALUES = [
  'website',
  'digital_presence_only',
  'manual_only',
] as const;

export type SourceType = (typeof SOURCE_TYPE_VALUES)[number];

export const AUDIENCE_MODEL_VALUES = [
  'single_sided',
  'b2b2c',
  'marketplace_platform',
  'multi_sided',
  'unknown',
] as const;

export type AudienceModel = (typeof AUDIENCE_MODEL_VALUES)[number];

export const LIFECYCLE_STAGE_VALUES = [
  'pre_launch',
  'launch',
  'growth',
  'scaling',
  'mature',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGE_VALUES)[number];

export const LANGUAGE_VALUES = [
  'english',
  'hindi',
  'regional_other',
  'mixed',
  'unknown',
] as const;

export type Language = (typeof LANGUAGE_VALUES)[number];

export const REPORT_LANGUAGE_VALUES = [
  'english',
  'hindi',
  'regional_other',
] as const;

export type ReportLanguage = (typeof REPORT_LANGUAGE_VALUES)[number];

// Every channel any market offers (v3 V3-43); which ones a campaign is
// offered is its market's list, served by the backend.
export const SALES_CHANNEL_VALUES = [
  'own_website',
  'amazon',
  'flipkart',
  'meesho',
  'myntra',
  'nykaa',
  'quick_commerce',
  'ebay',
  'etsy',
  'tiktok_shop',
  'instagram',
  'whatsapp',
  'retail_store',
  'justdial',
  'google_business',
  'facebook',
  'other_marketplace',
  'direct_sales',
  'other',
] as const;

export type SalesChannel = (typeof SALES_CHANNEL_VALUES)[number];

// The band answer before v3 (the budget amount replaces it), with the one
// "Don't know" the backend serves; a saved `not_sure` loads as `unknown`.
export const MONTHLY_MARKETING_SPEND_VALUES = [
  'nothing',
  'under_5k',
  '5k_15k',
  '15k_50k',
  '50k_plus',
  'unknown',
] as const;

export type MonthlyMarketingSpend = (typeof MONTHLY_MARKETING_SPEND_VALUES)[number];

export const PRIMARY_CONVERSION_PATH_VALUES = [
  'buy_online',
  'book_demo',
  'book_call',
  'whatsapp',
  'retail_visit',
  'app_signup',
  'other',
] as const;

export type PrimaryConversionPath = (typeof PRIMARY_CONVERSION_PATH_VALUES)[number];

// The v3 goals the backend serves (V3-14). An older goal is read as one of
// these through LEGACY_WIZARD_VALUES.
export const PRIMARY_GOAL_VALUES = [
  'revenue_growth',
  'new_customers',
  'leads',
  'awareness',
  'launch',
  'repeat_purchase_retention',
  'footfall',
  'market_expansion',
  'other',
] as const;

export type PrimaryGoal = (typeof PRIMARY_GOAL_VALUES)[number];

// Who handles marketing, as the backend serves it (V3-23). An older owner is
// read as one of these through LEGACY_WIZARD_VALUES.
export const MARKETING_HANDLER_VALUES = [
  'founder_led',
  'in_house_marketer',
  'in_house_team',
  'agency',
  'freelancer',
  'nobody_yet',
] as const;

export type MarketingHandler = (typeof MARKETING_HANDLER_VALUES)[number];

export const MONTHLY_REVENUE_VALUES = [
  'under_25k',
  '25k_1l',
  '1l_5l',
  '5l_25l',
  '25l_plus',
] as const;

export type MonthlyRevenue = (typeof MONTHLY_REVENUE_VALUES)[number];

/**
 * Deal value, gross margin and close rate, asked as bands.
 *
 * The free-text economics fields shipped `not_sure` on the last run and the
 * backend validator invited it by name. An owner knows their band without
 * going to look it up, and a band is all the unit economics model needs.
 *
 * Deal value and margin have no opt-out. Close rate keeps `not_tracked`,
 * because a pre-CRM client has no honest answer and the model sweeps it as a
 * sensitivity axis instead of assuming one.
 */
export const DEAL_VALUE_BAND_VALUES = [
  'under_10k',
  'from_10k_to_50k',
  'from_50k_to_2l',
  'from_2l_to_10l',
  'from_10l_to_50l',
  'above_50l',
] as const;

export type DealValueBand = (typeof DEAL_VALUE_BAND_VALUES)[number];

export const GROSS_MARGIN_BAND_VALUES = [
  'under_20_percent',
  'from_20_to_40_percent',
  'from_40_to_60_percent',
  'from_60_to_80_percent',
  'above_80_percent',
] as const;

export type GrossMarginBand = (typeof GROSS_MARGIN_BAND_VALUES)[number];

export const CLOSE_RATE_BAND_VALUES = [
  'under_5_percent',
  'from_5_to_15_percent',
  'from_15_to_30_percent',
  'from_30_to_50_percent',
  'above_50_percent',
  'not_tracked',
] as const;

export type CloseRateBand = (typeof CLOSE_RATE_BAND_VALUES)[number];

// v3 (A5): a subscription is its own question; an answer saved as one is
// read by the backend as most customers coming back.
export const AVG_CUSTOMER_RETENTION_VALUES = [
  'one_time_buyers',
  'some_repeat',
  'mostly_repeat',
  'unknown',
] as const;

export type AvgCustomerRetention = (typeof AVG_CUSTOMER_RETENTION_VALUES)[number];

export const REPEAT_PURCHASE_FREQUENCY_VALUES = [
  'never',
  'every_few_months',
  'monthly',
  'weekly',
  'unknown',
] as const;

export type RepeatPurchaseFrequency = (typeof REPEAT_PURCHASE_FREQUENCY_VALUES)[number];

// V3-65: bands that follow what each size allows - retargeting from about
// 10k visits, A/B testing from about 50k, conversion work its own programme
// above 1M. The backend reads an answer saved as the old "50000_plus" as
// 50k-250k.
export const MONTHLY_WEBSITE_TRAFFIC_VALUES = [
  'under_500',
  '500_2000',
  '2000_10000',
  '10000_50000',
  '50000_250000',
  '250000_1000000',
  '1000000_plus',
  'unknown',
] as const;

export type MonthlyWebsiteTraffic = (typeof MONTHLY_WEBSITE_TRAFFIC_VALUES)[number];

export const SOCIAL_PLATFORM_VALUES = [
  'instagram',
  'facebook',
  'youtube',
  'twitter',
  'tiktok',
  'pinterest',
  'threads',
  'snapchat',
  'linkedin',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORM_VALUES)[number];

// v3 (V3-43): every presence-link type any market serves; a new link is
// offered its market's list. A link saved under an older type loads as its
// current one (withCurrentPresenceLinks).
export const DIGITAL_PRESENCE_LINK_TYPE_VALUES = [
  'amazon',
  'marketplace_listing',
  'google_business',
  'google_reviews',
  'trustpilot',
  'zomato_swiggy',
  'practo',
  'app_store',
  'other',
] as const;

export type DigitalPresenceLinkType = (typeof DIGITAL_PRESENCE_LINK_TYPE_VALUES)[number];

// V3-65: still building below about 2k contacts, segments from 10k,
// lifecycle (CRM) work from 50k. The backend reads an answer saved as the old
// "10000_plus" as 10k-50k.
export const EMAIL_LIST_SIZE_VALUES = [
  'none',
  'under_500',
  '500_2000',
  '2000_10000',
  '10000_50000',
  '50000_250000',
  '250000_plus',
  'unknown',
] as const;

export type EmailListSize = (typeof EMAIL_LIST_SIZE_VALUES)[number];

// The labels of every answer the backend lists live in the wizard options
// response (`GET /api/v2/wizard/options`); read them with
// `createWizardOptionLabels` (V3-03). The lists below are the answers the
// backend serves no list for: the monthly revenue band older campaigns hold,
// and the deal value, gross margin and close rate bands.

export const MONTHLY_REVENUE_LABELS: Record<MonthlyRevenue, string> = {
  under_25k: 'Under INR 25,000',
  '25k_1l': 'INR 25,000 to INR 1 lakh',
  '1l_5l': 'INR 1 lakh to INR 5 lakh',
  '5l_25l': 'INR 5 lakh to INR 25 lakh',
  '25l_plus': 'Above INR 25 lakh',
};

export const DEAL_VALUE_BAND_LABELS: Record<DealValueBand, string> = {
  under_10k: 'Under INR 10,000',
  from_10k_to_50k: 'INR 10,000 to INR 50,000',
  from_50k_to_2l: 'INR 50,000 to INR 2 lakh',
  from_2l_to_10l: 'INR 2 lakh to INR 10 lakh',
  from_10l_to_50l: 'INR 10 lakh to INR 50 lakh',
  above_50l: 'Above INR 50 lakh',
};

export const GROSS_MARGIN_BAND_LABELS: Record<GrossMarginBand, string> = {
  under_20_percent: 'Under 20%',
  from_20_to_40_percent: '20% to 40%',
  from_40_to_60_percent: '40% to 60%',
  from_60_to_80_percent: '60% to 80%',
  above_80_percent: 'Above 80%',
};

export const CLOSE_RATE_BAND_LABELS: Record<CloseRateBand, string> = {
  under_5_percent: 'Under 5%',
  from_5_to_15_percent: '5% to 15%',
  from_15_to_30_percent: '15% to 30%',
  from_30_to_50_percent: '30% to 50%',
  above_50_percent: 'Above 50%',
  not_tracked: 'We do not track this yet',
};

export const MONTHLY_REVENUE_OPTIONS = MONTHLY_REVENUE_VALUES.map((value) => ({
  value,
  label: MONTHLY_REVENUE_LABELS[value],
}));

export const DEAL_VALUE_BAND_OPTIONS = DEAL_VALUE_BAND_VALUES.map((value) => ({
  value,
  label: DEAL_VALUE_BAND_LABELS[value],
}));

export const GROSS_MARGIN_BAND_OPTIONS = GROSS_MARGIN_BAND_VALUES.map((value) => ({
  value,
  label: GROSS_MARGIN_BAND_LABELS[value],
}));

export const CLOSE_RATE_BAND_OPTIONS = CLOSE_RATE_BAND_VALUES.map((value) => ({
  value,
  label: CLOSE_RATE_BAND_LABELS[value],
}));

/** `revenueGrowth` and `revenue-growth` -> `revenue_growth`: the form option values are compared in. */
export function toWizardToken(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/**
 * The token an answer is matched by: its snake_case form, with the earlier
 * not-sure answers read as the one "Don't know" the backend serves (`unknown`).
 */
function toWizardMatchKey(value: string): string {
  const token = toWizardToken(value);
  return token === 'not_sure' ? 'unknown' : token;
}

function formatWizardEnumValue<T extends string>(
  value: T | null | undefined,
  labels: Record<string, string>,
) {
  if (!value) {
    return null;
  }

  // A value saved in another spelling (camelCase from the backend) still finds its label.
  return labels[value] ?? labels[toWizardMatchKey(value)] ?? value;
}

export function formatMonthlyRevenue(value: MonthlyRevenue | string | null | undefined) {
  return formatWizardEnumValue(value, MONTHLY_REVENUE_LABELS);
}

/**
 * Saved answers under a name the backend no longer serves, by field, keyed by
 * match key (snake_case, `not_sure` as `unknown`): what the backend saves
 * some answers as (wizard-v2.service.ts maps them on save), the names v3
 * renamed, and the v1 goals and owners (V3-77). The backend reads them the
 * same way (adcendy-be-v4 `src/wizard-v2/wizard-legacy-values-v2.ts`) and
 * backfills them. A saved answer is read as its current value before its label
 * is looked up, and before a reopened step loads it, so a saved campaign reads
 * the same as the dropdown did.
 */
export const LEGACY_WIZARD_VALUES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  marketingTargetType: {
    product_service: 'product_or_service',
  },
  audienceModel: {
    single_audience: 'single_sided',
    business_and_end_customer: 'b2b2c',
    marketplace_two_sided: 'marketplace_platform',
  },
  primaryGoal: {
    // v3 renames (V3-14).
    lead_generation: 'leads',
    retention: 'repeat_purchase_retention',
    launch_readiness: 'launch',
    // v1 goals (V3-77).
    more_sales: 'revenue_growth',
    more_customers: 'new_customers',
    new_market: 'market_expansion',
    launch_product: 'launch',
    brand_awareness: 'awareness',
    beat_competitor: 'new_customers',
    reduce_channel_dependence: 'other',
  },
  marketingHandler: {
    // v3 renames (V3-23); `unknown` also matches a saved `not_sure`.
    internal_marketer: 'in_house_marketer',
    unknown: 'nobody_yet',
    // v1 owners (V3-77).
    self: 'founder_led',
    team_member: 'in_house_marketer',
    freelancer_agency: 'agency',
    nobody: 'nobody_yet',
  },
  monthlyWebsiteTraffic: {
    '50000_plus': '50000_250000',
  },
  emailListSize: {
    '10000_plus': '10000_50000',
  },
  presenceLinkTypes: {
    flipkart: 'marketplace_listing',
    other_marketplace: 'marketplace_listing',
    whatsapp: 'other',
  },
};

/**
 * A saved answer as its current value: a legacy name read as the value it
 * became, a not-sure answer as `unknown`, anything else as saved.
 */
export function toCurrentWizardValue(field: string, value: string): string {
  const raw = value.trim();
  if (!raw) {
    return raw;
  }
  const key = toWizardMatchKey(raw);
  return LEGACY_WIZARD_VALUES[field]?.[key] ?? (key === 'unknown' ? 'unknown' : raw);
}

/** Presence-link types that are social profiles, saved before v3 (A7). */
const SOCIAL_PRESENCE_LINK_TYPES: ReadonlySet<string> = new Set([
  'instagram',
  'facebook',
  'youtube',
  'twitter',
  'linkedin',
]);

/**
 * Saved presence links and social handles with every link of an older type
 * read as a current one, as the backend reads them (v3 A7, V3-43): a social
 * profile becomes that platform's handle, one per platform, and a second link
 * for a platform that has one stays as an Other link named for it; a
 * marketplace is a marketplace listing and WhatsApp is Other, each keeping
 * its name. Nothing the client gave is dropped.
 */
export function withCurrentPresenceLinks(
  links: readonly DigitalPresenceLink[],
  handles: readonly SocialHandle[],
  nameOf: (legacyType: string) => string = (legacyType) => legacyType,
): { digitalPresenceLinks: DigitalPresenceLink[]; socialHandles: SocialHandle[] } {
  const socialHandles = [...handles];
  const platforms = new Set(socialHandles.map((entry) => toWizardToken(String(entry.platform ?? ''))));
  const digitalPresenceLinks: DigitalPresenceLink[] = [];
  for (const link of links) {
    const type = toWizardToken(String(link.type ?? ''));
    const label = link.label?.trim() ? link.label : null;
    if (SOCIAL_PRESENCE_LINK_TYPES.has(type)) {
      if (!platforms.has(type)) {
        socialHandles.push({ platform: type as SocialPlatform, handle: link.url });
        platforms.add(type);
      } else {
        digitalPresenceLinks.push({ ...link, type: 'other', label: label ?? nameOf(type) });
      }
      continue;
    }
    const renamed = LEGACY_WIZARD_VALUES.presenceLinkTypes[type];
    if (renamed) {
      digitalPresenceLinks.push({
        ...link,
        type: renamed as DigitalPresenceLinkType,
        // "Another marketplace" names nothing a listing does not.
        label: label ?? (type === 'other_marketplace' ? link.label : nameOf(type)),
      });
      continue;
    }
    digitalPresenceLinks.push(link);
  }
  return { digitalPresenceLinks, socialHandles };
}

/** The fields whose lists are a market's own (v3 V3-43), under `marketLists`. */
const MARKET_LIST_FIELDS = ['salesChannels', 'socialPlatforms', 'presenceLinkTypes', 'peakSeasons'] as const;
type WizardMarketListField = (typeof MARKET_LIST_FIELDS)[number];

function isMarketListField(field: string): field is WizardMarketListField {
  return (MARKET_LIST_FIELDS as readonly string[]).includes(field);
}

type WizardLabelIndex = Map<string, string>;

function indexOptionLabels(options: unknown): WizardLabelIndex {
  const index: WizardLabelIndex = new Map();
  if (!Array.isArray(options)) {
    return index;
  }
  for (const option of options) {
    if (!option || typeof option !== 'object') continue;
    const { value, label, canonicalToken } = option as Partial<WizardFieldOptionV2>;
    if ((typeof value !== 'string' && typeof value !== 'boolean') || typeof label !== 'string' || !label) {
      continue;
    }
    for (const key of [String(value), canonicalToken]) {
      if (typeof key === 'string' && key && !index.has(toWizardMatchKey(key))) {
        index.set(toWizardMatchKey(key), label);
      }
    }
  }
  return index;
}

export interface WizardOptionLabels {
  /**
   * The backend's label of an answer, or null when the options response has
   * none (not loaded yet, or a value it does not list). A market-list field
   * reads that market's list first, then the global and the other markets'.
   */
  find(field: string, value: unknown, market?: string | null): string | null;
  /** The backend's label of an answer; the answer itself when it has none; null when unanswered. */
  label(field: string, value: unknown, market?: string | null): string | null;
  /** Several answers' labels, joined; null when none was given. */
  list(field: string, values: unknown, market?: string | null): string | null;
}

/**
 * Every wizard answer by the label the backend serves for it in the options
 * response (`fieldOptions`, and `marketLists` for a market's own lists): the
 * one source of option labels (V3-03). A value with no label shows as itself,
 * never as a label kept here.
 */
/**
 * Labels the backend serves for answers it no longer offers but a saved draft
 * can still hold (V3-125): a campaign answered before V3-40 holds an industry's
 * guidance category ("healthcare_wellness"), served under its own field so
 * the wizard does not offer it.
 */
const EARLIER_ANSWER_FIELDS: Readonly<Record<string, string>> = {
  industryCategory: 'industryCategoryEarlier',
};

export function createWizardOptionLabels(
  options: Pick<WizardOptionsResponseV2, 'fieldOptions' | 'marketLists'> | null | undefined,
): WizardOptionLabels {
  const fieldIndexes = new Map<string, WizardLabelIndex>();
  for (const [field, fieldOptions] of Object.entries(options?.fieldOptions ?? {})) {
    fieldIndexes.set(field, indexOptionLabels(fieldOptions));
  }
  const marketLists = options?.marketLists ?? {};
  const marketIndexes = new Map<string, Map<WizardMarketListField, WizardLabelIndex>>();
  for (const [market, lists] of Object.entries(marketLists)) {
    marketIndexes.set(
      market,
      new Map(MARKET_LIST_FIELDS.map((field) => [field, indexOptionLabels(lists?.[field])])),
    );
  }
  const marketOrder = (market?: string | null) => {
    const others = Object.keys(marketLists).filter((code) => code !== market && code !== 'global');
    return [market, 'global', ...others].filter((code): code is string => Boolean(code));
  };

  const find = (field: string, value: unknown, market?: string | null): string | null => {
    if ((typeof value !== 'string' && typeof value !== 'boolean') || value === '') {
      return null;
    }
    const raw = String(value).trim();
    if (!raw) {
      return null;
    }
    const key = toWizardMatchKey(LEGACY_WIZARD_VALUES[field]?.[toWizardMatchKey(raw)] ?? raw);
    if (isMarketListField(field)) {
      for (const code of marketOrder(market)) {
        const found = marketIndexes.get(code)?.get(field)?.get(key);
        if (found) return found;
      }
      // A social profile saved as a presence link (before v3 A7) is named
      // by its platform.
      return field === 'presenceLinkTypes' && SOCIAL_PRESENCE_LINK_TYPES.has(key)
        ? find('socialPlatforms', key, market)
        : null;
    }
    const earlierField = EARLIER_ANSWER_FIELDS[field];
    return (
      fieldIndexes.get(field)?.get(key) ??
      (earlierField ? (fieldIndexes.get(earlierField)?.get(key) ?? null) : null)
    );
  };

  const label = (field: string, value: unknown, market?: string | null): string | null => {
    const found = find(field, value, market);
    if (found) return found;
    if (typeof value === 'boolean') return String(value);
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };

  const list = (field: string, values: unknown, market?: string | null): string | null => {
    if (!Array.isArray(values)) {
      return null;
    }
    const labels = values
      .map((value) => label(field, value, market))
      .filter((entry): entry is string => Boolean(entry));
    return labels.length ? labels.join(', ') : null;
  };

  return { find, label, list };
}

/**
 * Paid media budget, asked as the monthly-spend bands plus "not sure".
 *
 * This was free text, and a blank answer was quietly filled in with the
 * monthly marketing spend. That is the whole marketing budget rather than the
 * paid-ads part of it, and the backend took the copy at face value.
 */
export const PAID_MEDIA_BUDGET_RANGE_VALUES = [
  'nothing',
  'under_5k',
  '5k_15k',
  '15k_50k',
  '50k_plus',
  'unknown',
] as const;

export type PaidMediaBudgetRange = (typeof PAID_MEDIA_BUDGET_RANGE_VALUES)[number];

/**
 * The Wizard v2.1 capacity and payback questions.
 *
 * The backend serves these lists from `GET /api/v2/wizard/options` under the
 * same keys, with the values in camelCase exactly as written here, and expects
 * them back unchanged. It keeps all four optional so a draft begun before they
 * existed still commits; the form asks them anyway.
 */
export const MARKETING_HOURS_PER_WEEK_VALUES = [
  'underFive',
  'fiveToTen',
  'tenToTwenty',
  'twentyToForty',
  'fortyPlus',
  'unknown',
] as const;

export type MarketingHoursPerWeek = (typeof MARKETING_HOURS_PER_WEEK_VALUES)[number];

export const CREATIVE_CAPABILITY_VALUES = [
  'video',
  'photography',
  'copywriting',
  'design',
  'none',
] as const;

export type CreativeCapability = (typeof CREATIVE_CAPABILITY_VALUES)[number];

export const PAYBACK_WINDOW_VALUES = [
  'firstOrder',
  'withinThreeMonths',
  'withinSixMonths',
  'withinTwelveMonths',
  'longerThanTwelveMonths',
  'unknown',
] as const;

export type PaybackWindow = (typeof PAYBACK_WINDOW_VALUES)[number];


/** "None of these" is an answer of its own, so it never sits beside a capability. */
const NO_CREATIVE_CAPABILITY: CreativeCapability = 'none';

/**
 * Selecting "None of these" clears the other choices; selecting any other
 * choice clears "None of these". Selecting a chosen value unselects it.
 */
export function toggleCreativeCapability(selected: readonly string[], value: string): string[] {
  if (selected.includes(value)) {
    return selected.filter((item) => item !== value);
  }

  if (value === NO_CREATIVE_CAPABILITY) {
    return [value];
  }

  return [...selected.filter((item) => item !== NO_CREATIVE_CAPABILITY), value];
}

/**
 * Known capabilities only, once each, with "none" dropped when a real
 * capability is also present - the reading the backend applies on commit.
 */
export function normalizeCreativeCapabilities(
  value: unknown,
  allowedValues: readonly string[] = CREATIVE_CAPABILITY_VALUES,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const known = Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => allowedValues.includes(item)),
    ),
  );

  return known.length > 1 ? known.filter((item) => item !== NO_CREATIVE_CAPABILITY) : known;
}

export interface RankedSalesChannel {
  channel: SalesChannel;
  rank: number;
  customName?: string | null;
  /** v3 P6: roughly what share of sales the channel brings (a band). */
  salesShare?: string | null;
}

export interface SocialHandle {
  platform: SocialPlatform;
  handle: string;
}

export interface DigitalPresenceLink {
  type: DigitalPresenceLinkType;
  url: string;
  label?: string | null;
}

export interface WizardPreviewCampaign {
  id: ID;
  title: string;
  status: CampaignStatus;
  websiteUrl?: unknown | null;
}

export interface WizardPreviewStep1 {
  title?: string;
  marketingTargetType?: MarketingTargetType | null;
  focusName?: string;
  sourceType?: SourceType | null;
  primaryUrl?: string | null;
  targetMarkets?: string[];
  primaryMarket?: string | null;
  marketScope?: MarketScope | string | null;
  operationalLocations?: string[];
  regionalLanguageExpansionEnabled?: boolean;
  regionalLanguages?: string[];
  marketLocation?: string;
  /** v3: the currency every amount is given in. */
  currency?: string | null;
}

export interface WizardPreviewStep2 {
  businessName?: string | null;
  industryCategory?: string | null;
  businessType?: BusinessType | null;
  businessModel?: BusinessModel | null;
  /** v3: who the business sells to and how; the model is derived from them. */
  sellsTo?: string | null;
  sellsVia?: string | null;
  audienceModel?: AudienceModel | string | null;
  lifecycleStage?: LifecycleStage | string | null;
  marketScope?: MarketScope | null;
  businessDescription?: string;
  productCategory?: string;
  productOrService?: string | string[];
  productsServices?: string[];
  offerSummary?: string;
  priceRange?: string;
  priceRangeLow?: MoneyAnswer | null;
  priceRangeHigh?: MoneyAnswer | null;
  differentiators?: string[];
  sensitiveCategoryFlags?: string[];
  complianceSensitiveClaims?: string[];
  salesChannels?: RankedSalesChannel[];
  primaryConversionPath?: PrimaryConversionPath | string | null;
  socialHandles?: SocialHandle[];
  digitalPresenceLinks?: DigitalPresenceLink[];
}

export interface WizardPreviewStep3 {
  primaryTargetSegment?: string;
  targetPersona?: string;
  targetAudience?: string | null;
  audienceSegments?: string[];
  language?: Language | string;
  reportLanguage?: ReportLanguage | string | null;
  painPoints?: string[];
  desiredOutcome?: string;
  decisionProcess?: string;
  buyerRoles?: string[];
}

export interface WizardPreviewStep4 {
  constraints?: string[];
  trustSignals?: string[];
  monthlyMarketingSpend?: MonthlyMarketingSpend;
  paidMediaBudgetRange?: string | null;
  /** v3: the whole monthly budget, and how much of it goes to ads. */
  monthlyMarketingBudget?: MoneyAnswer | null;
  paidAdsShare?: string | null;
  pastMarketing?: string | null;
  primaryGoal?: PrimaryGoal;
  marketingHandler?: MarketingHandler;
  contentCapacity?: string | null;
  marketingHoursPerWeek?: MarketingHoursPerWeek | string | null;
  creativeCapabilities?: string[] | null;
  salesCapacity?: string | null;
  currentMarketingActivity?: Array<{
    channel: string;
    /** V3-154: the catalogue channel picked from the list, or "other". */
    channelId?: string | null;
    status: string;
    workingAssessment?: string | null;
    evidence?: string | null;
    monthlySpend?: string | null;
    monthlySpendAmount?: MoneyAnswer | null;
    timeRunning?: string | null;
    reasonStopped?: string | null;
    /** v3 P6: this channel's share of the spend (a band). */
    shareOfSpend?: string | null;
  }>;
  averageOrderValue?: string | null;
  averageOrderValueAmount?: MoneyAnswer | null;
  typicalDealValue?: MoneyAnswer | null;
  monthlyRevenueAmount?: MoneyAnswer | null;
  averageContractValue?: string | null;
  grossMarginPercentage?: string | null;
  whatsWorking?: string | null;
  biggestFrustration?: string | null;
  monthlyRevenue?: MonthlyRevenue | string | null;
  monthlyOrderVolume?: string | null;
  productCost?: string | null;
  monthlyOrdersPerSubscriber?: string | null;
  monthlyChurnRate?: string | null;
  avgCustomerRetention?: AvgCustomerRetention | null;
  repeatPurchaseFrequency?: RepeatPurchaseFrequency | null;
  salesCycleLength?: string | null;
  paybackWindow?: PaybackWindow | string | null;
  googleAnalyticsConnected?: boolean | 'unknown';
  monthlyWebsiteTraffic?: MonthlyWebsiteTraffic | null;
  emailListSize?: EmailListSize | null;
  knownCompetitorStatus?: string | null;
  knownCompetitors?: string[] | null;
  channelsToAvoid?: string[] | null;
  channelsStronglyPreferred?: string[] | null;
  executionConstraints?: string[] | null;
  additionalContext?: string | null;
}

export interface WizardDerivedMetrics {
  estimatedCAC?: string | number | null;
  estimatedCac?: string | number | null;
  estimatedMarginPerUnit?: string | number | null;
  estimated_margin_per_unit?: string | number | null;
  estimatedCLTV?: string | number | null;
  estimatedCltv?: string | number | null;
  cacCltvRatio?: string | number | null;
  cac_cltv_ratio?: string | number | null;
  budgetCategory?: string | null;
  budget_category?: string | null;
  executionCapacity?: string | null;
  execution_capacity?: string | null;
  primaryChannelDependency?: string | null;
  primary_channel_dependency?: string | null;
  [key: string]: unknown;
}

/** An answer the client skipped or did not know (v3 P2), for the review. */
export interface WizardIntakeGap {
  step: number;
  field: string;
  label: string;
  reason: 'unknown' | 'not_answered';
}

export interface WizardPreview {
  campaign: WizardPreviewCampaign;
  steps: {
    step1?: WizardPreviewStep1;
    step2?: WizardPreviewStep2;
    step3?: WizardPreviewStep3;
    step4?: WizardPreviewStep4;
  };
  derived?: WizardDerivedMetrics | null;
  gaps?: WizardIntakeGap[];
}

export interface SaveWizardStepPayload {
  data: Record<string, unknown>;
  version?: number;
}

export type PipelineRunStatusV2 =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED_AWAITING_REVIEW';

export type WizardStateStatusV2 =
  | 'in_progress'
  | 'pending_review'
  | 'committed'
  | 'committed_blocked_data_consent';

export interface ValidationIssueV2 {
  code: string;
  message: string;
  path: string[];
  severity: 'error' | 'warn';
}

export interface WizardFieldOptionV2 {
  value: string | boolean;
  label: string;
  canonicalToken?: string;
  /** A market's usual currency (v3 P4). */
  defaultCurrency?: string;
  /** A market's tier: curated or global (v3 P4). */
  marketTier?: string;
  /** A line saying what the option covers (v3 V3-40). */
  hint?: string;
}

export interface WizardStepDefinitionV2 {
  stepNumber: number;
  stepKey: string;
  label: string;
  helperText: string;
  examples: string[];
}

/** A market's own lists (v3 V3-43): a curated market's, or the global ones. */
export interface WizardMarketListV2 {
  salesChannels: { value: string; label: string }[];
  socialPlatforms: { value: string; label: string; businessOnly?: boolean }[];
  presenceLinkTypes: { value: string; label: string }[];
  peakSeasons: { value: string; label: string }[];
  competitorPlaceholder: string;
  complianceRegime: string | null;
}

export interface WizardOptionsResponseV2 {
  wizardVersion: string;
  stepDefinitions: WizardStepDefinitionV2[];
  fieldOptions: Record<string, WizardFieldOptionV2[]>;
  /** Keyed by curated market code and `global` (v3 V3-43). */
  marketLists?: Record<string, WizardMarketListV2>;
  /** V3-158: markets where each list's marketing consent is asked (UK, EU, EEA). */
  marketingConsentMarkets?: string[];
}

export interface WizardStateResponseV2 {
  campaignId: string;
  status: WizardStateStatusV2;
  version: number;
  lastCompletedStep: number;
  committedSnapshotId: string | null;
  updatedAt: string | null;
  run?: {
    runId: string;
    status: PipelineRunStatusV2;
    statusUrl: string;
    attemptNumber: number;
    updatedAt: string;
  } | null;
  steps: {
    step1: Record<string, unknown> | null;
    step2: Record<string, unknown> | null;
    step3: Record<string, unknown> | null;
    step4: Record<string, unknown> | null;
    step5: Record<string, unknown> | null;
    step6: Record<string, unknown> | null;
    step7: Record<string, unknown> | null;
  };
  gaps?: WizardIntakeGap[];
}

export interface WizardCommitResponseV2 {
  pipelineRunId: string | null;
  pipelineStatus: PipelineRunStatusV2 | null;
  run?: {
    campaignId: string;
    runId: string;
    status: PipelineRunStatusV2;
    statusUrl: string;
  } | null;
  normalizationRecordId: string;
  wizardSnapshotId: string;
  reviewerTasks: Array<{
    id: string;
    failureMode: string;
  }>;
  wizardState: WizardStateResponseV2;
  commitAccepted: true;
  dataConsentOptIn: boolean;
  readyToGenerate: boolean;
  blockedByDataConsent: boolean;
  generationTriggered: boolean;
  normalizedContracts: Record<string, unknown>;
  taxonomy: {
    values: {
      sales_motion: string;
      customer_type: string;
      demand_capture_mode: string;
      purchase_consideration: string;
      market_geography: string;
      product_type: string;
      distribution_model: string;
      lifecycle_stage: string;
      industry_category: string;
    };
    confidence_score: number;
    low_confidence_dimensions: string[];
    evidence: Record<string, string[]>;
  };
  contextSufficiency: {
    missing_fields: string[];
    sufficient: boolean;
  };
  validationWarnings: ValidationIssueV2[];
}
