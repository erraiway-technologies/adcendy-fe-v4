import { http } from '../index';
import type { ApiResponse } from '../types';
import {
  normalizeAdminOrderPage,
  normalizeAdminRefund,
  type AdminOrderPage,
  type AdminOrdersQuery,
  type AdminRefund,
  type CreateRefundPayload,
} from '@/shared/types/adminOrders';

const BASE = '/api/v2/admin/billing/orders';

function unwrapResponseData<T>(response: ApiResponse<T> | T | undefined): T | undefined {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T | undefined;
}

export const adminOrdersRealAdapter = {
  async listOrders(query: AdminOrdersQuery): Promise<AdminOrderPage> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
    );
    const response = await http<ApiResponse<unknown>>(BASE, { query: params });
    return normalizeAdminOrderPage(unwrapResponseData(response));
  },

  async createRefund(orderId: string, payload: CreateRefundPayload): Promise<AdminRefund> {
    const response = await http<ApiResponse<unknown>>(
      `${BASE}/${encodeURIComponent(orderId)}/refunds`,
      { method: 'POST', body: payload },
    );
    const refund = normalizeAdminRefund(unwrapResponseData(response));
    if (!refund) {
      throw new Error('The orders service returned an unreadable refund.');
    }
    return refund;
  },
};
