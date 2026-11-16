/**
 * The reviewer inbox, as a reviewer reads it: one group per client, one line
 * per thing to do. Only what is known is printed; an unknown field is left
 * out, never shown as "Unknown" or "Not available".
 *
 * Pure, no imports, so `node --test` can run it directly.
 */

export type InboxGroup<T> = {
  key: string;
  client: string;
  market: string | null;
  items: T[];
  /** The newest item's time, for ordering groups. */
  latest: number;
};

type Groupable = {
  id: string;
  marketId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function text(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mode(value: unknown): string | null {
  const t = text(value);
  return t ? t.toLowerCase().replace(/[\s-]+/g, '_') : null;
}

export function inboxTime(item: { createdAt?: string | null; updatedAt?: string | null }): number {
  const raw = text(item.updatedAt) ?? text(item.createdAt);
  const parsed = raw ? Date.parse(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

/** The client's name with no ids; the campaign title only when there is no name. */
export function inboxClientName(item: {
  campaignBusinessName?: string | null;
  clientName?: string | null;
  campaignTitle?: string | null;
}): string {
  return text(item.campaignBusinessName) ?? text(item.clientName) ?? text(item.campaignTitle) ?? 'Unnamed client';
}

/**
 * Items grouped by client and market (a reviewer thinks in clients, not
 * runs; each line keeps its own run), newest group first and newest item
 * first inside a group. Every item lands in exactly one group.
 */
export function groupInboxItems<T extends Groupable>(
  items: readonly T[],
  clientOf: (item: T) => string,
): InboxGroup<T>[] {
  const groups = new Map<string, InboxGroup<T>>();
  for (const item of items) {
    const market = text(item.marketId);
    const client = clientOf(item);
    const key = `${client.toLowerCase()}|${(market ?? '').toLowerCase()}`;
    const group = groups.get(key) ?? { key, client, market, items: [], latest: 0 };
    group.items.push(item);
    group.latest = Math.max(group.latest, inboxTime(item));
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, items: [...group.items].sort((a, b) => inboxTime(b) - inboxTime(a)) }))
    .sort((a, b) => b.latest - a.latest || a.client.localeCompare(b.client));
}

/** Groups whose client or market contains the query, in any case. */
export function filterInboxGroups<T>(groups: InboxGroup<T>[], query: string): InboxGroup<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return groups;
  }
  return groups.filter((g) => g.client.toLowerCase().includes(q) || (g.market ?? '').toLowerCase().includes(q));
}

/** "Required output hold" from "required_output_hold". */
export function humanizeInboxValue(value: string): string {
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : value;
}

/** What the reviewer is asked to do, in one line. */
export function reviewerTaskHeadline(task: { failureMode?: string | null; category?: string | null }): string {
  switch (mode(task.failureMode)) {
    case 'research_setup_keywords':
      return 'Approve the keywords for each search';
    case 'research_setup_competitors':
      return 'Approve the direct competitors';
    case 'research_setup_core_searches':
      return 'Choose the searches research starts from';
    default: {
      const failure = text(task.failureMode);
      return failure ? humanizeInboxValue(failure) : 'Reviewer input needed';
    }
  }
}

/** "Today, 7:13 PM", "Yesterday, 9:02 AM", "6 Nov, 11:54 AM"; null when unknown. */
export function formatInboxTime(value: string | null | undefined, now: Date = new Date()): string | null {
  const raw = text(value);
  const parsed = raw ? new Date(raw) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }
  const time = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .format(parsed)
    .toUpperCase();
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(parsed)) / 86_400_000);
  if (diff === 0) {
    return `Today, ${time}`;
  }
  if (diff === 1) {
    return `Yesterday, ${time}`;
  }
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(parsed.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  }).format(parsed);
  return `${date}, ${time}`;
}
