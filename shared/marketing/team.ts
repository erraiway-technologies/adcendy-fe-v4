/**
 * The people behind AdCendy, as the site introduces them. The FAQ's "Who
 * actually reviews my strategy?" names the reviewer too: keep the two in step.
 */
export interface TeamMember {
  name: string;
  role: string;
  about: string;
  /** Public profile, when the person wants one shown. */
  linkedinUrl?: string;
}

export const TEAM: readonly TeamMember[] = [
  {
    name: 'Meha Khatri',
    role: 'Founder, client lead',
    about:
      'Your point of contact from intake to delivery: onboarding, questions, and support during your 30-day window.',
  },
  {
    name: 'Mridul Hemani',
    role: 'Lead technical architect, product & review',
    about:
      '7+ years building data-heavy backend systems for fintech and multi-tenant platforms. Built the engine that maps your market, and personally reviews every report before it ships.',
    linkedinUrl: 'https://www.linkedin.com/in/mdkmridul',
  },
];
