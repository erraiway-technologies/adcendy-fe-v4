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
  },
  intake: {
    formMinutes: 15,
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
  },
  /** Terms of Service, section 27: calls are optional, by video, booked. */
  calls: {
    fitCallMinutes: 20,
    quoteCallMinutes: 30,
    walkthroughCallMinutes: 30,
    hours: 'Monday to Friday, 1:30–9:30 pm IST',
  },
  contact: {
    /** Before buying: questions, quotes, partnerships. */
    hello: 'hello@adcendy.com',
    /** Paying clients. */
    support: 'support@adcendy.com',
    /** Personal data requests. */
    privacy: 'privacy@adcendy.com',
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
  pilotGuarantee: {
    /** Fewer actionable opportunities than this and the pilot fee is refunded. */
    minimumOpportunities: 3,
  },
  report: {
    /** The whole package - strategy, research and guidance - as erraiway.com states it too. */
    pages: '30–50',
    readingTime: '~1 hour',
  },
} as const;

/** Worded exactly as the Refund Policy's pilot clause. */
export const PILOT_GUARANTEE_TEXT = `If your strategy doesn't surface at least ${BUSINESS_TERMS.pilotGuarantee.minimumOpportunities} specific, actionable opportunities you didn't already know about, we'll refund the pilot fee. No questions, no forms.`;

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
