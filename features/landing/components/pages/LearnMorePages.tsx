'use client';

import { APPROACH_PAGE, COMPARE_PAGE, WHAT_YOU_GET_PAGE } from '../../content/pages';
import { ClosingCta } from '../home/ClosingCta';
import { Benchmarks } from './Benchmarks';
import { BudgetArgument } from './BudgetArgument';
import { ComparisonTable } from './ComparisonTable';
import { FitDetail } from './FitDetail';
import { MarketRules } from './MarketRules';
import { PageIntro } from './PageIntro';
import { StrategyQuestions } from './StrategyQuestions';
import { TimelineDetail } from './TimelineDetail';
import { WhatYouGet } from './WhatYouGet';
import { WhyNotAI } from './WhyNotAI';
import { WhyNotYourTeam } from './WhyNotYourTeam';

/*
 * The pages the homepage links out to. The homepage says each thing once, in
 * brief; these hold the full explanations, and each ends on the homepage's
 * closing call to action.
 */

/** /what-you-get: the deliverables, the questions answered, the steps, the targets, one market. */
export function WhatYouGetPage() {
  return (
    <main>
      <PageIntro {...WHAT_YOU_GET_PAGE} />
      <WhatYouGet tone="deep" />
      <StrategyQuestions />
      <TimelineDetail tone="deep" />
      <Benchmarks />
      <MarketRules tone="deep" />
      <ClosingCta />
    </main>
  );
}

/** /approach: why not your team, AI-powered and human-judged, and what a wrong strategy costs. */
export function ApproachPage() {
  return (
    <main>
      <PageIntro {...APPROACH_PAGE} />
      <WhyNotYourTeam tone="deep" />
      <WhyNotAI />
      <BudgetArgument tone="deep" />
      <ClosingCta />
    </main>
  );
}

/** /compare: AdCendy against a freelancer and an agency, then the fit lists in full. */
export function ComparePage() {
  return (
    <main>
      <PageIntro {...COMPARE_PAGE} />
      <ComparisonTable tone="deep" />
      <FitDetail />
      <ClosingCta />
    </main>
  );
}
