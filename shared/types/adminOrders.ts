/**
 * Orders and refunds as the Backend's admin orders screen serves them
 * (`/api/v2/admin/billing/orders`). Amounts are in the currency's minor unit.
 * A refund records what happens to the order's markets (credits) before
 * Razorpay is asked; the markets move when Razorpay reports it processed.
 */

export type AdminOrderStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type RefundCreditsAction = 'TAKE_BACK' | 'KEEP';
export type RefundSource = 'ADMIN' | 'PROVIDER_DASHBOARD';
export type RefundStatus = 'REQUESTED' | 'PROCESSED' | 'FAILED';

export interface AdminRefund {
  id: string;
  providerRefundId: string | null;
  amountMinor: number;
  currency: string;
  creditsAction: RefundCreditsAction;
  creditsRequested: number;
  /** Null until Razorpay reports the refund processed. */
  creditsTakenBack: number | null;
  source: RefundSource;
  status: RefundStatus;
  reason: string | null;
  failureMessage: string | null;
  requestedByEmail: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminOrder {
  id: string;
  buyerEmail: string;
  buyerUserId: string;
  /** Markets the buyer has unused now, across every order. */
  buyerCreditsBalance: number;
  status: AdminOrderStatus;
  currency: string;
  amountMinor: number;
  bundleSku: string;
  credits: number;
  couponCode: string | null;
  discountMinor: number;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedMinor: number;
  pendingRefundMinor: number;
  creditsTakenBack: number;
  /** What a new refund may still return; 0 when the order cannot be refunded. */
  refundableMinor: number;
  refunds: AdminRefund[];
}

export interface AdminOrderPage {
  items: AdminOrder[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminOrdersQuery {
  status?: AdminOrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateRefundPayload {
  /** Left out: everything not yet refunded. */
  amountMinor?: number;
  creditsAction: RefundCreditsAction;
  creditsToTakeBack?: number;
  reason: string;
}

const ORDER_STATUSES: AdminOrderStatus[] = [
  'CREATED',
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const nullableText = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;
const nullableInt = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) ? value : null;
const count = (value: unknown) => nullableInt(value) ?? 0;

function normalizeRefund(value: unknown): AdminRefund | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    providerRefundId: nullableText(value.providerRefundId),
    amountMinor: count(value.amountMinor),
    currency: text(value.currency),
    creditsAction: value.creditsAction === 'KEEP' ? 'KEEP' : 'TAKE_BACK',
    creditsRequested: count(value.creditsRequested),
    creditsTakenBack: nullableInt(value.creditsTakenBack),
    source: value.source === 'PROVIDER_DASHBOARD' ? 'PROVIDER_DASHBOARD' : 'ADMIN',
    status:
      value.status === 'PROCESSED' || value.status === 'FAILED' ? value.status : 'REQUESTED',
    reason: nullableText(value.reason),
    failureMessage: nullableText(value.failureMessage),
    requestedByEmail: nullableText(value.requestedByEmail),
    createdAt: text(value.createdAt),
    processedAt: nullableText(value.processedAt),
  };
}

export function normalizeAdminRefund(value: unknown): AdminRefund | null {
  return normalizeRefund(value);
}

export function normalizeAdminOrder(value: unknown): AdminOrder | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const status = ORDER_STATUSES.find((candidate) => candidate === value.status) ?? 'CREATED';
  return {
    id: value.id,
    buyerEmail: text(value.buyerEmail),
    buyerUserId: text(value.buyerUserId),
    buyerCreditsBalance: count(value.buyerCreditsBalance),
    status,
    currency: text(value.currency) || 'INR',
    amountMinor: count(value.amountMinor),
    bundleSku: text(value.bundleSku),
    credits: count(value.credits),
    couponCode: nullableText(value.couponCode),
    discountMinor: count(value.discountMinor),
    providerOrderId: nullableText(value.providerOrderId),
    providerPaymentId: nullableText(value.providerPaymentId),
    createdAt: text(value.createdAt),
    paidAt: nullableText(value.paidAt),
    refundedMinor: count(value.refundedMinor),
    pendingRefundMinor: count(value.pendingRefundMinor),
    creditsTakenBack: count(value.creditsTakenBack),
    refundableMinor: count(value.refundableMinor),
    refunds: Array.isArray(value.refunds)
      ? value.refunds.map(normalizeRefund).filter((refund): refund is AdminRefund => refund !== null)
      : [],
  };
}

export function normalizeAdminOrderPage(value: unknown): AdminOrderPage {
  const record = isRecord(value) ? value : {};
  return {
    items: Array.isArray(record.items)
      ? record.items.map(normalizeAdminOrder).filter((order): order is AdminOrder => order !== null)
      : [],
    page: nullableInt(record.page) ?? 1,
    pageSize: nullableInt(record.pageSize) ?? 25,
    total: count(record.total),
  };
}

/**
 * The markets a refund takes back unless the admin picks a number - the
 * Backend's own rule: the order's markets in proportion to the money
 * returned, less what earlier refunds took; a refund that returns the rest of
 * the money takes back every market left.
 */
export function defaultMarketsToTakeBack(order: AdminOrder, refundAmountMinor: number): number {
  const takenBefore = order.creditsTakenBack + pendingCredits(order);
  const remaining = Math.max(0, order.credits - takenBefore);
  const refundedAfter = order.refundedMinor + order.pendingRefundMinor + refundAmountMinor;
  if (order.amountMinor <= 0 || refundedAfter >= order.amountMinor) return remaining;
  const dueInAll = Math.floor((order.credits * refundedAfter) / order.amountMinor);
  return Math.min(remaining, Math.max(0, dueInAll - takenBefore));
}

/** Markets the order still has to give back, after refunds done or in flight. */
export function marketsLeftToTakeBack(order: AdminOrder): number {
  return Math.max(0, order.credits - order.creditsTakenBack - pendingCredits(order));
}

function pendingCredits(order: AdminOrder): number {
  return order.refunds
    .filter((refund) => refund.status === 'REQUESTED')
    .reduce((sum, refund) => sum + refund.creditsRequested, 0);
}

/** "Refunded in full", "₹1,000 of ₹3,000 refunded" style facts, without currency formatting. */
export function refundStateOf(order: AdminOrder): 'none' | 'partial' | 'full' | 'in-flight' {
  if (order.status === 'REFUNDED') return 'full';
  if (order.pendingRefundMinor > 0) return 'in-flight';
  if (order.refundedMinor > 0) return 'partial';
  return 'none';
}

/** What a refund did, or will do, to the markets, in words for the admin. */
export function refundMarketsLabel(refund: AdminRefund): string {
  if (refund.creditsAction === 'KEEP') return 'Markets kept';
  if (refund.status === 'PROCESSED') {
    const taken = refund.creditsTakenBack ?? 0;
    const short =
      taken < refund.creditsRequested
        ? ` (${refund.creditsRequested - taken} already used, so kept)`
        : '';
    return `${taken} market${taken === 1 ? '' : 's'} taken back${short}`;
  }
  if (refund.status === 'FAILED') return 'No markets taken back';
  return `${refund.creditsRequested} market${refund.creditsRequested === 1 ? '' : 's'} to take back when processed`;
}
