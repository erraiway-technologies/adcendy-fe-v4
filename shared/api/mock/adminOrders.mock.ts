import {
  defaultMarketsToTakeBack,
  marketsLeftToTakeBack,
  type AdminOrder,
  type AdminOrderPage,
  type AdminOrdersQuery,
  type AdminRefund,
  type CreateRefundPayload,
} from '../../types/adminOrders.ts';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Local fixtures shaped like the Backend's admin orders listing.
const orders: AdminOrder[] = [
  {
    id: 'order-mock-paid',
    buyerEmail: 'founder@example.com',
    buyerUserId: 'user-mock-1',
    buyerCreditsBalance: 2,
    status: 'PAID',
    currency: 'INR',
    amountMinor: 300000,
    bundleSku: 'bundle_3',
    credits: 3,
    couponCode: 'WELCOME10',
    discountMinor: 33333,
    providerOrderId: 'order_mock_1',
    providerPaymentId: 'pay_mock_1',
    createdAt: '2026-10-03T09:00:00.000Z',
    paidAt: '2026-10-03T09:02:00.000Z',
    refundedMinor: 0,
    pendingRefundMinor: 0,
    creditsTakenBack: 0,
    refundableMinor: 300000,
    refunds: [],
  },
  {
    id: 'order-mock-refunded',
    buyerEmail: 'agency@example.com',
    buyerUserId: 'user-mock-2',
    buyerCreditsBalance: 0,
    status: 'REFUNDED',
    currency: 'INR',
    amountMinor: 100000,
    bundleSku: 'bundle_1',
    credits: 1,
    couponCode: null,
    discountMinor: 0,
    providerOrderId: 'order_mock_2',
    providerPaymentId: 'pay_mock_2',
    createdAt: '2026-10-01T12:00:00.000Z',
    paidAt: '2026-10-01T12:01:00.000Z',
    refundedMinor: 100000,
    pendingRefundMinor: 0,
    creditsTakenBack: 0,
    refundableMinor: 0,
    refunds: [
      {
        id: 'refund-mock-1',
        providerRefundId: 'rfnd_mock_1',
        amountMinor: 100000,
        currency: 'INR',
        creditsAction: 'TAKE_BACK',
        creditsRequested: 1,
        creditsTakenBack: 0,
        source: 'PROVIDER_DASHBOARD',
        status: 'PROCESSED',
        reason: 'Refunded in the Razorpay dashboard',
        failureMessage: null,
        requestedByEmail: null,
        createdAt: '2026-10-02T08:00:00.000Z',
        processedAt: '2026-10-02T08:00:00.000Z',
      },
    ],
  },
];

export const adminOrdersMockAdapter = {
  async listOrders(query: AdminOrdersQuery): Promise<AdminOrderPage> {
    await delay(150);
    const search = query.search?.trim().toLowerCase();
    const items = orders.filter(
      (order) =>
        (!query.status || order.status === query.status) &&
        (!search ||
          order.buyerEmail.toLowerCase().includes(search) ||
          [order.id, order.providerOrderId, order.providerPaymentId].includes(search)),
    );
    return {
      items: items.map((order) => ({ ...order, refunds: [...order.refunds] })),
      page: 1,
      pageSize: query.pageSize ?? 25,
      total: items.length,
    };
  },

  /** Records the refund as Razorpay would leave it: requested, processed later. */
  async createRefund(orderId: string, payload: CreateRefundPayload): Promise<AdminRefund> {
    await delay(150);
    const order = orders.find((candidate) => candidate.id === orderId);
    if (!order || order.status !== 'PAID') {
      throw new Error('Only a paid order can be refunded.');
    }
    const amountMinor = payload.amountMinor ?? order.refundableMinor;
    if (amountMinor < 1 || amountMinor > order.refundableMinor) {
      throw new Error(`At most ${order.refundableMinor} (minor units) can still be refunded on this order.`);
    }
    const creditsRequested =
      payload.creditsAction === 'KEEP'
        ? 0
        : (payload.creditsToTakeBack ?? defaultMarketsToTakeBack(order, amountMinor));
    if (creditsRequested > marketsLeftToTakeBack(order)) {
      throw new Error(`This order has ${marketsLeftToTakeBack(order)} credit(s) left to take back.`);
    }
    const refund: AdminRefund = {
      id: `refund-${crypto.randomUUID()}`,
      providerRefundId: null,
      amountMinor,
      currency: order.currency,
      creditsAction: payload.creditsAction,
      creditsRequested,
      creditsTakenBack: null,
      source: 'ADMIN',
      status: 'REQUESTED',
      reason: payload.reason,
      failureMessage: null,
      requestedByEmail: 'you@adcendy.com',
      createdAt: new Date().toISOString(),
      processedAt: null,
    };
    order.refunds.unshift(refund);
    order.pendingRefundMinor += amountMinor;
    order.refundableMinor -= amountMinor;
    return { ...refund };
  },
};
