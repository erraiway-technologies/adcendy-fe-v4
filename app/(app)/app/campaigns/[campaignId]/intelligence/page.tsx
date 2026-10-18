'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCampaignLifecycle } from '@/hooks/useCampaignLifecycle';
import {
  approvedStrategySections,
  isIntelligenceSection,
} from '@/shared/components/strategy/approved-strategy-sections';
import { StrategySectionsView } from '@/shared/components/strategy/StrategySectionsView';

// The market research behind the strategy, as the strategy states it: its
// intent, search demand and competitor sections. The research data itself is
// kept per pipeline run and has no client-readable endpoint.
export default function IntelligencePage() {
  const params = useParams();
  const campaignId = params?.campaignId as string;
  const { strategyReview, isStrategyReviewError, isLoading } = useCampaignLifecycle(campaignId);

  const sections = approvedStrategySections(strategyReview?.sections).filter(isIntelligenceSection);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Search demand, buyer intent and competitors in your market, from the research behind your strategy
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/app/campaigns/${campaignId}/strategy`}>
            Full strategy
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : isStrategyReviewError ? (
        <Card className="p-8 border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-sm text-destructive">
            Market intelligence could not be loaded. Refresh the page to try again.
          </p>
        </Card>
      ) : sections.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card">
          <p className="mx-auto max-w-md text-muted-foreground">
            Market intelligence appears here once your strategy is approved.
          </p>
        </Card>
      ) : (
        <StrategySectionsView sections={sections} />
      )}
    </div>
  );
}
