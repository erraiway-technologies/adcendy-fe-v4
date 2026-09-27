'use client';

import dynamic from 'next/dynamic';
import { MarketingNav } from '@/components/nav/marketing-nav';
import { StarfieldHero } from '@/components/sections/starfield-hero';

const ProblemSection  = dynamic(() => import('@/components/sections/problem-section').then(m => ({ default: m.ProblemSection })));
const WhyNotYourTeam  = dynamic(() => import('@/components/sections/why-not-your-team').then(m => ({ default: m.WhyNotYourTeam })));
const HowItWorks      = dynamic(() => import('@/components/sections/how-it-works').then(m => ({ default: m.HowItWorks })));
const WhatYouGet      = dynamic(() => import('@/components/sections/what-you-get').then(m => ({ default: m.WhatYouGet })));
const Benchmarks      = dynamic(() => import('@/components/sections/benchmarks-section').then(m => ({ default: m.Benchmarks })));
const WhoItsFor       = dynamic(() => import('@/components/sections/who-its-for').then(m => ({ default: m.WhoItsFor })));
const WhyNotAI        = dynamic(() => import('@/components/sections/why-not-ai').then(m => ({ default: m.WhyNotAI })));
const ComparisonTable = dynamic(() => import('@/components/sections/comparison-table').then(m => ({ default: m.ComparisonTable })));
const BudgetArgument = dynamic(() => import('@/components/sections/budget-argument-section').then(m => ({ default: m.BudgetArgument })));
const Pricing         = dynamic(() => import('@/components/sections/pricing-section').then(m => ({ default: m.Pricing })));
const Manifesto       = dynamic(() => import('@/components/sections/manifesto-section').then(m => ({ default: m.Manifesto })));
const FAQ             = dynamic(() => import('@/components/sections/faq-section').then(m => ({ default: m.FAQ })));
const FinalCTA        = dynamic(() => import('@/components/sections/final-cta-section').then(m => ({ default: m.FinalCTA })));
const MarketingFooter = dynamic(() => import('@/components/sections/marketing-footer').then(m => ({ default: m.MarketingFooter })));
const StickyFooterCTA = dynamic(() => import('@/components/sections/sticky-footer-cta').then(m => ({ default: m.StickyFooterCTA })));

export function LandingPageV1() {
  return (
    <main className="bg-background text-foreground">
      <MarketingNav />
      <StarfieldHero />
      <ProblemSection />
      <WhyNotYourTeam />
      <HowItWorks />
      <WhatYouGet />
      <Benchmarks />
      <WhoItsFor />
      <WhyNotAI />
      <ComparisonTable />
      <BudgetArgument />
      <Pricing />
      <Manifesto />
      <FAQ />
      <FinalCTA />
      <MarketingFooter />
      <StickyFooterCTA />
    </main>
  );
}
