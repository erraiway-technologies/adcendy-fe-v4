/**
 * The copy of the pages the homepage links out to: /what-you-get, /approach
 * and /compare. The homepage says each thing once and briefly; these pages
 * hold the full explanations. Commercial promises come from BUSINESS_TERMS.
 */
import { BUSINESS_TERMS } from '@/shared/marketing/business-terms';
import { SAMPLE_REPORT, chapterNumber } from './sample-report';

const { delivery, intake, report } = BUSINESS_TERMS;
const PLAN = `${report.planDays}-day plan`;

/** A page the homepage links out to, and the line that links it. */
export const LEARN_MORE_PAGES = {
  whatYouGet: { href: '/what-you-get', label: 'What you get' },
  approach: { href: '/approach', label: 'Our approach' },
  compare: { href: '/compare', label: 'Compare in detail' },
} as const;

// ---------------------------------------------------------------- /what-you-get

export const WHAT_YOU_GET_PAGE = {
  eyebrow: 'What you get',
  heading: 'Everything inside a strategy, and what happens around it',
  intro: 'Intelligence first, then the direction built on it. The document is just how it reaches your team.',
} as const;

export const WHAT_YOU_GET = {
  heading: 'What you get — and what you don’t',
  meta: `The whole package: about ${report.pages} pages · Core strategy: ${report.readingTime} to read · Acting on it: starts day one`,
  deliverables: [
    {
      title: 'Competitive & market intelligence',
      body: 'How your competitors position themselves, what they’re doing across advertising and search, and the gaps no one’s filling.',
    },
    { title: 'Positioning audit', body: 'What you’re saying vs. what your market actually hears.' },
    { title: 'ICP refinement', body: `The specific buyer this ${PLAN} targets.` },
    {
      title: 'Keyword & channel direction',
      body: 'Where the openings are — paid, organic, content, partnerships — with the rationale for each.',
    },
    { title: 'Messaging framework', body: 'Angles, hooks, and copy patterns built around your audience.' },
    {
      title: `A ${PLAN}`,
      body: `What your team should aim at in each phase (${report.planPhases}), in priority order.`,
    },
  ],
  providesHeading: 'What AdCendy provides',
  provides: [
    'A full competitive and market intelligence workup — competitor positioning, their advertising and search approach in plain terms, keyword and channel opportunities, and the gaps in your market.',
    'A marketing strategy built on that intelligence — priorities, positioning, channel and messaging direction, grounded in your unit economics.',
    'Delivered as a clear document your team owns, executes, and refines — not a black box.',
    'A strategic starting point built on real market evidence, without a consultant’s timeline or retainer.',
  ],
  doesNotHeading: 'What AdCendy does not do',
  doesNot: [
    'We don’t run your marketing. No ad management or ad-account audits, no content production or creative reviews, no campaign execution.',
    'We’re not an agency or a done-for-you service.',
    'We don’t replace your marketing team — we give them direction and intelligence to act on.',
    'We’re not useful if you have no way to execute (no team, no freelancers, no capacity). A plan needs hands to run it.',
  ],
};

export type StrategyQuestionDetail = {
  question: string;
  answer: string;
  /** Index into SAMPLE_REPORT.chapters: the chapter that answers it. */
  chapter: number;
};

export const STRATEGY_QUESTIONS = {
  heading: 'Questions your strategy answers',
  items: [
    {
      question: 'Who are you actually competing with?',
      answer:
        'Often not who you think. We map every brand bidding on your buyers’ searches and running ads at them — and how each one positions itself.',
      chapter: 1,
    },
    {
      question: 'Which buyer searches is no one answering?',
      answer:
        'High-intent searches where no competitor ranks or advertises well. These are your fastest, cheapest wins.',
      chapter: 0,
    },
    {
      question: 'What should you say that no one else is saying?',
      answer:
        'A position grounded in the gaps between competitors, with proof points your team can use in copy tomorrow.',
      chapter: 2,
    },
    {
      question: 'Where should the next marketing dollar go?',
      answer: 'A channel mix with the rationale for each — tested against your budget, team and goals.',
      chapter: 3,
    },
    {
      question: 'What does your team do on Monday?',
      answer: `A ${PLAN} in three phases (${report.planPhases}), with priorities in order and the metric range that tells you each step is working.`,
      chapter: 4,
    },
  ] satisfies StrategyQuestionDetail[],
};

/** "Chapter 02 · Competitor landscape" */
export function chapterReference(chapter: number): string {
  return `Chapter ${chapterNumber(chapter)} · ${SAMPLE_REPORT.chapters[chapter]?.title ?? ''}`;
}

/** How a strategy is made, each step in full; the homepage shows it in brief. */
export const TIMELINE_DETAIL = {
  heading: 'How it works, step by step',
  intro: `Most strategies are ready in ${delivery.typically}, and never take more than ${delivery.businessDays} business days.`,
  steps: [
    {
      title: 'Intake',
      body: `A guided ${intake.formMinutes}-minute intake captures your product, audience, goals, and the team you have to execute. If you have a website, we analyze it for positioning, trust signals, and how it converts.`,
    },
    {
      title: 'Market map',
      body: 'What your competitors are doing across advertising and search, where the keyword and channel opportunities sit, and how your market positions itself — as it stands today.',
    },
    {
      title: 'Initial strategy draft',
      body: `Positioning, channels, messaging and the ${PLAN}, built on the market map. Every recommendation is tied to the evidence behind it from the start.`,
    },
    {
      title: 'Reviewer intake & improvements',
      body: 'A strategist reads the draft against the market data and your intake: is every claim supported, does it fit your budget, team and goals, is anything unverified slipping through? They send back what must change, or ask for more data.',
    },
    {
      title: 'Strategy rewrite',
      body: 'The draft is rewritten to answer every note. Anything the evidence can’t support is cut, and anything we couldn’t verify is marked unknown, never filled in with a guess.',
    },
    {
      title: 'Reviewer approval',
      body: 'A final read, end to end. The reviewer can still reject it or send it back; nothing ships until they sign it off.',
    },
    {
      title: 'Delivery',
      body: `Not a pitch deck. A working document with the intelligence, positioning, messaging, channel direction and a ${PLAN} — plus a recorded walkthrough.`,
    },
  ],
  /** Steps 4 and 5 (0-based 3 and 4) repeat until the reviewer is satisfied. */
  loop: { from: 3, to: 4, label: 'Steps 4 and 5 repeat until the reviewer is satisfied.' },
};

export const BENCHMARKS = {
  heading: 'You’ll know if it’s working — without guessing',
  intro:
    'Most strategies hand you actions and leave you wondering whether they’re landing. Ours tells you what to watch, and what “on track” looks like — before you start.',
  points: [
    {
      title: 'Every play comes with a target',
      body: 'For each recommendation: the metric that tells you it’s working, and the range you should expect it to move into — grounded in your category and your unit economics.',
    },
    {
      title: 'You read your own numbers',
      body: 'You check your results against the ranges in the plan. In range, you’re on track — keep going. Outside it, you know early, not three months in.',
    },
    {
      title: 'We help you read what they mean',
      body: 'During your support window, if a number’s off, we help you diagnose why — a setup issue, an execution gap, or a real reason to adjust the plan. You’re never staring at a dashboard alone.',
    },
  ],
  footnote: 'Honest ranges, not vanity promises — set wide enough to mean something, specific enough to act on.',
};

export const MARKET_RULES = {
  heading: 'What counts as one market',
  rules: [
    {
      title: 'One market is one country.',
      body: 'A strategy covers a single country, end to end — the competitors in it, the searches your buyers run in it, the openings inside it.',
    },
    {
      title: 'National only. No city or state strategies.',
      body: 'The competitor advertising data we read is published at country level. A city strategy would be national data wearing a local label, so we don’t sell one.',
    },
    {
      title: 'Your city still shows up in it.',
      body: 'What buyers near you actually search, and which competitors hold presence where you are, get read and folded into the national strategy.',
    },
  ],
};

// ---------------------------------------------------------------- /approach

export const APPROACH_PAGE = {
  eyebrow: 'Our approach',
  heading: 'Why AdCendy works the way it does',
  intro: 'Why the hard part isn’t your team’s to staff, why we use AI the way we do, and why the strategy is the cheap part.',
} as const;

export const WHY_NOT_YOUR_TEAM = {
  lead: 'Most teams can execute. What they’re missing is someone to tell them what to aim at.',
  aside: 'We’re not an agency, and it isn’t AI-generated. A person reads every strategy, end to end, before it reaches you.',
  detail: [
    'The hard part isn’t writing a plan — it’s the intelligence underneath it. Decoding what every competitor in your market is doing across advertising and search, finding the keyword and channel openings, and turning it into direction is days of specialized work per cycle.',
    'AdCendy does the part that’s expensive to staff. Your team does what they’re good at: making it happen.',
  ],
} as const;

export const WHY_NOT_AI = {
  heading: 'AI-powered, human-judged — not AI-generated',
  intro:
    'The difference between a generic strategy and one that actually fits your market is where the intelligence comes from — and who signs off on it.',
  contrast: [
    {
      title: 'AI-generated',
      body: 'A model guessing from the few lines you typed into it. That is what a free tool or a $20 chatbot gives you: fluent, confident, and built on nothing but your own inputs and whatever it absorbed before your market moved.',
    },
    {
      title: 'AI-powered',
      body: 'AI doing the heavy lifting — reading real, current market data at a scale no person could work through by hand. The judgment about what it means and what you should do about it stays human.',
    },
  ],
  pillars: [
    {
      title: 'Your market as it stands today, not stored patterns.',
      body: 'We analyze your actual competitors, the searches your buyers run, and where demand is moving. Every finding is specific to your market and current — not inferred from what worked for someone else two years ago.',
    },
    {
      title: 'Intelligence first, strategy second.',
      body: 'We map the competitive landscape before a single recommendation is written, with quality checks at every step. The strategy is built on what we find — not the other way round.',
    },
    {
      title: 'The review gate is mandatory, not marketing.',
      body: 'A person on our team reads every strategy end to end before it reaches you. They can reject it, send it back for more data, or cut any recommendation the evidence doesn’t support. Most tools hand you whatever the model produced, unread by anyone.',
    },
    {
      title: 'Every recommendation is grounded.',
      body: 'Recommendations trace back to the market evidence behind them — you see the reasoning for each one, not just a confident assertion. When the data doesn’t support a claim, we don’t make it.',
    },
  ],
};

export const BUDGET = {
  heading: 'The strategy is the cheap part',
  intro: 'The plan is a one-time fee. What the plan sends into motion is not.',
  costs: [
    {
      title: 'The ad spend it directs',
      body: 'Every bit of budget you put behind the wrong angle, the wrong audience, or the wrong channel is spent whether the direction was right or not.',
    },
    {
      title: 'The team-months it books',
      body: 'A quarter of your marketer’s, your freelancer’s, or your agency’s time goes into executing whatever the plan says. You pay for that time either way.',
    },
    {
      title: 'The quarter you don’t get back',
      body: 'A wrong strategy doesn’t fail loudly. It spends the budget, fills the calendar, and shows you at the end of the quarter that you aimed at the wrong thing.',
    },
  ],
  conclusion:
    'A wrong strategy doesn’t just waste what it cost — it wastes everything you spend executing it. Set against the budget it governs, a verified, human-checked strategy is the cheapest insurance you can buy on it.',
};

// ---------------------------------------------------------------- /compare

export const COMPARE_PAGE = {
  eyebrow: 'Compare',
  heading: 'Direction, or hands?',
  intro:
    'What do you actually need right now? We’re not competing with agencies or freelancers. We’re a different category — and usually the step before them.',
} as const;

/** 'yes' / 'maybe' / 'no' draw a mark; any other text is shown as is. */
export type ComparisonValue = 'yes' | 'maybe' | 'no' | (string & {});

export const COMPARISON = {
  rowHeading: 'What you need',
  columns: [
    { name: 'AdCendy', note: 'Intelligence + strategy' },
    { name: 'Freelancer', note: 'A pair of hands for one task' },
    { name: 'Agency', note: 'Execution + some strategy, on retainer' },
  ],
  categories: [
    {
      heading: 'Direction: knowing what to do',
      rows: [
        { label: 'Deep read of what your competitors do across advertising and search', values: ['yes', 'no', 'maybe'] },
        { label: 'Keyword and channel opportunities specific to your market', values: ['yes', 'maybe', 'maybe'] },
        { label: 'Gaps in your market no one is filling', values: ['yes', 'no', 'maybe'] },
        { label: 'Objective direction, with no execution work to sell you', values: ['yes', 'maybe', 'no'] },
        { label: 'A strategy your own team owns and can run', values: ['yes', 'no', 'maybe'] },
      ],
    },
    {
      heading: 'Hands: doing the work',
      rows: [
        { label: 'Runs your ads', values: ['no', 'maybe', 'yes'] },
        { label: 'Produces your content', values: ['no', 'maybe', 'yes'] },
        { label: 'Manages your day-to-day marketing', values: ['no', 'no', 'yes'] },
      ],
    },
    {
      heading: 'The trade',
      rows: [
        { label: 'How you pay', values: ['Once, no retainer', 'Per task or hourly', 'Monthly retainer, 10–50× the cost'] },
        { label: 'Direction ready in', values: [`Usually ${delivery.typically}`, 'Depends on the task', '30–90 days to ramp'] },
      ],
    },
  ] satisfies Array<{ heading: string; rows: Array<{ label: string; values: ComparisonValue[] }> }>,
  verdict: 'Start with AdCendy when you need to know what to do. Bring in freelancers or an agency to do it.',
  legend: { yes: 'Yes', maybe: 'Sometimes / depends', no: 'No' },
};

/** The fit lists in full; the homepage shows the short version. */
export const FIT_DETAIL = {
  heading: 'Is it for you?',
  intro: 'We’d rather you find out here than after you’ve paid.',
  fitHeading: 'AdCendy is a strong fit if',
  fit: [
    'You have execution capacity — in-house marketers, freelancers, or an agency handling tactics — but no senior strategist or CMO setting direction.',
    'You’re a founder with some marketing literacy who needs a coherent strategy, and a real read on your competition, to point your execution at.',
    'You’re a funded early-stage brand or a growing business that knows how to act but needs to know what to act on.',
    'You want to see what competitors are actually doing and where the openings are — without spending weeks compiling it.',
  ],
  notYetHeading: 'AdCendy is not the right fit (yet) if',
  notYet: [
    'You need someone to execute the marketing, not plan it — you’re looking for an agency, and that’s a different service.',
    'You already have a strong in-house strategy team — you likely don’t need an outside plan, and your team won’t thank you for one.',
    'You’re a solo founder with no execution capacity — a strategy alone won’t get you to done. You need hands as well as a head, and we’re only the head.',
  ],
};
