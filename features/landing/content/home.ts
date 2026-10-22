/**
 * The homepage's copy. Commercial promises (days, rounds, minutes, pages) come
 * from BUSINESS_TERMS, so the page changes with them; the sample report the
 * reader shows lives in ./sample-report, and the FAQ in
 * ./faq (shared with the server's structured data).
 *
 * The page says each thing once: three value props carry the argument, the
 * sections after them show it, and the longer explanations live in the FAQ,
 * on /what-you-get, /approach and /compare (./pages), and on /about
 * (HOME_MANIFESTO). A section's `more` links to the page that explains it.
 */
import {
  BUSINESS_TERMS,
  numberWord,
  revisionRoundsLabel,
} from '@/shared/marketing/business-terms';

const { delivery, intake, support, calls, report, company } = BUSINESS_TERMS;

export const HOME_CTA_LABEL = 'Get your strategy →';

export const HOME_HERO = {
  headline: 'Market intelligence your team can act on',
  subline:
    'We read your market, a person checks every recommendation, and your team gets a strategy it can run from day one.',
  meta: `One market · one fee · in writing within ${delivery.businessDays} business days`,
} as const;

/** The three things AdCendy is, said once each. */
export const HOME_VALUE = {
  heading: 'Your team can execute. We tell them what to aim at.',
  props: [
    {
      label: 'Market intelligence',
      title: 'Your market as it stands today',
      body: 'Who you really compete with, what they run across ads and search, and the buyer searches nobody answers. Read from current data, not a model’s memory.',
    },
    {
      label: 'Human review',
      title: 'Checked by a person, every time',
      body: 'A strategist reads every strategy end to end. Each recommendation traces to its evidence; anything we couldn’t verify is marked unknown, never guessed.',
    },
    {
      label: 'Direction you own',
      title: 'A plan your team runs from day one',
      body: `Positioning, channels, messaging and a ${report.planDays}-day plan, each step with the metric that tells you it’s working. One fee, no retainer.`,
    },
  ],
  more: { href: '/approach', label: 'Why we work this way' },
} as const;

export const HOME_INSIDE = {
  heading: 'Inside a strategy',
  intro: `The questions it answers, from a sample ${report.pages} page strategy. The core takes ${report.readingTime} to read.`,
  more: { href: '/what-you-get', label: 'Everything you get' },
} as const;

export type StrategyQuestion = {
  question: string;
  answer: string;
  /** Index into SAMPLE_REPORT.chapters: the chapter that answers it. */
  chapter: number;
};

/** Each chapter of the sample report, as the question it answers. */
export const HOME_QUESTIONS: StrategyQuestion[] = [
  {
    question: 'Which buyer searches is no one answering?',
    answer: 'High-intent searches no competitor ranks or advertises for. Your fastest, cheapest wins.',
    chapter: 0,
  },
  {
    question: 'Who are you actually competing with?',
    answer: 'Every brand bidding on your buyers’ searches or running ads at them, and how each positions itself.',
    chapter: 1,
  },
  {
    question: 'What should you say that no one else is?',
    answer: 'A position in the gaps between competitors, with proof points your team can use in copy tomorrow.',
    chapter: 2,
  },
  {
    question: 'Where should the next marketing dollar go?',
    answer: 'A channel mix with the reason for each, tested against your budget, team and goals.',
    chapter: 3,
  },
  {
    question: 'What does your team do on Monday?',
    answer: `A ${report.planDays}-day plan in three phases, and the range that tells you each step is working.`,
    chapter: 4,
  },
];

export const HOME_TIMELINE = {
  heading: `${numberWord(delivery.businessDays, { sentenceStart: true })} days, in writing`,
  intro: `No calls required. ${revisionRoundsLabel({ sentenceStart: true })} and ${support.windowDays} days of written support included.`,
  steps: [
    {
      day: 'Day 0',
      title: `A ${intake.formMinutes}-minute intake`,
      body: 'Your product, audience, goals and the team you have. We read your website too, if you have one.',
    },
    {
      day: 'Days 1–2',
      title: 'We map your market',
      body: 'Your competitors, their ads and search, and where the openings are.',
    },
    {
      day: 'Day 3',
      title: 'A strategist reviews it',
      body: 'Every recommendation checked against the evidence, your budget and your team.',
    },
    {
      day: `Day ${delivery.businessDays}`,
      title: 'Your strategy lands',
      body: 'A working document your team owns, with a recorded walkthrough.',
    },
  ],
};

export const HOME_WHO_ITS_FOR = {
  heading: 'Built for teams with hands, but no head',
  intro: 'We’d rather you find out here than after you’ve paid.',
  fitHeading: 'A strong fit if',
  fit: [
    'You have people to execute (in-house, freelancers or an agency) but no senior strategist setting direction.',
    'You’re a founder who needs a coherent plan and a real read on your competitors.',
    'You want to see what competitors actually do, without weeks of compiling it.',
  ],
  notYetHeading: 'Not the right fit (yet) if',
  notYet: [
    'You need someone to run your marketing. That’s an agency.',
    'You already have a strong in-house strategy team.',
    'You’re on your own with no one to execute. A plan needs hands.',
  ],
  /** Where AdCendy sits next to the people who do the work. */
  compare: [
    {
      name: 'AdCendy',
      role: 'Direction',
      body: `Intelligence and a strategy your team owns. One fee, ready in ${delivery.businessDays} business days.`,
    },
    {
      name: 'Freelancer',
      role: 'Hands for one task',
      body: 'Runs your ads or makes your content. Paid per task.',
    },
    {
      name: 'Agency',
      role: 'Execution on retainer',
      body: 'Runs your marketing. A monthly retainer, and 30–90 days to ramp up.',
    },
  ],
  verdict: 'Start with AdCendy to know what to do. Bring in freelancers or an agency to do it.',
  more: { href: '/compare', label: 'Compare in detail' },
};

export const HOME_PRICING = {
  eyebrow: 'Pricing',
  heading: 'One market. One strategy. One fee.',
  body: 'One market is one country. No retainer and no credits; prices follow where you are.',
  callLabel: `Book a ${calls.fitCallMinutes}-min call`,
  includesHeading: 'Every market includes',
  includes: [
    'Market intelligence, and a strategy built on it that your team owns',
    'Human review: nothing ships without passing it',
    `${revisionRoundsLabel({ sentenceStart: true })}, asked for within ${support.revisionRequestDays} days of delivery`,
    `${support.windowDays} days of written support, answered within ${support.answerWithin}, with two reviews of your numbers`,
    `A recorded ${support.walkthroughVideo} walkthrough and one ${calls.walkthroughCallMinutes}-minute call`,
  ],
  packagesHeading: 'Priced by market',
  marketRuleLink: 'What counts as one market?',
  customQuote: {
    title: 'Multiple markets',
    body: 'Selling into countries these packages don’t cover? We run the same strategy for each country you name, and price it with you.',
    price: 'Let’s talk',
    priceNote: 'priced with you',
    cta: 'Book a call for a quote',
  },
  partnership: {
    lead: 'Running strategies for several clients?',
    link: 'Book a call about partnership',
    tail: '— we work with agencies and resellers directly.',
  },
};

/** The /about page: how we think about strategy, and who is behind AdCendy. */
export const HOME_MANIFESTO = {
  heading: 'How we think about marketing strategy',
  intro: 'Three things shaped how AdCendy works.',
  beliefs: [
    {
      title: 'Most marketing strategies fail because of bad inputs, not bad ideas.',
      body: 'Agencies skip research to hit deadlines. AI tools pattern-match instead of investigating. The output is generic because the input was generic. We invert that — research is where we spend the most time, not the least.',
    },
    {
      title: 'Founders need decisions they can act on, not suggestions to interpret.',
      body: 'A strategy that says “consider building a content engine” isn’t a strategy. We tell you what to build, why, and in what order — and we’re willing to be wrong in writing.',
    },
    {
      title: 'The process is the product, not the output.',
      body: `Lots of tools can generate a marketing strategy in 10 seconds. Ours takes up to ${delivery.businessDays} business days — because we spend them collecting real data about your actual market, analyzing it properly, and checking every recommendation against the evidence before it reaches you. The time is intentional. The rigour is the value.`,
    },
  ],
  company: { lead: 'AdCendy is a product of', name: company.legalName, url: company.url },
  pilotNote:
    'We’re starting with a small, limited pilot so the product is shaped by real client feedback, not built in a vacuum.',
};

export const HOME_FAQ = {
  heading: 'Frequently asked questions',
  intro: 'The detail behind everything above.',
} as const;

export const HOME_CLOSING = {
  heading: 'Your team has the hands. We bring direction.',
  lineLabel: 'Today',
  callLabel: `Prefer to talk first? Book a ${calls.fitCallMinutes}-minute call`,
  note: `A ${intake.formMinutes}-minute form, and your strategy within ${delivery.businessDays} business days.`,
} as const;

export const HOME_STICKY_CTA = {
  title: 'Know your market before your team moves',
  cta: 'Get your strategy',
} as const;

/** One line under the wordmark wherever the site's footer appears. */
export const SITE_TAGLINE = 'Market intelligence. Human review. Direction your team can own.';
