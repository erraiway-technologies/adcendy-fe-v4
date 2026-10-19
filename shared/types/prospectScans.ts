/**
 * Outreach prospect scans as the Backend serves them
 * (`/api/v2/admin/prospect-scans`): each prospect compared with the competitor
 * the operator named, every check with its figures, link and date, what the
 * scan could not settle and needs the operator for, the drafted email, and
 * every outreach saved for it. Nothing here is sent by the system.
 */

export type ProspectScanStatus =
  | 'PENDING'
  | 'SCANNING'
  | 'RECHECK_PENDING'
  | 'READY'
  | 'HELD'
  | 'FAILED';

export type ProspectBusinessType = 'company' | 'sole_trader' | 'partnership';

export type ProspectFactKind =
  | 'search_presence'
  | 'google_ads'
  | 'meta_ads'
  | 'claim'
  | 'pricing'
  | 'marketplace'
  | 'recency';

/** What an operator can read by hand and enter. */
export type ProspectOperatorFactKind =
  | 'google_ads'
  | 'meta_ads'
  | 'search_presence'
  | 'pricing'
  | 'marketplace'
  | 'recency';

export interface ProspectScanListItem {
  id: string;
  batchId: string;
  targetDomain: string;
  competitorDomain: string;
  country: string;
  status: ProspectScanStatus;
  holdReason: string | null;
  observationLine: string | null;
  isFallback: boolean;
  scannedAt: string | null;
}

export interface ProspectFact {
  id: string;
  kind: ProspectFactKind;
  state: 'gap' | 'no_gap' | 'unknown';
  source: 'api' | 'operator';
  reason: string;
  verifyUrl: string | null;
  capturedAt: string;
  values: Record<string, unknown> | null;
}

export interface ProspectInputNeeded {
  kind: ProspectOperatorFactKind | 'category_term';
  priority: 'recommended' | 'optional';
  why: string;
  howTo: string;
  checkLink: string | null;
}

export interface ProspectOutreachEmail {
  status: 'drafted' | 'held';
  subject: string | null;
  body: string | null;
  sendable: boolean;
  notSendableReason: string | null;
  wordsAboveSignature: number | null;
  isFallback: boolean;
  basedOn: {
    factId: string;
    kind: string;
    source: string;
    checkLink: string | null;
    checkedAt: string;
  } | null;
}

export interface ProspectOutreachRecord {
  id: string;
  subject: string;
  body: string;
  isFallback: boolean;
  status: 'DRAFTED' | 'SENT';
  recipientEmail: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ProspectScanDetail extends ProspectScanListItem {
  targetName: string | null;
  competitorName: string;
  contactFirstName: string | null;
  businessType: ProspectBusinessType;
  /** Why the email is sent now; null opens the email with the comparison. */
  whyNow: string | null;
  whyNowUrl: string | null;
  categoryTerm: string | null;
  operatorCategoryTerm: string | null;
  secondaryLine: string | null;
  costUsd: number;
  facts: ProspectFact[];
  inputsNeeded: ProspectInputNeeded[];
  outreachEmail: ProspectOutreachEmail | null;
  outreaches: ProspectOutreachRecord[];
}

export interface ProspectScanSummary {
  total: number;
  byStatus: Record<string, number>;
  holdReasons: Record<string, number>;
  emailsDrafted: number;
  withFact: number;
  neutral: number;
  /** Share of scanned prospects whose email carries a checked fact. */
  factRate: number | null;
}

export interface ProspectScanSpend {
  spentUsd: number;
  capUsd: number;
}

export interface ProspectSubmission {
  targetDomain: string;
  targetName?: string;
  contactFirstName?: string;
  competitorDomain: string;
  competitorName?: string;
  country: string;
  businessType: ProspectBusinessType;
  whyNow?: string;
  whyNowUrl?: string;
  categoryTerm?: string;
}

export interface ProspectSubmitResult {
  batchId: string;
  created: string[];
  existing: string[];
}

export interface ProspectOperatorFactPayload {
  kind: ProspectOperatorFactKind;
  values: Record<string, unknown>;
  verifyUrl: string;
  checkedOn?: string;
}

export interface ProspectInputsPatch {
  targetName?: string;
  competitorName?: string;
  contactFirstName?: string;
  whyNow?: string;
  whyNowUrl?: string;
  businessType?: ProspectBusinessType;
  categoryTerm?: string;
}

export interface MarkOutreachSentPayload {
  recipientEmail?: string;
  allowRepeat?: boolean;
}

// --- labels -----------------------------------------------------------------

export const PROSPECT_STATUS_LABELS: Record<ProspectScanStatus, string> = {
  PENDING: 'Waiting',
  SCANNING: 'Scanning',
  RECHECK_PENDING: 'Re-checking',
  READY: 'Email ready',
  HELD: 'Held',
  FAILED: 'Failed',
};

export const PROSPECT_FACT_KIND_LABELS: Record<ProspectFactKind, string> = {
  search_presence: 'Google search',
  google_ads: 'Google ads',
  meta_ads: 'Meta ads',
  claim: 'Homepage promise',
  pricing: 'Pricing',
  marketplace: 'Marketplace',
  recency: 'Recent launch',
};

export const PROSPECT_INPUT_KIND_LABELS: Record<ProspectInputNeeded['kind'], string> = {
  google_ads: 'Google ads, from the public page',
  meta_ads: 'Meta ads',
  search_presence: 'Your own Google search',
  category_term: 'Search term',
  pricing: 'Pricing',
  marketplace: 'Marketplace listing',
  recency: 'Recent launch',
};

/** A reason code read as words: "competitor_not_in_top_5" → "competitor not in top 5". */
export const readableReason = (reason: string | null | undefined) =>
  (reason ?? '').replace(/_/g, ' ').trim();

// --- normalizers --------------------------------------------------------------

const STATUSES: ProspectScanStatus[] = [
  'PENDING',
  'SCANNING',
  'RECHECK_PENDING',
  'READY',
  'HELD',
  'FAILED',
];
const FACT_KINDS: ProspectFactKind[] = [
  'search_presence',
  'google_ads',
  'meta_ads',
  'claim',
  'pricing',
  'marketplace',
  'recency',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const nullableText = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;
const number = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;
const nullableNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function normalizeProspectScanListItem(value: unknown): ProspectScanListItem | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    batchId: text(value.batchId),
    targetDomain: text(value.targetDomain),
    competitorDomain: text(value.competitorDomain),
    country: text(value.country),
    status: STATUSES.find((status) => status === value.status) ?? 'PENDING',
    holdReason: nullableText(value.holdReason),
    observationLine: nullableText(value.observationLine),
    isFallback: value.isFallback === true,
    scannedAt: nullableText(value.scannedAt),
  };
}

export function normalizeProspectScanList(value: unknown): ProspectScanListItem[] {
  return Array.isArray(value)
    ? value
        .map(normalizeProspectScanListItem)
        .filter((item): item is ProspectScanListItem => item !== null)
    : [];
}

function normalizeFact(value: unknown): ProspectFact | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const kind = FACT_KINDS.find((candidate) => candidate === value.kind);
  if (!kind) return null;
  const state =
    value.state === 'gap' || value.state === 'no_gap' ? value.state : 'unknown';
  return {
    id: value.id,
    kind,
    state,
    source: value.source === 'operator' ? 'operator' : 'api',
    reason: text(value.reason),
    verifyUrl: nullableText(value.verifyUrl),
    capturedAt: text(value.capturedAt),
    // A reading that saw nothing stores no figures (or only its evidence).
    values:
      isRecord(value.valuesJson) && typeof value.valuesJson.kind === 'string'
        ? value.valuesJson
        : null,
  };
}

function normalizeInputNeeded(value: unknown): ProspectInputNeeded | null {
  if (!isRecord(value) || typeof value.kind !== 'string') return null;
  const kinds = Object.keys(PROSPECT_INPUT_KIND_LABELS) as ProspectInputNeeded['kind'][];
  const kind = kinds.find((candidate) => candidate === value.kind);
  if (!kind) return null;
  return {
    kind,
    priority: value.priority === 'recommended' ? 'recommended' : 'optional',
    why: text(value.why),
    howTo: text(value.howTo),
    checkLink: nullableText(value.checkLink),
  };
}

function normalizeEmail(value: unknown): ProspectOutreachEmail | null {
  if (!isRecord(value)) return null;
  const basedOn = isRecord(value.basedOn) ? value.basedOn : null;
  return {
    status: value.status === 'drafted' ? 'drafted' : 'held',
    subject: nullableText(value.subject),
    body: nullableText(value.body),
    sendable: value.sendable === true,
    notSendableReason: nullableText(value.notSendableReason),
    wordsAboveSignature: nullableNumber(value.wordsAboveSignature),
    isFallback: value.isFallback === true,
    basedOn: basedOn
      ? {
          factId: text(basedOn.factId),
          kind: text(basedOn.kind),
          source: text(basedOn.source),
          checkLink: nullableText(basedOn.checkLink),
          checkedAt: text(basedOn.checkedAt),
        }
      : null,
  };
}

function normalizeOutreach(value: unknown): ProspectOutreachRecord | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    subject: text(value.subject),
    body: text(value.body),
    isFallback: value.isFallback === true,
    status: value.status === 'SENT' ? 'SENT' : 'DRAFTED',
    recipientEmail: nullableText(value.recipientEmail),
    sentAt: nullableText(value.sentAt),
    createdAt: text(value.createdAt),
  };
}

export function normalizeProspectScanDetail(value: unknown): ProspectScanDetail | null {
  const base = normalizeProspectScanListItem(value);
  if (!base || !isRecord(value)) return null;
  const businessType: ProspectBusinessType =
    value.businessType === 'sole_trader' || value.businessType === 'partnership'
      ? value.businessType
      : 'company';
  const list = <T>(raw: unknown, read: (item: unknown) => T | null) =>
    Array.isArray(raw) ? raw.map(read).filter((item): item is T => item !== null) : [];
  return {
    ...base,
    targetName: nullableText(value.targetName),
    competitorName: text(value.competitorName) || base.competitorDomain,
    contactFirstName: nullableText(value.contactFirstName),
    businessType,
    whyNow: nullableText(value.whyNow),
    whyNowUrl: nullableText(value.whyNowUrl),
    categoryTerm: nullableText(value.categoryTerm),
    operatorCategoryTerm: nullableText(value.operatorCategoryTerm),
    secondaryLine: nullableText(value.secondaryLine),
    costUsd: number(value.costUsd),
    facts: list(value.facts, normalizeFact),
    inputsNeeded: list(value.inputsNeeded, normalizeInputNeeded),
    outreachEmail: normalizeEmail(value.outreachEmail),
    outreaches: list(value.outreaches, normalizeOutreach),
  };
}

export function normalizeProspectScanSummary(value: unknown): ProspectScanSummary {
  const record = isRecord(value) ? value : {};
  const counts = (raw: unknown) =>
    isRecord(raw)
      ? Object.fromEntries(
          Object.entries(raw).filter(([, count]) => typeof count === 'number'),
        ) as Record<string, number>
      : {};
  return {
    total: number(record.total),
    byStatus: counts(record.byStatus),
    holdReasons: counts(record.holdReasons),
    emailsDrafted: number(record.emailsDrafted),
    withFact: number(record.withFact),
    neutral: number(record.neutral),
    factRate: nullableNumber(record.factRate),
  };
}

export function normalizeProspectScanSpend(value: unknown): ProspectScanSpend {
  const record = isRecord(value) ? value : {};
  return { spentUsd: number(record.spentUsd), capUsd: number(record.capUsd) };
}

export function normalizeProspectSubmitResult(value: unknown): ProspectSubmitResult {
  const record = isRecord(value) ? value : {};
  const ids = (raw: unknown) =>
    Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
  return {
    batchId: text(record.batchId),
    created: ids(record.created),
    existing: ids(record.existing),
  };
}

// --- batch entry ---------------------------------------------------------------

export interface ProspectColumnSpec {
  name: keyof ProspectSubmission;
  label: string;
  required: boolean;
  placeholder: string;
}

/** The columns of the prospect entry table, in order; the header always shows all of them. */
export const PROSPECT_COLUMNS: readonly ProspectColumnSpec[] = [
  { name: 'targetDomain', label: 'Prospect website', required: true, placeholder: 'e.g. pipandnut.com' },
  { name: 'targetName', label: 'Prospect name', required: false, placeholder: 'e.g. Pip & Nut' },
  { name: 'competitorDomain', label: 'Competitor website', required: true, placeholder: 'e.g. meridianfoods.co.uk' },
  { name: 'competitorName', label: 'Competitor name', required: false, placeholder: 'e.g. Meridian' },
  { name: 'country', label: 'Country', required: true, placeholder: 'e.g. GB' },
  { name: 'businessType', label: 'Business type', required: true, placeholder: '' },
  { name: 'whyNow', label: 'Why now (after "saw")', required: false, placeholder: "e.g. you've just raised a seed round" },
  { name: 'whyNowUrl', label: 'Why now link', required: false, placeholder: 'e.g. https://…/news/123' },
  { name: 'contactFirstName', label: 'Contact first name', required: false, placeholder: 'e.g. Sam' },
  { name: 'categoryTerm', label: 'Category search term', required: false, placeholder: 'e.g. peanut butter' },
] as const;

export const PROSPECT_BUSINESS_TYPE_LABELS: Record<ProspectBusinessType, string> = {
  company: 'Company',
  sole_trader: 'Sole trader',
  partnership: 'Partnership',
};

export const PROSPECT_BATCH_LIMIT = 100;

/** One row of the entry table as typed: every cell is text, empty when not filled. */
export type ProspectDraftRow = Record<ProspectColumnSpec['name'], string>;

export function emptyProspectDraftRow(): ProspectDraftRow {
  return Object.fromEntries(PROSPECT_COLUMNS.map((column) => [column.name, ''])) as ProspectDraftRow;
}

const BUSINESS_TYPES = Object.keys(PROSPECT_BUSINESS_TYPE_LABELS) as ProspectBusinessType[];

/** Cells a new row copies from the row above; a row with only these filled has not been started. */
export const PROSPECT_CARRIED_COLUMNS: readonly ProspectColumnSpec['name'][] = ['country', 'businessType'];

export interface ProspectCellProblem {
  /** Zero-based row index in the table. */
  row: number;
  column: ProspectColumnSpec['name'];
}

/**
 * Prospects from the entry table. A row with nothing typed beyond the cells
 * copied from the row above is skipped; every other row with a problem is
 * reported by its row number and its cells, and no row is guessed at.
 */
export function readProspectDraftRows(drafts: ProspectDraftRow[]): {
  rows: ProspectSubmission[];
  errors: string[];
  invalidCells: ProspectCellProblem[];
} {
  const rows: ProspectSubmission[] = [];
  const errors: string[] = [];
  const invalidCells: ProspectCellProblem[] = [];
  drafts.forEach((draft, index) => {
    const cell = (name: ProspectColumnSpec['name']) => (draft[name] ?? '').trim();
    const started = PROSPECT_COLUMNS.some(
      (column) => !PROSPECT_CARRIED_COLUMNS.includes(column.name) && cell(column.name),
    );
    if (!started) return;
    const problems: string[] = [];
    const flag = (column: ProspectColumnSpec['name'], problem: string) => {
      problems.push(problem);
      invalidCells.push({ row: index, column });
    };
    for (const column of PROSPECT_COLUMNS) {
      if (column.required && !cell(column.name)) flag(column.name, `${column.label} is empty`);
    }
    const country = cell('country');
    if (country && !/^[A-Za-z]{2}$/.test(country)) flag('country', 'Country must be two letters, e.g. GB');
    const businessType = cell('businessType');
    if (businessType && !BUSINESS_TYPES.includes(businessType as ProspectBusinessType)) {
      flag('businessType', 'Business type must be company, sole trader or partnership');
    }
    if (problems.length) {
      errors.push(`Row ${index + 1}: ${problems.join('; ')}.`);
      return;
    }
    const optional = (name: ProspectColumnSpec['name']) => (cell(name) ? { [name]: cell(name) } : {});
    rows.push({
      targetDomain: cell('targetDomain'),
      competitorDomain: cell('competitorDomain'),
      country: country.toUpperCase(),
      businessType: businessType as ProspectBusinessType,
      ...optional('targetName'),
      ...optional('competitorName'),
      ...optional('contactFirstName'),
      ...optional('whyNow'),
      ...optional('whyNowUrl'),
      ...optional('categoryTerm'),
    });
  });
  if (rows.length > PROSPECT_BATCH_LIMIT) {
    errors.push(`A batch holds at most ${PROSPECT_BATCH_LIMIT} prospects; ${rows.length} were entered.`);
  }
  return { rows, errors, invalidCells };
}

// --- hand readings -------------------------------------------------------------

export type OperatorFieldType = 'count' | 'position' | 'boolean' | 'date' | 'text' | 'money';

export interface OperatorFieldSpec {
  name: string;
  label: string;
  type: OperatorFieldType;
  /** May be left empty: sent as null. */
  nullable?: boolean;
  help?: string;
}

/**
 * The fields of each hand reading, in the order the operator reads them,
 * named as the Backend expects them.
 */
export const OPERATOR_FACT_FIELDS: Record<ProspectOperatorFactKind, OperatorFieldSpec[]> = {
  google_ads: [
    { name: 'competitorCount', label: "Competitor's ads shown", type: 'count', help: 'The number the page shows, without the "~".' },
    { name: 'competitorCountApprox', label: 'The page shows "~" before it', type: 'boolean' },
    { name: 'targetCount', label: "Prospect's ads shown", type: 'count' },
    { name: 'targetCountApprox', label: 'The page shows "~" before it', type: 'boolean' },
    { name: 'targetEverAdvertised', label: 'The prospect has run ads before (any date)', type: 'boolean', nullable: true, help: 'Leave unset if you could not tell.' },
  ],
  meta_ads: [
    { name: 'competitorActive', label: "Competitor's active ads", type: 'count' },
    { name: 'competitorOldestActiveStart', label: 'Oldest active ad started on', type: 'date', nullable: true },
    { name: 'targetActive', label: "Prospect's active ads", type: 'count' },
    { name: 'targetEverAdvertised', label: 'The prospect has run ads before', type: 'boolean', nullable: true, help: 'Leave unset if you could not tell.' },
  ],
  search_presence: [
    { name: 'term', label: 'Search term', type: 'text' },
    { name: 'competitorPosition', label: "Competitor's position (1-20)", type: 'position', nullable: true, help: 'Empty if not in the first two pages.' },
    { name: 'targetPosition', label: "Prospect's position (1-20)", type: 'position', nullable: true, help: 'Empty if not in the first two pages.' },
  ],
  pricing: [
    { name: 'currencySymbol', label: 'Currency symbol', type: 'text', help: 'e.g. £' },
    { name: 'unitLabel', label: 'What is sold', type: 'text', help: 'e.g. pouches' },
    { name: 'competitorUnits', label: 'Competitor bundle size', type: 'money' },
    { name: 'competitorPrice', label: 'Competitor price', type: 'money' },
    { name: 'targetUnits', label: 'Prospect bundle size', type: 'money' },
    { name: 'targetPrice', label: 'Prospect price', type: 'money' },
  ],
  marketplace: [
    { name: 'marketplace', label: 'Marketplace', type: 'text', help: 'e.g. Amazon UK' },
    { name: 'competitorReviewCount', label: "Competitor's review count", type: 'count' },
    { name: 'targetListed', label: 'The prospect is listed there', type: 'boolean' },
  ],
  recency: [
    { name: 'competitorItem', label: 'What the competitor launched', type: 'text', help: 'e.g. a protein bar range' },
    { name: 'firstSeenOn', label: 'First seen on', type: 'date' },
  ],
};

/**
 * Typed values for a hand reading from the form's text fields, or the
 * problems with them. An empty optional field is sent as null; an empty
 * yes/no field the form shows as "No" is sent as false; any other empty
 * field is a problem, never a default.
 */
export function buildOperatorValues(
  kind: ProspectOperatorFactKind,
  form: Record<string, string>,
): { values: Record<string, unknown> | null; problems: string[] } {
  const values: Record<string, unknown> = {};
  const problems: string[] = [];
  for (const field of OPERATOR_FACT_FIELDS[kind]) {
    const raw = (form[field.name] ?? '').trim();
    if (!raw) {
      if (field.nullable) {
        values[field.name] = null;
        continue;
      }
      if (field.type === 'boolean') {
        values[field.name] = false;
        continue;
      }
      problems.push(`${field.label} is required.`);
      continue;
    }
    switch (field.type) {
      case 'count':
      case 'position': {
        const parsed = Number(raw);
        const max = field.type === 'position' ? 20 : Number.MAX_SAFE_INTEGER;
        const min = field.type === 'position' ? 1 : 0;
        if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
          problems.push(`${field.label} must be a whole number from ${min}${field.type === 'position' ? ' to 20' : ''}.`);
        } else {
          values[field.name] = parsed;
        }
        break;
      }
      case 'money': {
        const parsed = Number(raw.replace(/,/g, ''));
        if (!Number.isFinite(parsed) || parsed <= 0) {
          problems.push(`${field.label} must be a number above 0.`);
        } else {
          values[field.name] = parsed;
        }
        break;
      }
      case 'boolean':
        if (raw !== 'true' && raw !== 'false') {
          problems.push(`${field.label} must be yes or no.`);
        } else {
          values[field.name] = raw === 'true';
        }
        break;
      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          problems.push(`${field.label} must be a date (YYYY-MM-DD).`);
        } else {
          values[field.name] = raw;
        }
        break;
      case 'text':
        values[field.name] = raw;
        break;
    }
  }
  return { values: problems.length ? null : values, problems };
}

/** A fact's figures as one readable line for the facts table. */
export function describeFactFigures(fact: ProspectFact): string {
  const values = fact.values;
  if (!values) return '';
  const read = (name: string) => values[name];
  switch (fact.kind) {
    case 'search_presence':
      return `"${String(read('term') ?? '')}": competitor ${read('competitorPosition') ?? 'not in top 20'}, prospect ${read('targetPosition') ?? 'not in top 20'}`;
    case 'google_ads': {
      const approx = (name: string) => (read(name) ? '~' : '');
      // A count past one page of ads is a floor: "100+".
      const floor = (name: string) => (read(name) === false ? '+' : '');
      return `competitor ${approx('competitorCountApprox')}${String(read('competitorCount') ?? '?')}${floor('competitorCountExact')}, prospect ${approx('targetCountApprox')}${String(read('targetCount') ?? '?')}${floor('targetCountExact')}${read('readFrom') === 'public_page' ? ' (public page)' : read('competitorLookedUpAs') ? ` (read as ${String(read('competitorLookedUpAs'))})` : ''}`;
    }
    case 'meta_ads':
      return `competitor ${String(read('competitorActive') ?? '?')} live, prospect ${String(read('targetActive') ?? '?')}`;
    case 'claim':
      return read('competitorQuote') ? `competitor says "${String(read('competitorQuote'))}"` : String(read('promiseLabel') ?? '');
    case 'pricing':
      return `${String(read('currencySymbol') ?? '')}${String(read('targetPrice') ?? '?')} vs ${String(read('currencySymbol') ?? '')}${String(read('competitorPrice') ?? '?')}`;
    case 'marketplace':
      return `${String(read('marketplace') ?? '')}: competitor ${String(read('competitorReviewCount') ?? '?')} reviews`;
    case 'recency':
      return `${String(read('competitorItem') ?? '')}, ${String(read('firstSeenOn') ?? '')}`;
  }
}
