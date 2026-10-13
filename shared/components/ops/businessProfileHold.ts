/**
 * The business-profile hold (backend V3-78 P0b, frontend V3-94). When the
 * intake does not settle what kind of business this is - how a sale closes,
 * who buys, what is sold, where it sells, how heavy the decision is, how the
 * money comes in - the run waits on a reviewer task. The reviewer corrects the
 * answers that are wrong, each with a reason, and the backend rebuilds the
 * profile with them; an answer that leaves a hold or makes an illegal pair is
 * refused, naming why, and the task stays open.
 *
 * The questions and the answers each allows come with the task
 * (`answer_options`), labelled by the backend: this file keeps no list of its
 * own. Pure: reads the task detail and builds the answer the template's answer
 * schema validates. No imports, so `node --test` can run it directly.
 */

export const BUSINESS_PROFILE_HOLD_FAILURE_MODE = 'business_profile_hold';

/** The answer schema's limits. */
export const PROFILE_HOLD_MAX_ANSWERS = 6;
export const PROFILE_HOLD_REASON_MIN_LENGTH = 10;
export const PROFILE_HOLD_REASON_MAX_LENGTH = 600;
export const PROFILE_HOLD_NOTES_MAX_LENGTH = 1200;

/** The backend's prefix when it refuses an answer. */
const REFUSAL_PREFIX = 'BUSINESS_PROFILE_OVERRIDE_REJECTED_V2:';

export type ProfileHoldQuestion = {
  question: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  /** The answer the intake gave, or null when it gave none. */
  current: string | null;
};

export type ProfileHold = {
  code: string;
  questions: string[];
  diagnosis: string;
};

export type BusinessProfileHoldModel = {
  clientName: string | null;
  marketLabel: string | null;
  holds: ProfileHold[];
  /** Every question, held ones first. */
  questions: ProfileHoldQuestion[];
  /** The questions a hold names: these need an answer. */
  heldQuestions: string[];
};

export type BusinessProfileHoldAnswer = {
  answers: Array<{ question: string; value: string; reason: string }>;
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

/** A field under its camelCase name, as the task detail sends it, else snake_case. */
function field(record: Record<string, unknown>, camel: string, snake: string): unknown {
  return record[camel] ?? record[snake];
}

function normalizeMode(value: unknown): string | null {
  const text = toText(value);
  return text ? text.toLowerCase().replace(/[\s-]+/g, '_') : null;
}

export function isBusinessProfileHoldTask(failureMode: unknown): boolean {
  return normalizeMode(failureMode) === BUSINESS_PROFILE_HOLD_FAILURE_MODE;
}

function readHolds(value: unknown): ProfileHold[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    const record = toRecord(entry);
    const diagnosis = record ? toText(record.diagnosis) : null;
    if (!record || !diagnosis) {
      return [];
    }
    return [
      {
        code: toText(record.code) ?? 'hold',
        questions: Array.isArray(record.questions)
          ? record.questions.flatMap((question) => {
              const text = toText(question);
              return text ? [text] : [];
            })
          : [],
        diagnosis,
      },
    ];
  });
}

/**
 * The holds, the questions and their answers from the task detail: its
 * current values to fix, else the question context it was asked with. Null
 * when the task carries no answer options to build the form from.
 */
export function readBusinessProfileHoldModel(task: {
  currentValuesToFix?: unknown;
  questionPayload?: unknown;
}): BusinessProfileHoldModel | null {
  const payload = toRecord(task.questionPayload);
  const context = payload ? toRecord(field(payload, 'questionContext', 'question_context')) : null;
  const source = toRecord(task.currentValuesToFix) ?? context;
  if (!source) {
    return null;
  }
  const rawOptions = field(source, 'answerOptions', 'answer_options') ?? (context ? field(context, 'answerOptions', 'answer_options') : null);
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return null;
  }
  const answers = toRecord(source.answers) ?? (context ? toRecord(context.answers) : null) ?? {};
  const holds = readHolds(source.holds ?? context?.holds);
  const heldQuestions = [...new Set(holds.flatMap((hold) => hold.questions))];
  const questions = rawOptions.flatMap((entry): ProfileHoldQuestion[] => {
    const record = toRecord(entry);
    const question = record ? toText(record.question) : null;
    if (!record || !question || !Array.isArray(record.options)) {
      return [];
    }
    const options = record.options.flatMap((option) => {
      const optionRecord = toRecord(option);
      const value = optionRecord ? toText(optionRecord.value) : null;
      return optionRecord && value ? [{ value, label: toText(optionRecord.label) ?? value }] : [];
    });
    return [
      {
        question,
        label: toText(record.label) ?? question,
        options,
        current: toText(answers[question]),
      },
    ];
  });
  questions.sort(
    (left, right) =>
      Number(heldQuestions.includes(right.question)) - Number(heldQuestions.includes(left.question)),
  );
  return {
    clientName: toText(field(source, 'clientName', 'client_name')) ?? (payload ? toText(field(payload, 'clientName', 'client_name')) : null),
    marketLabel: toText(field(source, 'marketLabel', 'market_label')) ?? (payload ? toText(field(payload, 'marketLabel', 'market_label')) : null),
    holds,
    questions,
    heldQuestions,
  };
}

/** The label of an answer, as the backend gave it. */
export function answerLabel(question: ProfileHoldQuestion, value: string | null): string {
  if (!value) {
    return 'not known';
  }
  return question.options.find((option) => option.value === value)?.label ?? value;
}

/**
 * The answer, or the reason it cannot be sent yet. Only questions the reviewer
 * changed are sent; every held question needs an answer, and every answer a
 * reason of at least ten characters - how the business actually works.
 */
export function buildBusinessProfileHoldAnswer(input: {
  model: BusinessProfileHoldModel;
  /** question -> the chosen value and its reason; untouched questions absent. */
  edits: Record<string, { value: string; reason: string }>;
  notes?: string;
}): { answer: BusinessProfileHoldAnswer } | { error: string } {
  const byQuestion = new Map(input.model.questions.map((question) => [question.question, question]));
  const answers: BusinessProfileHoldAnswer['answers'] = [];
  for (const [question, edit] of Object.entries(input.edits)) {
    const entry = byQuestion.get(question);
    const value = toText(edit.value);
    if (!entry || !value) {
      continue;
    }
    if (!entry.options.some((option) => option.value === value)) {
      return { error: `"${value}" is not an answer to ${entry.label.toLowerCase()}.` };
    }
    const reason = (edit.reason ?? '').trim();
    if (reason.length < PROFILE_HOLD_REASON_MIN_LENGTH) {
      return {
        error: `Give a reason for "${entry.label}" of at least ${PROFILE_HOLD_REASON_MIN_LENGTH} characters: how the business actually works.`,
      };
    }
    if (reason.length > PROFILE_HOLD_REASON_MAX_LENGTH) {
      return { error: `The reason for "${entry.label}" is limited to ${PROFILE_HOLD_REASON_MAX_LENGTH} characters.` };
    }
    answers.push({ question, value, reason });
  }
  const unanswered = input.model.heldQuestions.filter(
    (question) => byQuestion.has(question) && !answers.some((answer) => answer.question === question),
  );
  if (unanswered.length > 0) {
    return {
      error: `Answer ${unanswered.map((question) => `"${byQuestion.get(question)?.label ?? question}"`).join(' and ')}: the hold names ${unanswered.length === 1 ? 'it' : 'them'}.`,
    };
  }
  if (answers.length === 0) {
    return { error: 'Change at least one answer, with its reason.' };
  }
  if (answers.length > PROFILE_HOLD_MAX_ANSWERS) {
    return { error: `Send at most ${PROFILE_HOLD_MAX_ANSWERS} answers.` };
  }
  const notes = toText(input.notes);
  if (notes && notes.length > PROFILE_HOLD_NOTES_MAX_LENGTH) {
    return { error: `Notes are limited to ${PROFILE_HOLD_NOTES_MAX_LENGTH} characters.` };
  }
  return { answer: { answers, ...(notes ? { reviewer_notes: notes } : {}) } };
}

/**
 * The backend's reason for refusing an answer, without its code, or null
 * when the error is something else.
 */
export function readProfileHoldRefusal(message: unknown): string | null {
  const text = toText(message);
  if (!text) {
    return null;
  }
  const index = text.indexOf(REFUSAL_PREFIX);
  return index === -1 ? null : text.slice(index + REFUSAL_PREFIX.length).trim() || null;
}
