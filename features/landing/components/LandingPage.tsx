'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SAMPLE_REPORT } from '../content/sample-report';
import { MOVED_SECTIONS } from '../landing-sections';
import { ClosingCta } from './home/ClosingCta';
import { FaqSection } from './home/FaqSection';
import { HomeHero } from './home/HomeHero';
import { PricingCard } from './home/PricingCard';
import { ProcessSteps } from './home/ProcessSteps';
import { ReportReader } from './home/ReportReader';
import { SiteFooter } from './home/SiteFooter';
import { SiteHeader } from './home/SiteHeader';
import { StickyCta } from './home/StickyCta';
import { ValueProps } from './home/ValueProps';
import { WhoItsFor } from './home/WhoItsFor';

/**
 * The homepage: the hero, three value props, a sample report reader (each
 * chapter as the question it answers), how a strategy is made, fit and where
 * AdCendy sits next to freelancers and agencies, live pricing, the FAQ and a
 * closing call to action. Each thing is said once; the longer explanations
 * are FAQ answers, and the manifesto is /about. Section order matches
 * HOME_SECTIONS. Its palette and motion live in globals.css under .home-page;
 * every animation stops for visitors who prefer reduced motion.
 */
export function LandingPage() {
  const router = useRouter();

  // A link to a section that moved to its own page follows it there.
  useEffect(() => {
    const moved = MOVED_SECTIONS[window.location.hash.slice(1)];
    if (moved) router.replace(moved);
  }, [router]);

  return (
    <div className="home-page">
      <SiteHeader />
      <main id="top">
        <HomeHero />
        <ValueProps />
        <ReportReader report={SAMPLE_REPORT} />
        <ProcessSteps />
        <WhoItsFor />
        <PricingCard />
        <FaqSection />
        <ClosingCta />
      </main>
      <SiteFooter />
      <StickyCta />
    </div>
  );
}
