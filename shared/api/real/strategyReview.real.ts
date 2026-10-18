import { http } from '../index';
import type { ApiResponse } from '../types';
import type { StrategyReviewDetail } from '@/shared/types/reviews';
import { normalizeStrategyReviewDetail } from '@/shared/types/reviews';

export const strategyReviewRealAdapter = {
  async getStrategyReview(campaignId: string): Promise<StrategyReviewDetail> {
    const response = await http<ApiResponse<unknown>>(`/v1/campaigns/${campaignId}/strategy-review`);
    return normalizeStrategyReviewDetail(response.data, campaignId);
  },
};
