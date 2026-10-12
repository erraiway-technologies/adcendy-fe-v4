import {
  CLOSE_RATE_BAND_OPTIONS,
  createWizardOptionLabels,
  GROSS_MARGIN_BAND_OPTIONS,
  type WizardOptionLabels,
  type WizardOptionsResponseV2,
} from '../../shared/types/wizard.ts';

/**
 * V3-76: the campaign wizard E2E reads every option label from
 * `GET /api/v2/wizard/options`, as the wizard does, so a label changed in the
 * backend seed is followed rather than breaking the run. Fixtures keep stored
 * values; this turns a value into the label the wizard offers it under.
 */

type WizardOptions = Pick<WizardOptionsResponseV2, 'fieldOptions' | 'marketLists'>;

/** The lists the wizard reads from the campaign market's `marketLists` entry. */
const MARKET_LIST_FIELDS = new Set(['salesChannels', 'socialPlatforms', 'presenceLinkTypes', 'peakSeasons']);

/** Repeatable-row controls, by their field path without the row index, and the list each reads. */
const ROW_CONTROL_OPTIONS: Record<string, string> = {
  'salesChannels.channel': 'salesChannels',
  'salesChannels.salesShare': 'salesShare',
  'socialHandles.platform': 'socialPlatforms',
  'digitalPresenceLinks.type': 'presenceLinkTypes',
  'currentMarketingActivity.status': 'currentMarketingActivityStatus',
  'currentMarketingActivity.workingAssessment': 'currentMarketingActivityAssessment',
  'currentMarketingActivity.shareOfSpend': 'shareOfSpend',
};

/**
 * Controls the options response does not serve: the wizard lists these
 * itself (the bands from `shared/types/wizard.ts`, the two yes/no-style
 * selects written in the wizard modal), so their labels are the wizard's.
 */
const WIZARD_OWN_OPTIONS: Record<string, ReadonlyArray<{ value: string; label: string }>> = {
  grossMarginBand: GROSS_MARGIN_BAND_OPTIONS,
  closeRateBand: CLOSE_RATE_BAND_OPTIONS,
  googleAnalyticsConnected: [
    { value: 'true', label: 'Connected' },
    { value: 'false', label: 'Not connected' },
    { value: 'unknown', label: "Don't know" },
  ],
  subscriptionOffered: [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
};

/** The options list a wizard control reads: `salesChannels.0.channel` -> `salesChannels`. */
export function optionsFieldForPath(fieldPath: string): string {
  const withoutRow = fieldPath.replace(/\.\d+\./, '.');
  return ROW_CONTROL_OPTIONS[withoutRow] ?? withoutRow;
}

/** The options response's body, with or without the `{ data }` envelope. */
export function unwrapWizardOptions(payload: unknown): WizardOptions {
  const body =
    payload && typeof payload === 'object' && 'data' in payload && !('fieldOptions' in payload)
      ? (payload as { data: unknown }).data
      : payload;
  if (!body || typeof body !== 'object' || typeof (body as WizardOptions).fieldOptions !== 'object') {
    throw new Error('GET /api/v2/wizard/options returned no fieldOptions');
  }
  return body as WizardOptions;
}

export interface WizardE2eOptionLabels {
  /**
   * The label the wizard's control at `fieldPath` offers `value` under; null
   * when it does not offer it. A market list is the campaign market's own,
   * or the global one when the market has none, as the wizard shows it.
   */
  optionLabel(fieldPath: string, value: unknown, market?: string | null): string | null;
  /** An answer as the review shows it: its served label, or the answer itself. */
  reviewLabel(field: string, value: unknown, market?: string | null): string;
  /** A country by its served name; the platform's English region name when it is not served. */
  country(code: string): string;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function createWizardE2eOptionLabels(payload: unknown): WizardE2eOptionLabels {
  const options = unwrapWizardOptions(payload);
  // The app's own value -> label mapping: canonical tokens, camelCase and
  // snake_case spellings, and renamed (v1) values all read as the wizard does.
  const served = createWizardOptionLabels(options);
  const offeredMarketLists = new Map<string, WizardOptionLabels>();
  const marketLabels = (market: string | null | undefined) => {
    const key = market ?? '';
    let labels = offeredMarketLists.get(key);
    if (!labels) {
      const list = (market && options.marketLists?.[market]) || options.marketLists?.global;
      labels = createWizardOptionLabels({
        fieldOptions: {},
        marketLists: list ? { offered: list } : {},
      });
      offeredMarketLists.set(key, labels);
    }
    return labels;
  };

  const optionLabel = (fieldPath: string, value: unknown, market?: string | null) => {
    const field = optionsFieldForPath(fieldPath);
    const own = WIZARD_OWN_OPTIONS[field];
    if (own) {
      return own.find((option) => option.value === String(value))?.label ?? null;
    }
    if (MARKET_LIST_FIELDS.has(field)) {
      return marketLabels(market).find(field, value, 'offered');
    }
    return served.find(field, value, market);
  };

  return {
    optionLabel,
    reviewLabel: (field, value, market) =>
      optionLabel(field, value, market) ?? served.label(field, value, market) ?? String(value),
    country: (code) => served.find('targetMarkets', code) ?? regionNames.of(code) ?? code,
  };
}
