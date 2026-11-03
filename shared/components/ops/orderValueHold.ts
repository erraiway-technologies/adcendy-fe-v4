/**
 * The order-value hold (backend V3-266). The intake's order value does not
 * fit the client's own price range or the market's currency - below the
 * lowest price, more than the configured multiple of the highest, or in
 * another currency - and the run waits on a reviewer task before any
 * research. The reviewer confirms the figure as given, or corrects it to the
 * order value in the market's currency; either way with the reason.
 *
 * What was held and why come with the task (`holds_summary`, `holds`): this
 * file keeps no rule of its own. Pure: reads the task detail and builds the
 * answer the template's answer schema validates. No imports, so `node --test`
 * can run it directly.
 */

export const ORDER_VALUE_HOLD_FAILURE_MODE = 'order_value_hold';

/** The answer schema's limits. */
export const ORDER_VALUE_REASON_MIN_LENGTH = 3;
export const ORDER_VALUE_TEXT_MAX_LENGTH = 1200;

/** The backend's prefix when it refuses an answer. */
const REFUSAL_PREFIX = 'ORDER_VALUE_ANSWER_REJECTED_V2:';

export type OrderValueHoldModel = {
  clientName: string | null;
  /** Each reason the intake was held, in the backend's words. */
  diagnoses: string[];
  /** The market's currency code the order value is read in. */
  marketCurrency: string | null;
  /** The order value and price range as the intake has them. */
  orderValue: string | null;
  priceRange: string | null;
};

export type OrderValueHoldAnswer =
  | { decision: 'confirm'; reason: string }
  | { decision: 'correct'; average_order_value: number; reason: string };

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

export function isOrderValueHoldTask(failureMode: unknown): boolean {
  return normalizeMode(failureMode) === ORDER_VALUE_HOLD_FAILURE_MODE;
}

/** What was held, from the task detail. Null when the task says nothing held. */
export function readOrderValueHoldModel(task: { questionPayload?: unknown }): OrderValueHoldModel | null {
  const payload = toRecord(task.questionPayload);
  if (!payload) {
    return null;
  }
  const context = toRecord(field(payload, 'questionContext', 'question_context')) ?? {};
  const holds = field(context, 'holds', 'holds');
  const diagnoses = (Array.isArray(holds) ? holds : []).flatMap((entry) => {
    const record = toRecord(entry);
    const diagnosis = record ? toText(record.diagnosis) : null;
    return diagnosis ? [diagnosis] : [];
  });
  const summary = toText(field(payload, 'holdsSummary', 'holds_summary'));
  if (diagnoses.length === 0 && !summary) {
    return null;
  }
  return {
    clientName: toText(field(payload, 'clientName', 'client_name')),
    diagnoses: diagnoses.length > 0 ? diagnoses : [summary as string],
    marketCurrency: toText(field(context, 'marketCurrency', 'market_currency')),
    orderValue: toText(field(context, 'averageOrderValue', 'average_order_value')),
    priceRange: toText(field(context, 'priceRange', 'price_range')),
  };
}

/**
 * The answer, or the reason it cannot be sent yet: a decision, a reason, and
 * for a correction a positive amount.
 */
export function buildOrderValueHoldAnswer(input: {
  decision: 'confirm' | 'correct' | null;
  amount?: string;
  reason?: string;
}): { answer: OrderValueHoldAnswer } | { error: string } {
  if (!input.decision) {
    return { error: 'Confirm the order value as given, or correct it.' };
  }
  const reason = toText(input.reason);
  if (!reason || reason.length < ORDER_VALUE_REASON_MIN_LENGTH) {
    return {
      error:
        input.decision === 'confirm'
          ? 'Give the reason the figure is right.'
          : 'Give the reason, and where the correct figure comes from.',
    };
  }
  if (reason.length > ORDER_VALUE_TEXT_MAX_LENGTH) {
    return { error: `The reason is limited to ${ORDER_VALUE_TEXT_MAX_LENGTH} characters.` };
  }
  if (input.decision === 'confirm') {
    return { answer: { decision: 'confirm', reason } };
  }
  const text = toText(input.amount)?.replace(/,/g, '') ?? '';
  const amount = /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : NaN;
  if (!(amount > 0)) {
    return { error: 'Enter the order value as a positive amount.' };
  }
  return { answer: { decision: 'correct', average_order_value: amount, reason } };
}

/**
 * The backend's reason for refusing an answer, without its code, or null
 * when the error is something else.
 */
export function readOrderValueRefusal(message: unknown): string | null {
  const text = toText(message);
  if (!text) {
    return null;
  }
  const index = text.indexOf(REFUSAL_PREFIX);
  return index === -1 ? null : text.slice(index + REFUSAL_PREFIX.length).trim() || null;
}
