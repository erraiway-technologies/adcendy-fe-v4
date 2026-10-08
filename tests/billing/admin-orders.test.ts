import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultMarketsToTakeBack,
  marketsLeftToTakeBack,
  normalizeAdminOrderPage,
  refundMarketsLabel,
  refundStateOf,
  type AdminOrder,
  type AdminRefund,
} from "../../shared/types/adminOrders.ts";
import { adminOrdersMockAdapter } from "../../shared/api/mock/adminOrders.mock.ts";

const order = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: "o1",
  buyerEmail: "buyer@example.com",
  buyerUserId: "u1",
  buyerCreditsBalance: 3,
  status: "PAID",
  currency: "INR",
  amountMinor: 300000,
  bundleSku: "bundle_3",
  credits: 3,
  couponCode: null,
  discountMinor: 0,
  providerOrderId: "order_1",
  providerPaymentId: "pay_1",
  createdAt: "2026-10-03T00:00:00.000Z",
  paidAt: "2026-10-03T00:01:00.000Z",
  refundedMinor: 0,
  pendingRefundMinor: 0,
  creditsTakenBack: 0,
  refundableMinor: 300000,
  refunds: [],
  ...overrides,
});

const refund = (overrides: Partial<AdminRefund> = {}): AdminRefund => ({
  id: "r1",
  providerRefundId: "rfnd_1",
  amountMinor: 100000,
  currency: "INR",
  creditsAction: "TAKE_BACK",
  creditsRequested: 1,
  creditsTakenBack: null,
  source: "ADMIN",
  status: "REQUESTED",
  reason: "Asked",
  failureMessage: null,
  requestedByEmail: "ops@adcendy.com",
  createdAt: "2026-10-03T00:02:00.000Z",
  processedAt: null,
  ...overrides,
});

test("suggests the markets a refund paid for, the Backend's rule", () => {
  assert.equal(defaultMarketsToTakeBack(order(), 300000), 3);
  assert.equal(defaultMarketsToTakeBack(order(), 150000), 1);
  assert.equal(defaultMarketsToTakeBack(order({ credits: 1, amountMinor: 100000 }), 50000), 0);
  // The refund that returns the rest of the money takes every market left.
  assert.equal(
    defaultMarketsToTakeBack(order({ refundedMinor: 100000, creditsTakenBack: 1 }), 200000),
    2,
  );
});

test("counts markets promised by refunds still with Razorpay", () => {
  const inFlight = order({
    pendingRefundMinor: 100000,
    refundableMinor: 200000,
    refunds: [refund()],
  });
  assert.equal(marketsLeftToTakeBack(inFlight), 2);
  assert.equal(refundStateOf(inFlight), "in-flight");
  assert.equal(refundStateOf(order({ refundedMinor: 100000 })), "partial");
  assert.equal(refundStateOf(order({ status: "REFUNDED" })), "full");
});

test("says when used markets could not be taken back", () => {
  assert.equal(
    refundMarketsLabel(refund({ status: "PROCESSED", creditsRequested: 3, creditsTakenBack: 1 })),
    "1 market taken back (2 already used, so kept)",
  );
  assert.equal(refundMarketsLabel(refund({ creditsAction: "KEEP", creditsRequested: 0 })), "Markets kept");
  assert.equal(refundMarketsLabel(refund()), "1 market to take back when processed");
});

test("reads the Backend's page and drops what it cannot read", () => {
  const page = normalizeAdminOrderPage({
    items: [
      { ...order(), refunds: [refund(), { nope: true }] },
      { status: "PAID" },
    ],
    page: 2,
    pageSize: 25,
    total: 26,
  });
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].refunds.length, 1);
  assert.equal(page.page, 2);
  assert.equal(page.total, 26);
});

test("the mock refuses more than is left to refund", async () => {
  await assert.rejects(
    adminOrdersMockAdapter.createRefund("order-mock-paid", {
      amountMinor: 999999,
      creditsAction: "KEEP",
      reason: "Too much",
    }),
    /At most 300000/,
  );
});
