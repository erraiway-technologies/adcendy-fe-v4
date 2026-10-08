'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { adminOrdersRepository } from '@/shared/api/repositories';
import type { AdminOrdersQuery, CreateRefundPayload } from '@/shared/types/adminOrders';

export function useAdminOrders(query: AdminOrdersQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminOrders.list({ ...query }),
    queryFn: () => adminOrdersRepository.listOrders(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: CreateRefundPayload }) =>
      adminOrdersRepository.createRefund(orderId, payload),
    // A full refund also gives a coupon use back once Razorpay processes it.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all }),
      ]),
  });
}
