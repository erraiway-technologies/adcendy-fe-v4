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
  hiringSignal: string;
  hiringSignalUrl: string | null;
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
  hiringSignal: string;
  hiringSignalUrl?: string;
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
  hiringSignal?: string;
  hiringSignalUrl?: string;
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
    values: isRecord(value.valuesJson) ? value.valuesJson : null,
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
    hiringSignal: text(value.hiringSignal),
    hiringSignalUrl: nullableText(value.hiringSignalUrl),
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

// --- batch paste ---------------------------------------------------------------

/** Columns a pasted batch may carry; the first five are required. */
export const PROSPECT_PASTE_COLUMNS = [
  'targetDomain',
  'competitorDomain',
  'country',
  'businessType',
  'hiringSignal',
  'targetName',
  'competitorName',
  'contactFirstName',
  'hiringSignalUrl',
  'categoryTerm',
] as const;

const REQUIRED_PASTE_COLUMNS = PROSPECT_PASTE_COLUMNS.slice(0, 5);
const BUSINESS_TYPES: ProspectBusinessType[] = ['company', 'sole_trader', 'partnership'];

function splitRow(line: string, separator: string): string[] {
  if (separator === '\t') return line.split('\t').map((cell) => cell.trim());
  // Comma-separated, with "quoted, cells" and "" for a quote.
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

/**
 * Prospects from pasted spreadsheet rows (tab- or comma-separated) with a
 * header row naming the columns. Every row with a problem is reported by
 * its line number; no row is guessed at.
 */
export function parseProspectRows(input: string): {
  rows: ProspectSubmission[];
  errors: string[];
} {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ['Paste a header row and at least one prospect.'] };
  const separator = lines[0].includes('\t') ? '\t' : ',';
  const header = splitRow(lines[0], separator);
  const missing = REQUIRED_PASTE_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return { rows: [], errors: [`The header row is missing: ${missing.join(', ')}.`] };
  }
  const unknown = header.filter(
    (column) => column && !(PROSPECT_PASTE_COLUMNS as readonly string[]).includes(column),
  );
  const errors: string[] = unknown.length
    ? [`Unknown columns, not read: ${unknown.join(', ')}.`]
    : [];
  const rows: ProspectSubmission[] = [];
  lines.slice(1).forEach((line, index) => {
    const lineNumber = index + 2;
    const cells = splitRow(line, separator);
    const cell = (column: string) => cells[header.indexOf(column)]?.trim() ?? '';
    const businessType = cell('businessType').toLowerCase().replace(/[\s-]+/g, '_');
    const problems: string[] = [];
    for (const column of REQUIRED_PASTE_COLUMNS) {
      if (!cell(column)) problems.push(`${column} is empty`);
    }
    if (cell('country') && !/^[A-Za-z]{2}$/.test(cell('country'))) {
      problems.push('country must be two letters, e.g. GB');
    }
    if (businessType && !BUSINESS_TYPES.includes(businessType as ProspectBusinessType)) {
      problems.push('businessType must be company, sole_trader or partnership');
    }
    if (problems.length) {
      errors.push(`Line ${lineNumber}: ${problems.join('; ')}.`);
      return;
    }
    const optional = (column: string) => (cell(column) ? { [column]: cell(column) } : {});
    rows.push({
      targetDomain: cell('targetDomain'),
      competitorDomain: cell('competitorDomain'),
      country: cell('country').toUpperCase(),
      businessType: businessType as ProspectBusinessType,
      hiringSignal: cell('hiringSignal'),
      ...optional('targetName'),
      ...optional('competitorName'),
      ...optional('contactFirstName'),
      ...optional('hiringSignalUrl'),
      ...optional('categoryTerm'),
    });
  });
  if (rows.length > 100) {
    errors.push(`A batch holds at most 100 prospects; ${rows.length} were pasted.`);
  }
  return { rows, errors };
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
      return `competitor ${approx('competitorCountApprox')}${String(read('competitorCount') ?? '?')}, prospect ${approx('targetCountApprox')}${String(read('targetCount') ?? '?')}${read('readFrom') === 'public_page' ? ' (public page)' : read('competitorLookedUpAs') ? ` (read as ${String(read('competitorLookedUpAs'))})` : ''}`;
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
