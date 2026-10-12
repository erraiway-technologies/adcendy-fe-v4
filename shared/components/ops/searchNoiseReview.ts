/**
 * The search-noise question (backend `mode_3a`, V3-66). When the competitor
 * set for a market is in doubt - too few verified direct competitors, or none
 * of the ones the client named survived verification - the diagnostic blocks
 * on a reviewer task. It shows the competitors the run already holds and the
 * domains competitor identification left out as search noise (marketplaces,
 * social networks, video sites, publishers), and asks whether any of those is
 * really a competitor.
 *
 * The reviewer marks a noise domain as a competitor, or leaves it as noise,
 * and can add up to five competitor domains the research missed. There is no
 * "exclude": the listed domains are already out of the competitor set, so
 * leaving one alone is the whole of that answer.
 *
 * Until this form the task was answered by typing JSON into an empty box, with
 * none of the competitors the run already had in view.
 *
 * Pure: reads the task detail and builds the answer the backend validates
 * against the template's answer schema. No imports, so `node --test` can run
 * it directly.
 */

export const SEARCH_NOISE_FAILURE_MODE = 'mode_3a';

/** The answer schema's limits. */
export const SEARCH_NOISE_MAX_ADDED = 5;
export const SEARCH_NOISE_NOTES_MAX_LENGTH = 1200;

/** The schema's domain pattern: a host name with a dot and a top-level part. */
const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/;

export type SearchNoiseCompetitorTier = 'tier_1' | 'tier_2' | 'unverified';

export type SearchNoiseCompetitor = {
  name: string;
  domain: string | null;
  tier: SearchNoiseCompetitorTier | null;
  clientNamed: boolean;
};

export type SearchNoiseDomain = {
  domain: string;
  /** What kind of surface it is ("marketplace", "video"), when known. */
  category: string | null;
  /** How often it appeared in the search results, when counted. */
  occurrences: number | null;
};

export type SearchNoiseModel = {
  clientName: string | null;
  marketLabel: string | null;
  /** Why the competitor set is in doubt, in the pipeline's own words. */
  diagnosis: string | null;
  competitorsFound: SearchNoiseCompetitor[];
  noiseDomains: SearchNoiseDomain[];
  /**
   * A task asked before V3-66 validates against the schema its run froze,
   * which needs a decision for at least one domain and knows "exclude". The
   * domains left as noise are then sent as "exclude", which the backend has
   * always ignored.
   */
  requiresDecisionPerDomain: boolean;
};

export type SearchNoiseDecision = {
  domain: string;
  decision: 'include' | 'exclude';
};

export type SearchNoiseAnswer = {
  competitor_decisions?: SearchNoiseDecision[];
  additional_competitors?: string[];
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

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** A field under its camelCase name, as the task detail sends it, else snake_case. */
function field(record: Record<string, unknown>, camel: string, snake: string): unknown {
  return record[camel] ?? record[snake];
}

function normalizeMode(value: unknown): string | null {
  const text = toText(value);
  return text ? text.toLowerCase().replace(/[\s-]+/g, '_') : null;
}

export function isSearchNoiseTask(failureMode: unknown): boolean {
  return normalizeMode(failureMode) === SEARCH_NOISE_FAILURE_MODE;
}

/**
 * A domain the answer schema accepts, from whatever was typed or listed:
 * "https://www.Huel.com/uk" becomes "huel.com". Null when it is not a domain.
 */
export function normalizeCompetitorDomain(value: unknown): string | null {
  const text = toText(value);
  if (!text) {
    return null;
  }
  const host = text
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#\s]/)[0];
  return host && DOMAIN_PATTERN.test(host) ? host : null;
}

function readTier(value: unknown): SearchNoiseCompetitorTier | null {
  const text = normalizeMode(value);
  return text === 'tier_1' || text === 'tier_2' || text === 'unverified' ? text : null;
}

function readCompetitors(value: unknown): SearchNoiseCompetitor[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    const record = toRecord(entry);
    if (!record) {
      return [];
    }
    const domain = normalizeCompetitorDomain(record.domain) ?? toText(record.domain);
    const name = toText(record.name) ?? domain;
    if (!name) {
      return [];
    }
    return [
      {
        name,
        domain,
        tier: readTier(record.tier),
        clientNamed: field(record, 'clientNamed', 'client_named') === true,
      },
    ];
  });
}

/** Objects as the task sends them, or a comma-separated list from an older task. */
function readNoiseDomains(value: unknown): SearchNoiseDomain[] {
  const entries: unknown[] = Array.isArray(value)
    ? value
    : (toText(value)?.split(',') ?? []);
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    const record = toRecord(entry);
    const domain = normalizeCompetitorDomain(record ? record.domain : entry);
    if (!domain || seen.has(domain)) {
      return [];
    }
    seen.add(domain);
    return [
      {
        domain,
        category: record ? toText(record.category) : null,
        occurrences: record ? toNumber(record.occurrences) : null,
      },
    ];
  });
}

/**
 * The question's lists from the task detail: its current values to fix, else
 * the question context it was asked with. Null when the task carries neither.
 */
export function readSearchNoiseModel(task: {
  currentValuesToFix?: unknown;
  questionPayload?: unknown;
}): SearchNoiseModel | null {
  const payload = toRecord(task.questionPayload);
  const source =
    toRecord(task.currentValuesToFix) ??
    (payload ? toRecord(field(payload, 'questionContext', 'question_context')) : null);
  if (!source) {
    return null;
  }
  const noiseDomains = readNoiseDomains(field(source, 'searchNoiseDomains', 'search_noise_domains'));
  return {
    clientName: toText(field(source, 'clientName', 'client_name')),
    marketLabel: toText(source.market) ?? toText(field(source, 'marketLabel', 'market_label')),
    diagnosis: toText(field(source, 'signalSummary', 'signal_summary')),
    competitorsFound: readCompetitors(field(source, 'competitorsFound', 'competitors_found')),
    noiseDomains:
      noiseDomains.length > 0
        ? noiseDomains
        : readNoiseDomains(field(source, 'candidateDomains', 'candidate_domains')),
    requiresDecisionPerDomain:
      field(source, 'requiresDecisionPerDomain', 'requires_decision_per_domain') === true,
  };
}

/**
 * The answer, or the reason it cannot be sent yet. The backend rejects an
 * answer outside the schema, so the form says so before the round trip.
 * Leaving every domain as noise and adding nothing is a valid answer: the run
 * goes on with the competitors it has.
 */
export function buildSearchNoiseAnswer(input: {
  model: SearchNoiseModel;
  included: string[];
  added: string[];
  notes?: string;
}): { answer: SearchNoiseAnswer } | { error: string } {
  const listed = new Set(input.model.noiseDomains.map((entry) => entry.domain));
  const included = new Set(
    input.included
      .map((entry) => normalizeCompetitorDomain(entry))
      .filter((entry): entry is string => entry !== null && listed.has(entry)),
  );

  const known = new Set(
    input.model.competitorsFound
      .map((entry) => entry.domain)
      .filter((entry): entry is string => Boolean(entry)),
  );
  const added: string[] = [];
  for (const entry of input.added) {
    const domain = normalizeCompetitorDomain(entry);
    if (!domain) {
      return { error: `"${entry}" is not a domain, such as huel.com.` };
    }
    if (known.has(domain)) {
      return { error: `${domain} is already one of the competitors found.` };
    }
    if (listed.has(domain)) {
      // Typing a listed noise domain means including it.
      included.add(domain);
      continue;
    }
    if (!added.includes(domain)) {
      added.push(domain);
    }
  }
  if (added.length > SEARCH_NOISE_MAX_ADDED) {
    return {
      error: `Add at most ${SEARCH_NOISE_MAX_ADDED} competitors; ${added.length} are listed.`,
    };
  }

  const notes = toText(input.notes);
  if (notes && notes.length > SEARCH_NOISE_NOTES_MAX_LENGTH) {
    return { error: `Notes are limited to ${SEARCH_NOISE_NOTES_MAX_LENGTH} characters.` };
  }

  // Listed order, so the answer reads the way the question did.
  const decisions = input.model.noiseDomains.flatMap((entry): SearchNoiseDecision[] =>
    included.has(entry.domain)
      ? [{ domain: entry.domain, decision: 'include' }]
      : input.model.requiresDecisionPerDomain
        ? [{ domain: entry.domain, decision: 'exclude' }]
        : [],
  );
  if (input.model.requiresDecisionPerDomain && decisions.length === 0) {
    return { error: 'This task lists no domains to decide on, so it cannot be answered here.' };
  }

  return {
    answer: {
      ...(decisions.length > 0 ? { competitor_decisions: decisions } : {}),
      ...(added.length > 0 ? { additional_competitors: added } : {}),
      // The schema a task asked before V3-66 froze takes no notes.
      ...(notes && !input.model.requiresDecisionPerDomain ? { reviewer_notes: notes } : {}),
    },
  };
}

/** "Tier 1 · client-named", as the competitor list reads it. */
export function describeSearchNoiseCompetitor(competitor: SearchNoiseCompetitor): string {
  const tier =
    competitor.tier === 'tier_1'
      ? 'Tier 1'
      : competitor.tier === 'tier_2'
        ? 'Tier 2'
        : competitor.tier === 'unverified'
          ? 'not yet verified'
          : null;
  return [tier, competitor.clientNamed ? 'client-named' : null].filter(Boolean).join(' · ');
}

/** "marketplace · 9 results", as the noise list reads it. */
export function describeSearchNoiseDomain(domain: SearchNoiseDomain): string {
  return [
    domain.category ? domain.category.replace(/_/g, ' ') : null,
    domain.occurrences === null
      ? null
      : `${domain.occurrences} search result${domain.occurrences === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
