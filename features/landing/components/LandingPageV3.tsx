'use client';

import { SAMPLE_REPORT } from '../content/sample-report';
import { Benchmarks } from './home/Benchmarks';
import { BudgetArgument } from './home/BudgetArgument';
import { ClosingCta } from './home/ClosingCta';
import { ComparisonTable } from './home/ComparisonTable';
import { DeliveryTimeline } from './home/DeliveryTimeline';
import { FaqSection } from './home/FaqSection';
import { HomeHero } from './home/HomeHero';
import { Manifesto } from './home/Manifesto';
import { PricingCard } from './home/PricingCard';
import { ReportReader } from './home/ReportReader';
import { SiteFooter } from './home/SiteFooter';
import { SiteHeader } from './home/SiteHeader';
import { Statement } from './home/Statement';
import { StickyCta } from './home/StickyCta';
import { StrategyQuestions } from './home/StrategyQuestions';
import { WhatYouGet } from './home/WhatYouGet';
import { WhoItsFor } from './home/WhoItsFor';
import { WhyNotAI } from './home/WhyNotAI';

/**
 * The homepage (the v5 design handoff),
 * carrying everything the earlier homepage said: the hero and statement, a
 * sample report reader, what you get, the questions a strategy answers, the
 * four-day timeline, benchmarks, fit, AI vs. human review, the comparison,
 * the budget argument, live pricing, the manifesto, the FAQ and a closing
 * call to action. Section order matches HOME_SECTIONS. Its palette and motion
 * live in globals.css under .home-page; every animation stops for visitors
 * who prefer reduced motion.
 */
export function LandingPageV3() {
  return (
    <div className="home-page">
      <SiteHeader />
      <main id="top">
        <HomeHero />
        <Statement />
        <ReportReader report={SAMPLE_REPORT} />
        <WhatYouGet />
        <StrategyQuestions />
        <DeliveryTimeline />
        <Benchmarks />
        <WhoItsFor />
        <WhyNotAI />
        <ComparisonTable />
        <BudgetArgument />
        <PricingCard />
        <Manifesto />
        <FaqSection />
        <ClosingCta />
      </main>
      <SiteFooter />
      <StickyCta />
    </div>
  );
}
