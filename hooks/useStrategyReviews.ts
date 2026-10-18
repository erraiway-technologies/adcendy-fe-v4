'use client';

import { useQuery } from '@tanstack/react-query';
import { strategyReviewRepository } from '@/shared/api/repositories';
import { queryKeys } from '@/shared/api/queryKeys';

export function useStrategyReview(campaignId: string | null) {
  return useQuery({
    queryKey: campaignId ? queryKeys.strategyReviews.detail(campaignId) : queryKeys.strategyReviews.all,
    queryFn: () => strategyReviewRepository.getStrategyReview(campaignId as string),
    enabled: Boolean(campaignId),
    retry: false,
  });
}
