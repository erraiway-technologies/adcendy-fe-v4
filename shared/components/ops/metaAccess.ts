/**
 * Meta access (backend V3-401): the token the competitor Meta ads research
 * reads, its health, and the words the admin page shows for it. Pure, so
 * `node --test` can run it directly.
 */

export type MetaTokenStatus =
  'disabled' | 'active' | 'expiring_soon' | 'refreshed' | 'refresh_failed' | 'expired' | 'missing';

export type MetaTokenHealth = {
  status: MetaTokenStatus;
  message: string;
  expiresAt: string | null;
  daysRemaining: number | null;
  lastRefreshAt: string | null;
  needsReAuth: boolean;
};

export type MetaAccessView = {
  tone: 'ok' | 'warn' | 'bad' | 'off';
  headline: string;
  detail: string;
};

const STATUSES: readonly MetaTokenStatus[] = [
  'disabled',
  'active',
  'expiring_soon',
  'refreshed',
  'refresh_failed',
  'expired',
  'missing',
];

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** The health report as the endpoint returns it, wrapped or not; null when unreadable. */
export function readMetaTokenHealth(response: unknown): MetaTokenHealth | null {
  const outer = toRecord(response);
  const record = toRecord(outer?.data) ?? outer;
  if (!record || !STATUSES.includes(record.status as MetaTokenStatus)) {
    return null;
  }
  const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);
  return {
    status: record.status as MetaTokenStatus,
    message: text(record.message) ?? '',
    expiresAt: text(record.expiresAt),
    daysRemaining: typeof record.daysRemaining === 'number' ? record.daysRemaining : null,
    lastRefreshAt: text(record.lastRefreshAt),
    needsReAuth: record.needsReAuth === true,
  };
}

function formatDay(iso: string | null): string {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'unknown'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** What the page says about the token: one line, and what to do. */
export function describeMetaAccess(health: MetaTokenHealth): MetaAccessView {
  switch (health.status) {
    case 'disabled':
      return {
        tone: 'off',
        headline: 'Meta research is switched off',
        detail: 'Intelligence providers are disabled on this server, so no Meta token is used.',
      };
    case 'missing':
      return {
        tone: 'bad',
        headline: 'No Meta token saved',
        detail: 'Competitor Meta ads are not read. Paste a token below.',
      };
    case 'expired':
      return {
        tone: 'bad',
        headline: `Meta access expired on ${formatDay(health.expiresAt)}`,
        detail:
          'Competitor Meta ads are not read. An expired token cannot be renewed automatically - paste a new one below.',
      };
    case 'refresh_failed':
      return {
        tone: health.needsReAuth ? 'bad' : 'warn',
        headline: `Renewal failed - ${health.daysRemaining ?? 'a few'} days left`,
        detail: health.needsReAuth
          ? 'The token expires soon and could not be renewed. Paste a new one below.'
          : 'The system will try again. Paste a new token if this persists.',
      };
    case 'expiring_soon':
      return {
        tone: 'warn',
        headline: `Expires on ${formatDay(health.expiresAt)} (${health.daysRemaining ?? '?'} days)`,
        detail: 'It will be renewed automatically before then.',
      };
    case 'refreshed':
    case 'active':
      return health.expiresAt
        ? {
            tone: 'ok',
            headline: 'Meta access is working',
            detail: `Expires on ${formatDay(health.expiresAt)}; renewed automatically a day before.`,
          }
        : {
            tone: 'ok',
            headline: 'Meta access is working',
            detail: 'This token does not expire (a System User token). Nothing to renew.',
          };
  }
}
