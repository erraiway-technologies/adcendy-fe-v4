import { createRuntimeRepositoryAdapter } from '@/lib/env';
import { couponsMockAdapter } from '../mock/coupons.mock';
import { couponsRealAdapter } from '../real/coupons.real';
import type {
  AdminCoupon,
  CreateCouponPayload,
  UpdateCouponPayload,
} from '@/shared/types/coupons';

const adapter = createRuntimeRepositoryAdapter(couponsMockAdapter, couponsRealAdapter);

export const couponsRepository = {
  /** Every coupon, newest first, with how many times it has been used. */
  async listCoupons(): Promise<AdminCoupon[]> {
    return adapter.listCoupons();
  },

  async createCoupon(payload: CreateCouponPayload): Promise<AdminCoupon> {
    return adapter.createCoupon(payload);
  },

  /** Limits, dates, description or on/off; the code and discount are fixed. */
  async updateCoupon(couponId: string, payload: UpdateCouponPayload): Promise<AdminCoupon> {
    return adapter.updateCoupon(couponId, payload);
  },
};
