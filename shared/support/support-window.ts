/**
 * The support that comes with a delivered strategy (Terms of Service, section
 * 27), worked out from what the dashboard already has.
 *
 * Delivery is the moment the strategy's documents became visible to the
 * client: publishing sets every document's `availableAt` to it, and clients
 * cannot upload documents, so the earliest `availableAt` is the delivery.
 * Documents an admin attached without a date carry `null` and are ignored.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Terms of Service, section 27. */
export const SUPPORT_WINDOW_DAYS = 30;
export const REVISION_REQUEST_DAYS = 14;

/**
 * The private Zoho Bookings links for signed-in clients. Not secret - anyone
 * holding one can book - but kept off the public site: the walkthrough is for
 * delivered strategies, the quote call for multi-market quotes and partnerships.
 */
export const CLIENT_BOOKING_LINKS = {
  walkthroughCall: 'https://adcendy1.zohobookings.in/488505000000033012',
  quoteCall: 'https://adcendy1.zohobookings.in/488505000000033035',
} as const;

export interface SupportWindow {
  deliveredAt: Date;
  revisionRequestBy: Date;
  endsAt: Date;
  /** The 30-day window: answers, reviews and the walkthrough call. */
  open: boolean;
  /** The first 14 days, when the revision round can be requested. */
  revisionOpen: boolean;
}

export function supportWindow(
  documents: ReadonlyArray<{ availableAt: string | null }>,
  now: Date = new Date(),
): SupportWindow | null {
  const delivered = documents
    .map((document) => (document.availableAt ? Date.parse(document.availableAt) : Number.NaN))
    .filter((time) => Number.isFinite(time) && time <= now.getTime());
  if (delivered.length === 0) return null;

  const deliveredAt = new Date(Math.min(...delivered));
  const revisionRequestBy = new Date(deliveredAt.getTime() + REVISION_REQUEST_DAYS * DAY_MS);
  const endsAt = new Date(deliveredAt.getTime() + SUPPORT_WINDOW_DAYS * DAY_MS);
  return {
    deliveredAt,
    revisionRequestBy,
    endsAt,
    open: now.getTime() < endsAt.getTime(),
    revisionOpen: now.getTime() < revisionRequestBy.getTime(),
  };
}
