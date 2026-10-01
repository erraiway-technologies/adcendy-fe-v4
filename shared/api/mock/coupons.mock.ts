import type {
  AdminCoupon,
  CreateCouponPayload,
  UpdateCouponPayload,
} from '../../types/coupons';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Local fixtures shaped like the Backend's coupons listing.
const coupons: AdminCoupon[] = [
  {
    id: 'coupon-welcome10',
    code: 'WELCOME10',
    description: 'Ten percent off for newsletter sign-ups',
    discountType: 'PERCENT',
    percentOff: 10,
    amountOffMinor: null,
    currency: null,
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    startsAt: null,
    endsAt: '2026-12-31T18:30:00.000Z',
    isActive: true,
    createdBy: 'ops@adcendy.com',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    redeemedCount: 12,
    heldCount: 1,
  },
  {
    id: 'coupon-flat2000',
    code: 'FLAT2000',
    description: null,
    discountType: 'FIXED_AMOUNT',
    percentOff: null,
    amountOffMinor: 200000,
    currency: 'INR',
    maxRedemptions: 5,
    maxRedemptionsPerUser: 1,
    startsAt: null,
    endsAt: null,
    isActive: false,
    createdBy: 'ops@adcendy.com',
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    redeemedCount: 5,
    heldCount: 0,
  },
];

export const couponsMockAdapter = {
  async listCoupons(): Promise<AdminCoupon[]> {
    await delay(150);
    return coupons.map((coupon) => ({ ...coupon }));
  },

  async createCoupon(payload: CreateCouponPayload): Promise<AdminCoupon> {
    await delay(150);
    const code = payload.code.trim().toUpperCase();
    if (coupons.some((coupon) => coupon.code === code)) {
      throw new Error(`A coupon with the code ${code} already exists.`);
    }
    const now = new Date().toISOString();
    const coupon: AdminCoupon = {
      id: `coupon-${crypto.randomUUID()}`,
      code,
      description: payload.description ?? null,
      discountType: payload.discountType,
      percentOff: payload.discountType === 'PERCENT' ? (payload.percentOff ?? null) : null,
      amountOffMinor: payload.discountType === 'FIXED_AMOUNT' ? (payload.amountOffMinor ?? null) : null,
      currency: payload.discountType === 'FIXED_AMOUNT' ? (payload.currency?.toUpperCase() ?? null) : null,
      maxRedemptions: payload.maxRedemptions ?? null,
      maxRedemptionsPerUser: payload.maxRedemptionsPerUser ?? 1,
      startsAt: payload.startsAt ?? null,
      endsAt: payload.endsAt ?? null,
      isActive: payload.isActive ?? true,
      createdBy: 'you@adcendy.com',
      createdAt: now,
      updatedAt: now,
      redeemedCount: 0,
      heldCount: 0,
    };
    coupons.unshift(coupon);
    return { ...coupon };
  },

  async updateCoupon(couponId: string, payload: UpdateCouponPayload): Promise<AdminCoupon> {
    await delay(150);
    const index = coupons.findIndex((coupon) => coupon.id === couponId);
    if (index === -1) {
      throw new Error('That coupon does not exist.');
    }
    const defined = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as UpdateCouponPayload;
    coupons[index] = { ...coupons[index], ...defined, updatedAt: new Date().toISOString() };
    return { ...coupons[index] };
  },
};
