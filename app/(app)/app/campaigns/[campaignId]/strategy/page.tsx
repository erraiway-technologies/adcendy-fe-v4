'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCampaignLifecycle } from '@/hooks/useCampaignLifecycle';
import { canAccessCampaignFiles } from '@/shared/components/campaigns/campaign-ui';
import { approvedStrategySections } from '@/shared/components/strategy/approved-strategy-sections';
import { StrategySectionsView } from '@/shared/components/strategy/StrategySectionsView';

// The strategy is the approved sections of the campaign's pipeline run, read
// from the run's section workspace. The PDF deliverables are built from the
// same sections and are downloaded from the Files tab.
export default function StrategyPage() {
  const params = useParams();
  const campaignId = params?.campaignId as string;
  const { campaign, runId, strategyReview, isStrategyReviewError, isLoading } =
    useCampaignLifecycle(campaignId);

  const sections = approvedStrategySections(strategyReview?.sections);
  const pendingCount = (strategyReview?.sections.length ?? 0) - sections.length;
  const filesAvailable = campaign ? canAccessCampaignFiles(campaign) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Strategy</h1>
          <p className="text-muted-foreground mt-1">Market analysis & go-to-market planning</p>
        </div>
        <div className="flex gap-2">
          {filesAvailable && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/app/campaigns/${campaignId}/files`}>
                <Download className="w-4 h-4" />
                Download PDFs
              </Link>
            </Button>
          )}
          {runId && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/app/campaigns/${campaignId}/runs/${runId}`}>
                <Sparkles className="w-4 h-4" />
                View Generation
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : isStrategyReviewError ? (
        <Card className="p-8 border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-sm text-destructive">The strategy could not be loaded. Refresh the page to try again.</p>
        </Card>
      ) : sections.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card">
          <div className="space-y-4 max-w-md mx-auto">
            <p className="text-muted-foreground">
              {pendingCount > 0
                ? 'Your strategy is being reviewed. Sections appear here once they are approved.'
                : 'No strategy generated yet.'}
            </p>
            <Button asChild size="lg" className="w-full gap-2">
              <Link href={runId ? `/app/campaigns/${campaignId}/runs/${runId}` : `/app/campaigns/${campaignId}/overview`}>
                <Sparkles className="w-4 h-4" />
                {runId ? 'View Generation Status' : 'Campaign Overview'}
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <StrategySectionsView sections={sections} />
      )}
    </div>
  );
}
