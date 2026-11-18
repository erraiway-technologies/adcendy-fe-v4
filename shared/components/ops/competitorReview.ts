/**
 * The competitor approval review (backend V3-338), the third Research Setup
 * Review: the reviewer approves the business's direct competitors from every
 * ranked candidate. The task carries each candidate in rank order with what
 * the check said - confirmed, nearby, another market, not a competitor,
 * undecided, unread, or not reached - its reason and the page's own words.
 * The confirmed ones start ticked; any candidate may be ticked or unticked.
 *
 * Pure: reads the task and builds the answer the backend validates. No
 * imports, so `node --test` can run it directly.
 */

export const COMPETITOR_REVIEW_FAILURE_MODE = 'research_setup_competitors';
export const COMPETITOR_REVIEW_NOTES_MAX_LENGTH = 1200;

export const COMPETITOR_REVIEW_VERDICTS = [
  'direct',
  'nearby',
  'other_market',
  'not_competitor',
  'unknown',
  'not_read',
  'not_checked',
] as const;
export type CompetitorReviewVerdict = (typeof COMPETITOR_REVIEW_VERDICTS)[number];

export type CompetitorReviewCandidate = {
  rank: number;
  name: string;
  site: string | null;
  listing: boolean;
  clientNamed: boolean;
  verdict: CompetitorReviewVerdict;
  why: string | null;
  quote: string | null;
};

/** The groups the screen shows, in order: what to approve first, what was not reached last. */
export const COMPETITOR_REVIEW_GROUPS = [
  {
    key: 'confirmed',
    title: 'Confirmed by the check',
    hint: 'Same kind of product, same buyer, selling in this market. Those whose main product is yours come first; those that sell it as one of several things follow. Untick any that are wrong.',
    verdicts: ['direct'],
  },
  {
    key: 'your_call',
    title: 'Your call',
    hint: 'The check could not decide: its page did not show it, or could not be read.',
    verdicts: ['unknown', 'not_read'],
  },
  {
    key: 'nearby',
    title: 'Nearby',
    hint: 'Serves the same buyer or need with another kind of product, or sells your kind as a side line.',
    verdicts: ['nearby'],
  },
  {
    key: 'other_market',
    title: 'Sells in another market',
    hint: 'Same kind of product, but its page shows it selling elsewhere.',
    verdicts: ['other_market'],
  },
  {
    key: 'not_competitor',
    title: 'Not a competitor',
    hint: 'Its page shows it selling something else.',
    verdicts: ['not_competitor'],
  },
  {
    key: 'not_checked',
    title: 'Not reached',
    hint: 'Ranked lower; the check stopped before reaching them. Not rejected - tick any that are competitors.',
    verdicts: ['not_checked'],
  },
] as const satisfies ReadonlyArray<{
  key: string;
  title: string;
  hint: string;
  verdicts: readonly CompetitorReviewVerdict[];
}>;

export type CompetitorReviewModel = {
  businessName: string | null;
  market: string | null;
  enoughDirect: number;
  /** Step 11 (backend V3-344): fewer approved needs the reviewer's reason; null - one or more. */
  minimumDirect: number | null;
  checked: number;
  /** The client category the check judged against (backend V3-341). */
  checkedAgainst: string | null;
  /** The client's other approved categories, not checked. */
  otherCategories: string[];
  flags: string[];
  candidates: CompetitorReviewCandidate[];
  /**
   * Backend V3-398: the run's review takes the reviewer's labels - direct,
   * nearby or not a competitor - and the direct ones' order. False on a run
   * frozen before them: the tick list.
   */
  labels: boolean;
};

export type CompetitorReviewAnswer = {
  /** With labels: the direct competitors, in the reviewer's order. Without: every ticked one. */
  competitors: string[];
  /** Backend V3-398: the ones labelled nearby, in order. */
  nearby?: string[];
  reviewer_notes?: string;
};

/** Backend V3-398: what the reviewer says each candidate is. */
export type CompetitorLabel = 'direct' | 'nearby' | 'none';

/** The reviewer's labels: the direct ones in their order, then the nearby ones. */
export type CompetitorLabelling = { direct: string[]; nearby: string[] };

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
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

/** The same name in any case or spacing, as the backend compares them. */
export function competitorKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/'s\b/g, 's')
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ')
    .trim();
}

export function isCompetitorReviewTask(failureMode: unknown): boolean {
  const text = toText(failureMode);
  return text ? text.toLowerCase().replace(/[\s-]+/g, '_') === COMPETITOR_REVIEW_FAILURE_MODE : false;
}

function verdictOf(value: unknown): CompetitorReviewVerdict {
  const text = toText(value);
  return (COMPETITOR_REVIEW_VERDICTS as readonly string[]).includes(text ?? '')
    ? (text as CompetitorReviewVerdict)
    : // An unrecognised verdict is the reviewer's call, never a rejection.
      'unknown';
}

export function readCompetitorReviewModel(task: { questionPayload?: unknown }): CompetitorReviewModel | null {
  const payload = toRecord(task.questionPayload);
  const context = payload ? toRecord(field(payload, 'questionContext', 'question_context')) : null;
  if (!context) {
    return null;
  }
  const list = Array.isArray(context.candidates) ? context.candidates : [];
  const candidates = list.flatMap((value, index) => {
    const entry = toRecord(value);
    const name = entry ? toText(entry.name) : null;
    if (!entry || !name) {
      return [];
    }
    return [
      {
        rank: toCount(entry.rank) || index + 1,
        name,
        site: toText(entry.site),
        listing: entry.listing === true,
        clientNamed: field(entry, 'clientNamed', 'client_named') === true,
        verdict: verdictOf(entry.verdict),
        why: toText(entry.why),
        quote: toText(entry.quote),
      },
    ];
  });
  return {
    businessName: toText(field(context, 'businessName', 'business_name')),
    market: toText(context.market),
    enoughDirect: toCount(field(context, 'enoughDirect', 'enough_direct')),
    minimumDirect: (() => {
      const value = field(context, 'minimumDirect', 'minimum_direct');
      return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : null;
    })(),
    checked: toCount(context.checked),
    checkedAgainst: toText(field(context, 'checkedAgainst', 'checked_against')),
    otherCategories: (() => {
      const list = field(context, 'otherCategories', 'other_categories');
      return Array.isArray(list) ? list.flatMap((c) => (toText(c) ? [toText(c)!] : [])) : [];
    })(),
    flags: Array.isArray(context.flags) ? context.flags.flatMap((f) => (toText(f) ? [toText(f)!] : [])) : [],
    candidates,
    labels: field(payload!, 'competitorLabels', 'competitor_labels') === true,
  };
}

/** What the review starts with: the candidates the check confirmed. */
/**
 * The answer a reviewer already gave, as the form's starting state: the
 * approved competitors (in the list's own spelling where they are on it) and
 * the notes. Null when there is no answer to show, so the form starts from
 * the checked direct competitors. An answered review shows the answer given
 * (V3-369).
 */
export function readCompetitorReviewSubmitted(
  submitted: unknown,
  model: CompetitorReviewModel,
): { choice: string[]; notes: string } | null {
  const record = toRecord(submitted);
  const names = record && Array.isArray(record.competitors) ? record.competitors : [];
  const chosen = names.flatMap((name) => {
    const text = toText(name);
    return text ? [text] : [];
  });
  if (!record || chosen.length === 0) {
    return null;
  }
  return {
    choice: chosen.map(
      (name) => model.candidates.find((c) => competitorKey(c.name) === competitorKey(name))?.name ?? name,
    ),
    notes: toText(field(record, 'reviewerNotes', 'reviewer_notes')) ?? '',
  };
}

export function initialCompetitorChoice(model: CompetitorReviewModel): string[] {
  return model.candidates.filter((c) => c.verdict === 'direct').map((c) => c.name);
}

/** Each group with its candidates in rank order; every candidate in exactly one group. */
export function groupCompetitorCandidates(model: CompetitorReviewModel) {
  return COMPETITOR_REVIEW_GROUPS.map((group) => ({
    ...group,
    candidates: model.candidates.filter((c) => (group.verdicts as readonly string[]).includes(c.verdict)),
  }));
}

/** The answer, or every reason it cannot be sent: one or more, each on the list, none twice. */
export function buildCompetitorReviewAnswer(input: {
  model: CompetitorReviewModel;
  choice: readonly string[];
  notes?: string;
}): { answer: CompetitorReviewAnswer } | { error: string } {
  const reasons: string[] = [];
  const listed = new Map(input.model.candidates.map((c) => [competitorKey(c.name), c.name]));
  const seen = new Set<string>();
  const competitors: string[] = [];
  if (input.choice.length === 0) {
    reasons.push('Approve at least one competitor.');
  }
  for (const name of input.choice) {
    const key = competitorKey(name);
    const known = listed.get(key);
    if (!known) {
      reasons.push(`"${name}" is not on the list.`);
    } else if (seen.has(key)) {
      reasons.push(`"${known}" is chosen twice.`);
    } else {
      seen.add(key);
      competitors.push(known);
    }
  }
  const notes = toText(input.notes);
  // Step 11: fewer than the minimum goes on only with the reviewer's reason.
  const minimum = input.model.minimumDirect;
  if (minimum !== null && competitors.length > 0 && competitors.length < minimum && !notes) {
    reasons.push(
      `${competitors.length} approved, fewer than the ${minimum} a plan goes on with: approve more, or say in the notes why this market has fewer.`,
    );
  }
  if (notes && notes.length > COMPETITOR_REVIEW_NOTES_MAX_LENGTH) {
    reasons.push(`Notes are limited to ${COMPETITOR_REVIEW_NOTES_MAX_LENGTH} characters.`);
  }
  return reasons.length > 0
    ? { error: reasons.join(' ') }
    : { answer: { competitors, ...(notes ? { reviewer_notes: notes } : {}) } };
}

/**
 * Backend V3-398: the labels the form starts from - the answer already given,
 * or the check's verdicts: confirmed ones direct in list order, nearby ones
 * nearby, the rest not a competitor until the reviewer says otherwise.
 */
export function initialCompetitorLabelling(model: CompetitorReviewModel, submitted?: unknown): CompetitorLabelling {
  const record = toRecord(submitted);
  const known = (value: unknown) =>
    (Array.isArray(value) ? value : []).flatMap((name) => {
      const text = toText(name);
      const found = text ? model.candidates.find((c) => competitorKey(c.name) === competitorKey(text)) : undefined;
      return found ? [found.name] : [];
    });
  if (record && Array.isArray(record.competitors) && record.competitors.length > 0) {
    return { direct: known(record.competitors), nearby: known(record.nearby) };
  }
  return {
    direct: model.candidates.filter((c) => c.verdict === 'direct').map((c) => c.name),
    nearby: model.candidates.filter((c) => c.verdict === 'nearby').map((c) => c.name),
  };
}

export function competitorLabelOf(labelling: CompetitorLabelling, name: string): CompetitorLabel {
  const key = competitorKey(name);
  if (labelling.direct.some((n) => competitorKey(n) === key)) return 'direct';
  if (labelling.nearby.some((n) => competitorKey(n) === key)) return 'nearby';
  return 'none';
}

/** Moves a candidate to a label; a newly direct one joins the end of the order. */
export function setCompetitorLabel(
  labelling: CompetitorLabelling,
  name: string,
  label: CompetitorLabel,
): CompetitorLabelling {
  const key = competitorKey(name);
  if (competitorLabelOf(labelling, name) === label) return labelling;
  const direct = labelling.direct.filter((n) => competitorKey(n) !== key);
  const nearby = labelling.nearby.filter((n) => competitorKey(n) !== key);
  return {
    direct: label === 'direct' ? [...direct, name] : direct,
    nearby: label === 'nearby' ? [...nearby, name] : nearby,
  };
}

/** Moves a direct competitor up (-1) or down (+1) the order; the ends stay put. */
export function moveDirectCompetitor(labelling: CompetitorLabelling, name: string, step: -1 | 1): CompetitorLabelling {
  const key = competitorKey(name);
  const index = labelling.direct.findIndex((n) => competitorKey(n) === key);
  const target = index + step;
  if (index < 0 || target < 0 || target >= labelling.direct.length) return labelling;
  const direct = [...labelling.direct];
  [direct[index], direct[target]] = [direct[target], direct[index]];
  return { ...labelling, direct };
}

/**
 * Backend V3-398: the labelled answer, or every reason it cannot be sent - at
 * least one direct, each on the list, none in both lists.
 */
export function buildLabelledCompetitorAnswer(input: {
  model: CompetitorReviewModel;
  labelling: CompetitorLabelling;
  notes?: string;
}): { answer: CompetitorReviewAnswer } | { error: string } {
  const direct = buildCompetitorReviewAnswer({
    model: input.model,
    choice: input.labelling.direct,
    notes: input.notes,
  });
  const reasons: string[] = 'error' in direct ? [direct.error] : [];
  const listed = new Map(input.model.candidates.map((c) => [competitorKey(c.name), c.name]));
  const directKeys = new Set(input.labelling.direct.map(competitorKey));
  const seen = new Set<string>();
  const nearby: string[] = [];
  for (const name of input.labelling.nearby) {
    const key = competitorKey(name);
    const known = listed.get(key);
    if (!known) {
      reasons.push(`"${name}" is not on the list.`);
    } else if (directKeys.has(key) || seen.has(key)) {
      reasons.push(`"${known}" is labelled twice.`);
    } else {
      seen.add(key);
      nearby.push(known);
    }
  }
  if (reasons.length > 0 || 'error' in direct) {
    return { error: reasons.join(' ').replace('Approve at least one competitor.', 'Label at least one competitor direct.') };
  }
  return { answer: { ...direct.answer, nearby } };
}
