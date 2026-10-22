/**
 * The homepage's sections, in the order the page presents them
 * (features/landing/components/LandingPage.tsx), with the one label every nav
 * and the footer use for each. Labels follow what the section actually says,
 * so a link never promises something the reader does not find when they land.
 *
 * Each id is set on the section's own component; tests check every id here
 * resolves to exactly one element.
 */
export const HOME_SECTIONS = {
  why: { id: 'why-adcendy', label: 'Why AdCendy' },
  inside: { id: 'inside', label: 'Inside a strategy' },
  howItWorks: { id: 'how-it-works', label: 'How it works' },
  whoItsFor: { id: 'who-its-for', label: 'Is it for you' },
  pricing: { id: 'pricing', label: 'Pricing' },
  faq: { id: 'faq', label: 'FAQ' },
} as const;

/** Places inside a section that a link can land on directly. */
export const LANDING_SUB_TARGETS = {
  goodFit: { id: 'who-its-for-fit', label: 'Who it’s for' },
  notYetFit: { id: 'who-its-for-not-yet', label: 'Who it’s not for' },
  compare: { id: 'compare', label: 'AdCendy, freelancer or agency' },
  // Answered in the FAQ; the pricing card links here.
  oneMarket: { id: 'faq-one-market', label: 'What counts as one market' },
  // The audiences are described in this FAQ answer, not in a section.
  industries: { id: 'faq-industries', label: 'E-commerce, SaaS & services' },
} as const;

export type LandingTarget = { id: string; label: string };

/**
 * Sections that left the homepage for a page of their own. An old link to one
 * (/#why-not-ai, from an email or an ad) is sent on to where it lives now.
 */
export const MOVED_SECTIONS: Record<string, string> = {
  'why-not-your-team': '/approach#why-not-your-team',
  'why-not-ai': '/approach#why-not-ai',
  budget: '/approach#budget',
  'what-you-get': '/what-you-get',
  benchmarks: '/what-you-get#benchmarks',
  comparison: '/compare',
  manifesto: '/about',
};
