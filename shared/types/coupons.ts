/**
 * Checkout coupons as the Backend's admin coupons screen serves them
 * (`/api/v2/admin/billing/coupons`). Use counts come from orders: a paid
 * order has redeemed the coupon; one awaiting capture, or unpaid for less
 * than the hold, is holding a use.
 */

export type CouponDiscountType = 'PERCENT' | 'FIXED_AMOUNT';

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  percentOff: number | null;
  /** For FIXED_AMOUNT, in the minor unit of `currency`. */
  amountOffMinor: number | null;
  currency: string | null;
  /** Null is unlimited. */
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  redeemedCount: number;
  heldCount: number;
}

export interface CreateCouponPayload {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  percentOff?: number;
  amountOffMinor?: number;
  currency?: string;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

/** A field left out is kept; null clears it. Code and discount are fixed. */
export interface UpdateCouponPayload {
  description?: string | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

/** What a coupon does to one bundle's price, from `/v1/billing/coupons/preview`. */
export interface CouponPreview {
  couponCode: string;
  sku: string;
  currency: string;
  listAmountMinor: number;
  discountMinor: number;
  amountMinor: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const nullableText = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;
const nullableInt = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) ? value : null;
const count = (value: unknown) => nullableInt(value) ?? 0;

export function normalizeAdminCoupon(value: unknown): AdminCoupon | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.code !== 'string') {
    return null;
  }
  return {
    id: value.id,
    code: value.code,
    description: nullableText(value.description),
    discountType: value.discountType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENT',
    percentOff: nullableInt(value.percentOff),
    amountOffMinor: nullableInt(value.amountOffMinor),
    currency: nullableText(value.currency),
    maxRedemptions: nullableInt(value.maxRedemptions),
    maxRedemptionsPerUser: nullableInt(value.maxRedemptionsPerUser) ?? 1,
    startsAt: nullableText(value.startsAt),
    endsAt: nullableText(value.endsAt),
    isActive: value.isActive === true,
    createdBy: nullableText(value.createdBy),
    createdAt: text(value.createdAt),
    updatedAt: text(value.updatedAt),
    redeemedCount: count(value.redeemedCount),
    heldCount: count(value.heldCount),
  };
}

export function normalizeAdminCouponList(value: unknown): AdminCoupon[] {
  const record = isRecord(value) ? value : {};
  return Array.isArray(record.coupons)
    ? record.coupons
        .map(normalizeAdminCoupon)
        .filter((coupon): coupon is AdminCoupon => coupon !== null)
    : [];
}

export type CouponState = 'active' | 'off' | 'scheduled' | 'expired' | 'used-up';

/** What an admin needs to know at a glance: can a buyer use it right now? */
export function couponState(coupon: AdminCoupon, now: Date = new Date()): CouponState {
  if (!coupon.isActive) return 'off';
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return 'scheduled';
  if (coupon.endsAt && now >= new Date(coupon.endsAt)) return 'expired';
  if (
    coupon.maxRedemptions !== null &&
    coupon.redeemedCount + coupon.heldCount >= coupon.maxRedemptions
  ) {
    return 'used-up';
  }
  return 'active';
}

/** "1 of 50 used" / "3 used, no limit", counting held uses as used. */
export function couponUsageLabel(coupon: AdminCoupon): string {
  const used = coupon.redeemedCount + coupon.heldCount;
  const held = coupon.heldCount > 0 ? ` (${coupon.heldCount} awaiting payment)` : '';
  return coupon.maxRedemptions === null
    ? `${used} used, no limit${held}`
    : `${used} of ${coupon.maxRedemptions} used${held}`;
}

/**
 * An amount typed in the currency's main unit ("2000" or "19.99") as the
 * minor unit the server stores (200000, 1999); null when it is not a
 * positive amount with at most two decimals.
 */
export function majorToMinorUnits(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

/** A `datetime-local` input's value, read in the admin's time zone, as ISO; null when empty. */
export function localDateTimeToIso(value: string): string | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** An ISO time as a `datetime-local` input value in the admin's time zone. */
export function isoToLocalDateTime(value: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
