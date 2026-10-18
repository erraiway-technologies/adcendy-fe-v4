import type { StrategyReviewDetail } from '@/shared/types/reviews';

const mockReviews: StrategyReviewDetail[] = [
  {
    id: 'review-001',
    campaignId: 'campaign-001',
    campaignTitle: 'SaaS Product Launch',
    status: 'PENDING_REVIEW',
    assignedReviewer: {
      id: 'reviewer-001',
      email: 'reviewer@adcendy.com',
      displayName: 'Primary Reviewer',
      role: 'REVIEWER',
    },
    requestedChangesNote: null,
    summaryNote: null,
    approvedAt: null,
    updatedAt: new Date().toISOString(),
    deliverables: [
      { key: 'onboarding_deliverables', label: 'Onboarding Deliverables', status: 'READY' },
      { key: 'strategy_document', label: 'Strategy Document', status: 'PENDING_REVIEW' },
      { key: 'execution_kit', label: 'Execution Kit', status: 'PENDING_REVIEW' },
    ],
    sections: [
      {
        callType: 'CUSTOMER_PERSONAS',
        title: 'Customer Personas',
        content: [
          'Primary buyer: growth-focused B2B marketing lead',
          'Pain point: inconsistent pipeline from existing channels',
        ],
        status: 'PENDING_REVIEW',
        note: null,
        decision: 'PENDING',
        deliverableKey: 'strategy_document',
        updatedAt: new Date().toISOString(),
      },
      {
        callType: 'CHANNEL_PRIORITIES',
        title: 'Channel Priorities',
        content: 'Focus acquisition on search, comparison content, and partner co-marketing.',
        status: 'PENDING_REVIEW',
        note: null,
        decision: 'PENDING',
        deliverableKey: 'execution_kit',
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];

async function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneReview(review: StrategyReviewDetail): StrategyReviewDetail {
  return JSON.parse(JSON.stringify(review)) as StrategyReviewDetail;
}

function findReview(campaignId: string): StrategyReviewDetail {
  const review = mockReviews.find((entry) => entry.campaignId === campaignId);
  if (!review) {
    throw new Error(`Strategy review for campaign ${campaignId} not found`);
  }

  return review;
}

export const strategyReviewMockAdapter = {
  async getStrategyReview(campaignId: string): Promise<StrategyReviewDetail> {
    await delay(150);
    return cloneReview(findReview(campaignId));
  },
};
