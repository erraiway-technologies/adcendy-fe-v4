import { http } from '../index';
import type { ApiResponse } from '../types';
import {
  normalizeAdminCoupon,
  normalizeAdminCouponList,
  type AdminCoupon,
  type CreateCouponPayload,
  type UpdateCouponPayload,
} from '@/shared/types/coupons';

const BASE = '/api/v2/admin/billing/coupons';

function unwrapResponseData<T>(response: ApiResponse<T> | T | undefined): T | undefined {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T | undefined;
}

function requireCoupon(value: unknown): AdminCoupon {
  const coupon = normalizeAdminCoupon(unwrapResponseData(value));
  if (!coupon) {
    throw new Error('The coupons service returned an unreadable coupon.');
  }
  return coupon;
}

export const couponsRealAdapter = {
  async listCoupons(): Promise<AdminCoupon[]> {
    const response = await http<ApiResponse<unknown>>(BASE);
    return normalizeAdminCouponList(unwrapResponseData(response));
  },

  async createCoupon(payload: CreateCouponPayload): Promise<AdminCoupon> {
    const response = await http<ApiResponse<unknown>>(BASE, {
      method: 'POST',
      body: payload,
    });
    return requireCoupon(response);
  },

  async updateCoupon(couponId: string, payload: UpdateCouponPayload): Promise<AdminCoupon> {
    const response = await http<ApiResponse<unknown>>(`${BASE}/${encodeURIComponent(couponId)}`, {
      method: 'PATCH',
      body: payload,
    });
    return requireCoupon(response);
  },
};
