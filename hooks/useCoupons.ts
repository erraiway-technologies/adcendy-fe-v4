'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { couponsRepository } from '@/shared/api/repositories';
import type { CreateCouponPayload, UpdateCouponPayload } from '@/shared/types/coupons';

export function useCoupons(enabled = true) {
  return useQuery({
    queryKey: queryKeys.coupons.list(),
    queryFn: () => couponsRepository.listCoupons(),
    enabled,
  });
}

function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
}

export function useCreateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => couponsRepository.createCoupon(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: ({ couponId, payload }: { couponId: string; payload: UpdateCouponPayload }) =>
      couponsRepository.updateCoupon(couponId, payload),
    onSuccess: invalidate,
  });
}
