/**
 * The unmatched-channel hold (backend V3-154). A client named a channel they
 * run that the channel list does not have ("FB ads"), and the run waits on a
 * reviewer task. The reviewer maps each name to the channels it is - the
 * mapping is written into the intake and kept, so the next client who types
 * the name is understood - or flags it as a channel the list should have.
 *
 * The names and the channel list come with the task (`unmatched`,
 * `answer_options`): this file keeps no list of its own. Pure: reads the task
 * detail and builds the answer the template's answer schema validates. No
 * imports, so `node --test` can run it directly.
 */

export const UNMATCHED_CHANNEL_HOLD_FAILURE_MODE = 'unmatched_channel_hold';

/** The answer schema's limits. */
export const UNMATCHED_CHANNEL_MAX_IDS = 2;
export const UNMATCHED_CHANNEL_NOTES_MAX_LENGTH = 1200;

/** The backend's prefix when it refuses an answer. */
const REFUSAL_PREFIX = 'UNMATCHED_CHANNEL_ANSWER_REJECTED_V2:';

export type UnmatchedChannelHoldModel = {
  clientName: string | null;
  /** The names the intake held, as the client typed them. */
  names: Array<{ label: string; status: string | null }>;
  /** The channel list, labelled by the backend. */
  options: Array<{ value: string; label: string }>;
};

/** Per name: the channels it is, or flagged as a new channel. */
export type UnmatchedChannelDecision = { kind: 'map'; channelIds: string[] } | { kind: 'new_channel' };

export type UnmatchedChannelHoldAnswer = {
  mappings: Array<{ label: string; decision: 'map' | 'new_channel'; channel_ids?: string[] }>;
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

export function isUnmatchedChannelHoldTask(failureMode: unknown): boolean {
  return normalizeMode(failureMode) === UNMATCHED_CHANNEL_HOLD_FAILURE_MODE;
}

/**
 * The held names and the channel list from the task detail. Null when the
 * task carries no names or no list to build the form from.
 */
export function readUnmatchedChannelHoldModel(task: { questionPayload?: unknown }): UnmatchedChannelHoldModel | null {
  const payload = toRecord(task.questionPayload);
  const context = payload ? toRecord(field(payload, 'questionContext', 'question_context')) : null;
  if (!payload || !context) {
    return null;
  }
  const rawNames = field(context, 'unmatched', 'unmatched');
  const rawOptions = field(context, 'answerOptions', 'answer_options');
  const names = (Array.isArray(rawNames) ? rawNames : []).flatMap((entry) => {
    const record = toRecord(entry);
    const label = record ? toText(record.label) : null;
    return record && label ? [{ label, status: toText(record.status) }] : [];
  });
  const options = (Array.isArray(rawOptions) ? rawOptions : []).flatMap((entry) => {
    const record = toRecord(entry);
    const value = record ? toText(record.value) : null;
    return record && value ? [{ value, label: toText(record.label) ?? value }] : [];
  });
  if (names.length === 0 || options.length === 0) {
    return null;
  }
  return {
    clientName: toText(field(payload, 'clientName', 'client_name')),
    names,
    options,
  };
}

/**
 * The answer, or the reason it cannot be sent yet: every held name needs a
 * decision, and a mapped name needs one or two channels from the list.
 */
export function buildUnmatchedChannelHoldAnswer(input: {
  model: UnmatchedChannelHoldModel;
  decisions: Record<string, UnmatchedChannelDecision | undefined>;
  notes?: string;
}): { answer: UnmatchedChannelHoldAnswer } | { error: string } {
  const known = new Set(input.model.options.map((option) => option.value));
  const mappings: UnmatchedChannelHoldAnswer['mappings'] = [];
  for (const name of input.model.names) {
    const decision = input.decisions[name.label];
    if (!decision) {
      return { error: `Map "${name.label}" to a channel, or flag it as a new channel.` };
    }
    if (decision.kind === 'new_channel') {
      mappings.push({ label: name.label, decision: 'new_channel' });
      continue;
    }
    const channelIds = [...new Set(decision.channelIds)].filter((id) => known.has(id));
    if (channelIds.length === 0) {
      return { error: `Choose the channel "${name.label}" is.` };
    }
    if (channelIds.length > UNMATCHED_CHANNEL_MAX_IDS) {
      return { error: `"${name.label}" can be at most ${UNMATCHED_CHANNEL_MAX_IDS} channels.` };
    }
    mappings.push({ label: name.label, decision: 'map', channel_ids: channelIds });
  }
  const notes = toText(input.notes);
  if (notes && notes.length > UNMATCHED_CHANNEL_NOTES_MAX_LENGTH) {
    return { error: `Notes are limited to ${UNMATCHED_CHANNEL_NOTES_MAX_LENGTH} characters.` };
  }
  return { answer: { mappings, ...(notes ? { reviewer_notes: notes } : {}) } };
}

/**
 * The backend's reason for refusing an answer, without its code, or null
 * when the error is something else.
 */
export function readUnmatchedChannelRefusal(message: unknown): string | null {
  const text = toText(message);
  if (!text) {
    return null;
  }
  const index = text.indexOf(REFUSAL_PREFIX);
  return index === -1 ? null : text.slice(index + REFUSAL_PREFIX.length).trim() || null;
}
