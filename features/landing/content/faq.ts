/**
 * The questions the FAQ section shows. Plain data, so the server can also
 * publish them as FAQPage structured data for search engines.
 */
import { BUSINESS_TERMS as TERMS, REFUND_GUARANTEE_TEXT, numberWord } from '@/shared/marketing/business-terms';

export type Faq = { question: string; answer: string; id?: string };

const { delivery, intake, support, calls, contact, report } = TERMS;

// An entry with an `id` can be linked to directly, and opens when it is.
export function buildFaqs(): Faq[] {
  const days = numberWord(delivery.businessDays);
  const revisionDays = numberWord(support.revisionBusinessDays);
  const [firstCheck, lastCheck] = support.resultsCheckDays;
  return [
    {
      question: 'What exactly do I get?',
      answer:
        `Five documents for one market: a Strategy Document (what to do, in what order, and the evidence behind each recommendation), a Messaging & Positioning Guide, a Setup Guide for tracking and accounts, an Asset Pack with ad copy, landing-page structure and keyword lists, and a ${report.planDays}-day Action Plan, in three phases, you can import into your task tool. Plus a ${support.walkthroughVideo} recorded walkthrough. It's a finished kit your team can act on, not a conversation.`,
    },
    {
      question: 'How is this different from asking ChatGPT or Claude?',
      answer:
        "Same brief, different evidence. An AI agent turns your description of the business into a strategy by browsing a little and estimating the rest, and it makes every decision inside the AI — which competitors matter, what demand is real, what to prioritise. We start by measuring your market: what your buyers actually search for and how often, what it costs to reach them, who already competes for them, and what those competitors actually offer. The decisions about what that evidence means are made by fixed rules, before any text is written. AI then writes the explanation and the copy around decisions already made; it cannot change a number, add a competitor, or invent a fact. Where data for your market doesn't exist, the kit says \"not available\" instead of guessing. Then a human reviewer reads the whole thing before it ships. If you want to run your brief through an AI tool first and compare, please do.",
    },
    {
      question: 'How is it different from a consultant or a fractional CMO?',
      answer:
        `It's roughly the first month of their work, at a fixed price, usually ready in ${delivery.typically}: the research, the positioning, the channel plan, the setup. It isn't a replacement for them. A consultant or CMO brings ongoing judgment, relationships and execution; we bring the evidence they'd otherwise spend their first month assembling. Many clients hand the kit to whoever they hire next.`,
    },
    {
      question: 'Why pay for a strategy at all?',
      answer:
        "Because the strategy is the cheap part. It's a one-time fee; what it sends into motion is not. The ad spend it directs, the team-months it books, and the quarter it fills are spent whether the direction was right or not — and a wrong strategy doesn't fail loudly, it shows you at the end of the quarter that you aimed at the wrong thing. Set against the budget it governs, a verified, human-checked strategy is the cheapest insurance you can buy on it.",
    },
    {
      id: 'faq-industries',
      question: 'Who is this for?',
      answer:
        "Small brands and early-stage companies whose customers find them online — e-commerce, DTC, SaaS, services — that don't yet have a marketing lead and want a plan to act on rather than more planning.",
    },
    {
      question: 'Who is it not for?',
      answer:
        "Businesses whose demand doesn't live online (enterprise sales, most offline retail), teams that already have a strategist with their own tools, and anyone who wants us to run the campaigns. If we think the kit will be weak for your business, we'll say so before you pay.",
    },
    {
      question: 'What do you need from me?',
      answer:
        `An intake form, ${intake.formMinutes} minutes: what you sell, to whom, in which market, your website (required for e-commerce), the competitors you know of, current channels and spend, and what you want to happen in the next ${report.planDays} days. We may follow up with clarifying questions by email.`,
    },
    {
      question: "What if I don't have a website yet?",
      answer:
        "If you sell through e-commerce, we need your website. Otherwise, we have a structured intake path for pre-website founders: we capture your offer, audience, and goals through a guided form and look at what the market already says about you and your competitors.",
    },
    {
      question: 'How long does it take?',
      answer:
        `Most strategies are ready in ${delivery.typically}, and never more than ${days} business days from a complete intake and confirmed payment. The clock pauses while we're waiting on information from you. You get status emails at start, review and delivery.`,
    },
    {
      id: 'faq-one-market',
      question: 'What counts as one market?',
      answer:
        "One market is one country. One strategy covers one country, end to end — the competitors in it, the searches your buyers run in it, and the openings inside it. We work at national level only: we don't build city or state strategies, because the competitor advertising data we read is published at country level, so a city strategy would be national data wearing a local label. What your city does contribute is real — what buyers near you actually search, and which competitors hold presence where you are, get read and folded into the national strategy. Selling into more than one country means more than one market, and we quote that package with you.",
    },
    {
      question: 'What is the refund guarantee, exactly?',
      answer: REFUND_GUARANTEE_TEXT,
    },
    {
      question: 'What does the revision cover?',
      answer:
        `Correcting what's wrong: factual errors, numbers, recommendations the evidence doesn't support, anything that doesn't match your intake. It doesn't cover new scope — a market, product line or channel that wasn't in the intake is a new purchase. ${numberWord(TERMS.revisionRoundsIncluded, { sentenceStart: true })} revision, requested in writing within ${support.revisionRequestDays} days of delivery, delivered within ${revisionDays} business days.`,
    },
    {
      question: 'What happens after delivery?',
      answer:
        `${support.windowDays} days of support. Email questions answered in writing within ${support.answerWithin}. Two results checks — at day ${firstCheck} and day ${lastCheck} you submit your numbers through a form and get a written readout within ${support.readoutWithin}. One optional ${calls.walkthroughCallMinutes}-minute video call per market, booked at least ${calls.walkthroughNoticeHours} hours ahead with your questions sent in advance, to walk through the report. After ${support.windowDays} days, unused support lapses and new questions are a new purchase.`,
    },
    {
      question: "How will I know if it's working?",
      answer:
        `Every recommendation comes with the metric that tells you it's working and the range you should expect it to move into, grounded in your category and your unit economics. You check your own numbers against those ranges: in range, you're on track; outside it, you know early, not three months in. During your ${support.windowDays}-day support window, if a number's off we help you work out why — a setup issue, an execution gap, or a real reason to adjust the plan. Honest ranges, not vanity promises: wide enough to mean something, specific enough to act on.`,
    },
    {
      question: 'Do you run the campaigns, review my ads, or stay on as advisors?',
      answer:
        "No. We don't manage or audit ad accounts, review creatives, landing pages or copy, or provide ongoing advice. The Setup Guide and Action Plan are written so your team or a freelancer can execute without us.",
    },
    {
      question: 'What about my data and confidentiality?',
      answer:
        `Your intake, your results and your kit are used for your strategy only. They are seen by our reviewers, who work under confidentiality agreements, and by no one else. Calls aren't recorded unless both sides agree. Data access or deletion requests go to ${contact.privacy} and are completed within ${contact.privacyRequestDays} days.`,
    },
  ];
}
