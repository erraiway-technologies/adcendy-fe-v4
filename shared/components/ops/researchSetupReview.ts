/**
 * The Research Setup Review (backend V3-329). A required review, not a
 * blocker: every run asks a reviewer to choose the one to five searches
 * competitor research starts from. The task carries the model's
 * recommendations (how many of its asks picked each, which products it is
 * for, whether the search's own results were judged to be about it, with the
 * results it cited), the alternates, flags to look at first, and the whole
 * list of searches with their monthly volume. The reviewer may choose any of
 * them; the system only recommends.
 *
 * Since V3-359 (reviewer templates 1.14.0) a review may also ask for the
 * lead search: the chosen search of the product the business most wants to
 * grow. The client's own answer is shown beside it when it gave one; nothing
 * matches products to searches for the reviewer. Left untagged, a channel
 * that would lead on search demand waits for it.
 *
 * Pure: reads the task and builds the answer the backend validates (1 to 5
 * searches, none twice, each on the list; a lead search, when tagged, one of
 * them). No imports, so `node --test` can run it directly.
 */

export const RESEARCH_SETUP_FAILURE_MODE = 'research_setup_core_searches';
export const RESEARCH_SETUP_CATEGORY = 'research_setup_review';
export const RESEARCH_SETUP_MAX_SELECTED = 5;
export const RESEARCH_SETUP_NOTES_MAX_LENGTH = 1200;

export type ResearchSetupJudged = 'relevant' | 'not_relevant' | 'unknown' | 'unjudged';

export type ResearchSetupPick = {
  search: string;
  volume: number;
  /** In how many of the model's asks it was a core pick, and an alternate. */
  coreAsks: number;
  alternateAsks: number;
  asks: number;
  /** The client's products it is for, by name. */
  products: string[];
  reason: string | null;
  /** Other wordings of the same search, merged into this one. */
  merged: string[];
  judged: ResearchSetupJudged;
  evidence: string[];
  /** A recommendation picked by most asks, or one that filled a gap. */
  filled: boolean;
};

export type ResearchSetupListEntry = { search: string; volume: number; picked: boolean };

export type ResearchSetupModel = {
  businessName: string | null;
  market: string | null;
  leadOffering: string | null;
  /** The review asks the reviewer to tag the lead search (V3-359). */
  asksLeadSearch: boolean;
  /** The client's answer: the product it most wants to grow; null when not given. */
  priorityOffering: string | null;
  flags: string[];
  recommended: ResearchSetupPick[];
  alternates: ResearchSetupPick[];
  fullList: ResearchSetupListEntry[];
};

export type ResearchSetupAnswer = {
  core_searches: string[];
  /** Only when the review asks; null when the reviewer can't tell. */
  lead_search?: string | null;
  reviewer_notes?: string;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** A field under its camelCase name, as the task detail sends it, else snake_case. */
function field(record: Record<string, unknown>, camel: string, snake: string): unknown {
  return record[camel] ?? record[snake];
}

function texts(value: unknown): string[] {
  return Array.isArray(value)
    ? value.flatMap((entry) => {
        const text = toText(entry);
        return text ? [text] : [];
      })
    : [];
}

function normalizeMode(value: unknown): string | null {
  const text = toText(value);
  return text ? text.toLowerCase().replace(/[\s-]+/g, '_') : null;
}

/** The same search in any case or spacing, as the backend compares them. */
export function researchSetupKey(search: string): string {
  return search
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/'s\b/g, 's')
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ')
    .trim();
}

export function isResearchSetupTask(failureMode: unknown): boolean {
  return normalizeMode(failureMode) === RESEARCH_SETUP_FAILURE_MODE;
}

/** Whether an inbox item belongs in the Research Setup Review tab. */
export function isResearchSetupReviewItem(item: { category?: unknown; failureMode?: unknown }): boolean {
  return (
    normalizeMode(item.category) === RESEARCH_SETUP_CATEGORY ||
    isResearchSetupTask(item.failureMode) ||
    normalizeMode(item.failureMode) === 'research_setup_keywords'
  );
}

function readJudged(value: unknown): ResearchSetupJudged {
  const text = normalizeMode(value);
  return text === 'relevant' || text === 'not_relevant' || text === 'unknown' ? text : 'unjudged';
}

function readPicks(value: unknown, productNames: string[]): ResearchSetupPick[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    const record = toRecord(entry);
    const search = record ? toText(record.search) : null;
    if (!record || !search || seen.has(researchSetupKey(search))) {
      return [];
    }
    seen.add(researchSetupKey(search));
    const numbers = Array.isArray(record.products) ? record.products : [];
    return [
      {
        search,
        volume: toCount(record.volume),
        coreAsks: toCount(field(record, 'coreAsks', 'core_asks')),
        alternateAsks: toCount(field(record, 'alternateAsks', 'alternate_asks')),
        asks: toCount(record.asks),
        products: numbers.flatMap((n) =>
          typeof n === 'number' && productNames[n - 1] ? [productNames[n - 1]] : [],
        ),
        reason: texts(record.reasons)[0] ?? null,
        merged: texts(record.merged),
        judged: readJudged(record.judged),
        evidence: texts(record.evidence),
        filled: normalizeMode(record.why) === 'filled',
      },
    ];
  });
}

/** The review from the task's question context; null when it carries none. */
export function readResearchSetupModel(task: { questionPayload?: unknown }): ResearchSetupModel | null {
  const payload = toRecord(task.questionPayload);
  const context = payload ? toRecord(field(payload, 'questionContext', 'question_context')) : null;
  if (!context) {
    return null;
  }
  const productNames = texts(context.products);
  const fullList = (Array.isArray(field(context, 'fullList', 'full_list'))
    ? (field(context, 'fullList', 'full_list') as unknown[])
    : []
  ).flatMap((entry) => {
    const record = toRecord(entry);
    const search = record ? toText(record.search) : null;
    return record && search
      ? [{ search, volume: toCount(record.volume), picked: record.picked === true }]
      : [];
  });
  return {
    businessName: toText(field(context, 'businessName', 'business_name')),
    market: toText(context.market),
    leadOffering: toText(field(context, 'leadOffering', 'lead_offering')),
    asksLeadSearch: field(context, 'asksLeadSearch', 'asks_lead_search') === true,
    priorityOffering: toText(field(context, 'priorityOffering', 'priority_offering')),
    flags: texts(context.flags),
    recommended: readPicks(context.recommended, productNames),
    alternates: readPicks(context.alternates, productNames),
    fullList: [...fullList].sort((a, b) => b.volume - a.volume || a.search.localeCompare(b.search)),
  };
}

/**
 * The answer, or every reason it cannot be sent: 1 to 5 searches, none
 * twice, each on the task's list; a lead search, when tagged, one of the
 * chosen ones. Never trimmed to fit. A review that asks for the lead search
 * always carries it, null when untagged; one that does not ask never does.
 */
export function buildResearchSetupAnswer(input: {
  model: ResearchSetupModel;
  searches: string[];
  /** The tagged lead search; null or absent when untagged. */
  leadSearch?: string | null;
  notes?: string;
}): { answer: ResearchSetupAnswer } | { error: string } {
  const listed = new Map(input.model.fullList.map((entry) => [researchSetupKey(entry.search), entry.search]));
  const keys = input.searches.map(researchSetupKey);
  const reasons: string[] = [];
  if (keys.length === 0) {
    reasons.push('Choose at least one search.');
  }
  if (keys.length > RESEARCH_SETUP_MAX_SELECTED) {
    reasons.push(`Choose at most ${RESEARCH_SETUP_MAX_SELECTED} searches; ${keys.length} are chosen.`);
  }
  if (new Set(keys).size !== keys.length) {
    reasons.push('A search is chosen twice.');
  }
  const missing = input.searches.filter((search) => !listed.has(researchSetupKey(search)));
  if (missing.length > 0) {
    reasons.push(`Not on the list: ${missing.join(', ')}.`);
  }
  const lead = toText(input.leadSearch);
  if (input.model.asksLeadSearch && lead && !keys.includes(researchSetupKey(lead))) {
    reasons.push(`The lead search "${lead}" is not one of the chosen searches.`);
  }
  const notes = toText(input.notes);
  if (notes && notes.length > RESEARCH_SETUP_NOTES_MAX_LENGTH) {
    reasons.push(`Notes are limited to ${RESEARCH_SETUP_NOTES_MAX_LENGTH} characters.`);
  }
  if (reasons.length > 0) {
    return { error: reasons.join(' ') };
  }
  return {
    answer: {
      core_searches: keys.map((key) => listed.get(key) as string),
      ...(input.model.asksLeadSearch
        ? { lead_search: lead ? (listed.get(researchSetupKey(lead)) as string) : null }
        : {}),
      ...(notes ? { reviewer_notes: notes } : {}),
    },
  };
}

/**
 * The answer a reviewer already gave, as the form's starting state: the
 * chosen searches, the lead search and the notes. Null when there is no
 * answer to show, so the form starts from the recommendations instead.
 * An answered review shows the answer given, never the defaults (V3-369).
 */
export function readResearchSetupSubmitted(
  submitted: unknown,
): { searches: string[]; leadSearch: string | null; notes: string } | null {
  const record = toRecord(submitted);
  if (!record) {
    return null;
  }
  const searches = texts(field(record, 'coreSearches', 'core_searches'));
  if (searches.length === 0) {
    return null;
  }
  return {
    searches,
    leadSearch: toText(field(record, 'leadSearch', 'lead_search')),
    notes: toText(field(record, 'reviewerNotes', 'reviewer_notes')) ?? '',
  };
}

/** What the judge found when it read the search's own top results. */
export function describeResearchSetupJudged(judged: ResearchSetupJudged): string {
  switch (judged) {
    case 'relevant':
      return 'Its results are about this';
    case 'not_relevant':
      return 'Its results are about something else';
    case 'unknown':
      return 'Its results are unclear';
    default:
      return 'Results not checked';
  }
}

/** "27,100 a month". */
export function describeResearchSetupVolume(volume: number): string {
  return `${volume.toLocaleString('en-IN')} a month`;
}
