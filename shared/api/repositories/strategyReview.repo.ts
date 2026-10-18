import ENV, { createRuntimeRepositoryAdapter } from '@/lib/env';
import type { StrategyReviewDetail } from '@/shared/types/reviews';
import { strategyReviewMockAdapter } from '../mock/strategyReview.mock';
import { strategyReviewRealAdapter } from '../real/strategyReview.real';

const adapter = createRuntimeRepositoryAdapter(strategyReviewMockAdapter, strategyReviewRealAdapter);

if (ENV.features.apiLogging && typeof window !== 'undefined') {
  console.log('[Strategy Review Repository] Using adapter:', ENV.API.dataSource);
}

export const strategyReviewRepository = {
  async getStrategyReview(campaignId: string): Promise<StrategyReviewDetail> {
    return adapter.getStrategyReview(campaignId);
  },
};
