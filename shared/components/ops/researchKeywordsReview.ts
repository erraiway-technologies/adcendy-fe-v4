/**
 * The keyword review (backend V3-329), the second Research Setup Review: per
 * approved search, the keywords researched for it. The task carries, per
 * search, the model's picks (the search itself first), that search's other
 * candidates and what the kind filter left out (a brand, another kind), each
 * with monthly volume. The reviewer keeps, removes or swaps: one to five per
 * search, each from that search's own list, none in two searches.
 *
 * Pure: reads the task and builds the answer the backend validates. No
 * imports, so `node --test` can run it directly.
 */

export const RESEARCH_KEYWORDS_FAILURE_MODE = 'research_setup_keywords';
export const RESEARCH_KEYWORDS_NOTES_MAX_LENGTH = 1200;

export type ResearchKeywordOption = {
  keyword: string;
  volume: number;
  /** The model's pick, another of the search's candidates, or one the kind filter left out. */
  source: 'approved' | 'picked' | 'candidate' | 'left_out';
  leftOutAs: string | null;
};

export type ResearchKeywordShare = {
  search: string;
  volume: number;
  short: boolean;
  reason: string | null;
  options: ResearchKeywordOption[];
};

export type ResearchKeywordsModel = {
  businessName: string | null;
  market: string | null;
  perSearch: number;
  flags: string[];
  shares: ResearchKeywordShare[];
};

export type ResearchKeywordsAnswer = {
  shares: Array<{ approved_search: string; keywords: string[] }>;
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

function field(record: Record<string, unknown>, camel: string, snake: string): unknown {
  return record[camel] ?? record[snake];
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.flatMap((entry) => (toRecord(entry) ? [toRecord(entry)!] : [])) : [];
}

/** The same keyword in any case or spacing, as the backend compares them. */
export function researchKeywordKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/'s\b/g, 's')
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ')
    .trim();
}

export function isResearchKeywordsTask(failureMode: unknown): boolean {
  const text = toText(failureMode);
  return text ? text.toLowerCase().replace(/[\s-]+/g, '_') === RESEARCH_KEYWORDS_FAILURE_MODE : false;
}

export function readResearchKeywordsModel(task: { questionPayload?: unknown }): ResearchKeywordsModel | null {
  const payload = toRecord(task.questionPayload);
  const context = payload ? toRecord(field(payload, 'questionContext', 'question_context')) : null;
  if (!context) {
    return null;
  }
  const shares = list(context.shares).flatMap((share) => {
    const search = toText(share.search);
    if (!search) {
      return [];
    }
    const seen = new Set<string>();
    const options: ResearchKeywordOption[] = [];
    const add = (keyword: string | null, volume: unknown, source: ResearchKeywordOption['source'], leftOutAs: string | null) => {
      if (!keyword || seen.has(researchKeywordKey(keyword))) {
        return;
      }
      seen.add(researchKeywordKey(keyword));
      options.push({ keyword, volume: toCount(volume), source, leftOutAs });
    };
    for (const entry of list(share.keywords)) {
      const keyword = toText(entry.keyword);
      add(keyword, entry.volume, keyword && researchKeywordKey(keyword) === researchKeywordKey(search) ? 'approved' : 'picked', null);
    }
    add(search, share.volume, 'approved', null);
    for (const entry of list(share.candidates)) {
      add(toText(entry.query), entry.volume, 'candidate', null);
    }
    for (const entry of list(share.dropped)) {
      add(toText(entry.search), entry.volume, 'left_out', toText(entry.verdict));
    }
    return [
      {
        search,
        volume: toCount(share.volume),
        short: toText(share.state) === 'short',
        reason: toText(share.reason),
        options,
      },
    ];
  });
  return {
    businessName: toText(field(context, 'businessName', 'business_name')),
    market: toText(context.market),
    perSearch: toCount(field(context, 'keywordsPerSearch', 'keywords_per_search')) || 5,
    flags: Array.isArray(context.flags) ? context.flags.flatMap((f) => (toText(f) ? [toText(f)!] : [])) : [],
    shares,
  };
}

/** What the review starts with: per search, the model's picks. */
/**
 * The answer a reviewer already gave, as the form's starting state: the
 * keywords per search (keyed by the model's own search wording) and the
 * notes. Null when there is no answer to show, so the form starts from the
 * model's picks. An answered review shows the answer given (V3-369).
 */
export function readResearchKeywordsSubmitted(
  submitted: unknown,
  model: ResearchKeywordsModel,
): { choice: Record<string, string[]>; notes: string } | null {
  const record = toRecord(submitted);
  const shares = record ? list(record.shares) : [];
  if (!record || shares.length === 0) {
    return null;
  }
  const choice: Record<string, string[]> = Object.fromEntries(model.shares.map((share) => [share.search, []]));
  for (const share of shares) {
    const search = toText(field(share, 'approvedSearch', 'approved_search'));
    const own = search
      ? model.shares.find((entry) => researchKeywordKey(entry.search) === researchKeywordKey(search))
      : undefined;
    const keywords = Array.isArray(share.keywords)
      ? share.keywords.flatMap((keyword) => {
          const text = toText(keyword);
          return text ? [text] : [];
        })
      : [];
    choice[own?.search ?? search ?? ''] = keywords;
  }
  delete choice[''];
  return { choice, notes: toText(field(record, 'reviewerNotes', 'reviewer_notes')) ?? '' };
}

export function initialResearchKeywordChoice(model: ResearchKeywordsModel): Record<string, string[]> {
  return Object.fromEntries(
    model.shares.map((share) => [
      share.search,
      share.options.filter((o) => o.source === 'approved' || o.source === 'picked').map((o) => o.keyword),
    ]),
  );
}

/**
 * The answer, or every reason it cannot be sent: every search once, 1 to
 * `perSearch` keywords each from its own list, none in two searches.
 */
export function buildResearchKeywordsAnswer(input: {
  model: ResearchKeywordsModel;
  choice: Record<string, string[]>;
  notes?: string;
}): { answer: ResearchKeywordsAnswer } | { error: string } {
  const reasons: string[] = [];
  const usedBy = new Map<string, string>();
  const shares = input.model.shares.map((share) => {
    const chosen = input.choice[share.search] ?? [];
    const own = new Map(share.options.map((o) => [researchKeywordKey(o.keyword), o.keyword]));
    const keys = chosen.map(researchKeywordKey);
    if (keys.length < 1 || keys.length > input.model.perSearch) {
      reasons.push(`"${share.search}": choose 1 to ${input.model.perSearch} keywords (${keys.length} chosen).`);
    }
    if (new Set(keys).size !== keys.length) {
      reasons.push(`"${share.search}": a keyword is chosen twice.`);
    }
    const keywords: string[] = [];
    keys.forEach((key, i) => {
      const listed = own.get(key);
      if (!listed) {
        reasons.push(`"${chosen[i]}" is not on the list of "${share.search}".`);
        return;
      }
      const other = usedBy.get(key);
      if (other && other !== share.search) {
        reasons.push(`"${listed}" is chosen for both "${other}" and "${share.search}".`);
        return;
      }
      usedBy.set(key, share.search);
      keywords.push(listed);
    });
    return { approved_search: share.search, keywords };
  });
  const notes = toText(input.notes);
  if (notes && notes.length > RESEARCH_KEYWORDS_NOTES_MAX_LENGTH) {
    reasons.push(`Notes are limited to ${RESEARCH_KEYWORDS_NOTES_MAX_LENGTH} characters.`);
  }
  if (input.model.shares.length === 0) {
    reasons.push('The review has no searches.');
  }
  return reasons.length > 0
    ? { error: reasons.join(' ') }
    : { answer: { shares, ...(notes ? { reviewer_notes: notes } : {}) } };
}
