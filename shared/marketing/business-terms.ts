/**
 * Commercial promises the marketing pages make, in one place. Change a term
 * here and every page that states it follows.
 *
 * These are copy, not contract: the binding terms are the policies the Backend
 * publishes (served by the legal API, shown at their public paths such as
 * /refund-policy and /delivery-policy). Keep the two saying the same thing.
 */
export const BUSINESS_TERMS = {
  company: {
    legalName: 'Erraiway Technologies LLP',
    /** The company's own site: who is behind AdCendy lives there, not here. */
    url: 'https://www.erraiway.com',
  },
  delivery: {
    /**
     * The Digital Delivery Policy's commitment: delivered within this many
     * business days of confirming the inputs are complete. The policy wins;
     * copy states only this, never per-stage timings.
     */
    businessDays: 4,
    /**
     * How long most strategies actually take. Copy leads with this; the
     * policy's ceiling above is said only where the commitment matters
     * (the FAQ, the policy itself), never as the headline.
     */
    typically: 'a day or two',
  },
  intake: {
    formMinutes: '20–30',
  },
  revisionRoundsIncluded: 1,
  /** Terms of Service, section 27: support after delivery. */
  support: {
    windowDays: 30,
    /** Written answers, within this, for the whole window. */
    answerWithin: 'one business day',
    /** The revision round is requested within this many days of delivery... */
    revisionRequestDays: 14,
    /** ...and delivered within this many business days. */
    revisionBusinessDays: 3,
    walkthroughVideo: '10–15 minute',
    /** Results checks: on these days after delivery you send your numbers... */
    resultsCheckDays: [14, 30],
    /** ...and get a written readout within this. */
    readoutWithin: 'two business days',
  },
  /** The refund guarantee: a written claim within this many days of delivery. */
  refund: {
    claimDays: 7,
  },
  /** Terms of Service, section 27: calls are optional, by video, booked. */
  calls: {
    fitCallMinutes: 20,
    quoteCallMinutes: 30,
    walkthroughCallMinutes: 30,
    /** The walkthrough call is booked at least this many hours ahead. */
    walkthroughNoticeHours: 48,
  },
  contact: {
    /** Before buying: questions, quotes, partnerships. */
    hello: 'hello@adcendy.com',
    /** Paying clients. */
    support: 'support@adcendy.com',
    /** Personal data requests. */
    privacy: 'privacy@adcendy.com',
    /** Data access and deletion requests are completed within this many days. */
    privacyRequestDays: 30,
    replyWithin: 'one business day',
    /**
     * The fit call's booking page (Zoho Bookings). Null sends visitors to
     * email hello@ to book instead. The walkthrough call has a private link,
     * offered only in the signed-in dashboard (shared/support/support-window.ts).
     */
    bookingUrl: 'https://adcendy1.zohobookings.in/488505000000030046' as string | null,
    /** Multi-market quotes and agency partnerships: a public booking page too. */
    quoteBookingUrl: 'https://adcendy1.zohobookings.in/488505000000033035',
  },
  report: {
    /** The whole package - strategy, research and guidance - as erraiway.com states it too. */
    pages: '30–50',
    readingTime: '~1 hour',
    /** The Action Plan's length, in three phases, as the Backend's roadmap builds it. */
    planDays: 180,
    planPhases: 'days 0–30, 31–90 and 91–180',
  },
} as const;

/** "within 4 business days" */
export function deliveryWindowLabel(): string {
  return `within ${BUSINESS_TERMS.delivery.businessDays} business days`;
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'] as const;

/** "four"; "Four" at a sentence start. Falls back to digits past five. */
export function numberWord(count: number, { sentenceStart = false }: { sentenceStart?: boolean } = {}): string {
  const word = NUMBER_WORDS[count] ?? String(count);
  return sentenceStart ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** "one revision round", "two revision rounds"; "One revision round" at a sentence start. */
export function revisionRoundsLabel(
  { sentenceStart = false }: { sentenceStart?: boolean } = {},
  count: number = BUSINESS_TERMS.revisionRoundsIncluded,
): string {
  return `${numberWord(count, { sentenceStart })} revision round${count === 1 ? '' : 's'}`;
}

/** The refund guarantee, for every client; to be worded exactly as the Refund Policy. */
export const REFUND_GUARANTEE_TEXT = `Within ${BUSINESS_TERMS.refund.claimDays} days of delivery, tell us in writing which claim, number or section is wrong or unusable for your business. We correct it in one revision within ${numberWord(BUSINESS_TERMS.support.revisionBusinessDays)} business days. If that revision doesn't fix it, we refund the full amount to your original payment method. That's the whole policy. We ask for a written reason because it's how we improve the product, not to make refunds hard.`;

/**
 * Where to book a call: the booking page once it exists, an email to hello@
 * until then.
 */
export function callBookingLink(): { href: string; external: boolean } {
  const { bookingUrl, hello } = BUSINESS_TERMS.contact;
  return bookingUrl
    ? { href: bookingUrl, external: true }
    : { href: `mailto:${hello}?subject=${encodeURIComponent('Booking a call')}`, external: false };
}

export function copyrightNotice(now: Date = new Date()): string {
  return `© ${now.getFullYear()} ${BUSINESS_TERMS.company.legalName}. All rights reserved.`;
}
