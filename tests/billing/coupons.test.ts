import assert from "node:assert/strict";
import test from "node:test";
import {
  couponState,
  couponUsageLabel,
  isoToLocalDateTime,
  localDateTimeToIso,
  majorToMinorUnits,
  normalizeAdminCouponList,
  type AdminCoupon,
} from "../../shared/types/coupons.ts";
import { billingMockAdapter } from "../../shared/api/mock/billing.mock.ts";

const coupon: AdminCoupon = {
  id: "c1",
  code: "LAUNCH20",
  description: null,
  discountType: "PERCENT",
  percentOff: 20,
  amountOffMinor: null,
  currency: null,
  maxRedemptions: 10,
  maxRedemptionsPerUser: 1,
  startsAt: null,
  endsAt: null,
  isActive: true,
  createdBy: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  redeemedCount: 3,
  heldCount: 1,
};

test("reads the coupon listing and drops rows without an id or code", () => {
  const coupons = normalizeAdminCouponList({
    coupons: [
      { ...coupon, discountType: "FIXED_AMOUNT", amountOffMinor: 200000, currency: "INR" },
      { code: "NOID" },
      null,
    ],
  });
  assert.equal(coupons.length, 1);
  assert.equal(coupons[0].discountType, "FIXED_AMOUNT");
  assert.equal(coupons[0].amountOffMinor, 200000);
  assert.equal(coupons[0].redeemedCount, 3);
  assert.deepEqual(normalizeAdminCouponList(undefined), []);
});

test("says whether a buyer can use the coupon now", () => {
  const now = new Date("2026-10-15T00:00:00.000Z");
  assert.equal(couponState(coupon, now), "active");
  assert.equal(couponState({ ...coupon, isActive: false }, now), "off");
  assert.equal(
    couponState({ ...coupon, startsAt: "2026-11-01T00:00:00.000Z" }, now),
    "scheduled",
  );
  assert.equal(
    couponState({ ...coupon, endsAt: "2026-10-01T00:00:00.000Z" }, now),
    "expired",
  );
  // Held uses count: a buyer paying right now holds one.
  assert.equal(
    couponState({ ...coupon, maxRedemptions: 4 }, now),
    "used-up",
  );
});

test("labels use counts with and without a limit", () => {
  assert.equal(couponUsageLabel(coupon), "4 of 10 used (1 awaiting payment)");
  assert.equal(
    couponUsageLabel({ ...coupon, maxRedemptions: null, heldCount: 0 }),
    "3 used, no limit",
  );
});

test("turns a typed amount into minor units", () => {
  assert.equal(majorToMinorUnits("2000"), 200000);
  assert.equal(majorToMinorUnits("19.9"), 1990);
  assert.equal(majorToMinorUnits(" 19.99 "), 1999);
  assert.equal(majorToMinorUnits("0"), null);
  assert.equal(majorToMinorUnits("1.234"), null);
  assert.equal(majorToMinorUnits("-5"), null);
  assert.equal(majorToMinorUnits("abc"), null);
});

test("round-trips a date input through ISO", () => {
  assert.equal(localDateTimeToIso(""), null);
  const iso = localDateTimeToIso("2026-12-31T23:30");
  assert.ok(iso);
  assert.equal(isoToLocalDateTime(iso), "2026-12-31T23:30");
  assert.equal(isoToLocalDateTime(null), "");
});

test("mock checkout charges the price after the coupon", async () => {
  const preview = await billingMockAdapter.previewCoupon(
    "welcome10",
    "Launch",
    "IN",
  );
  assert.deepEqual(preview, {
    couponCode: "WELCOME10",
    sku: "Launch",
    currency: "INR",
    listAmountMinor: 1990000,
    discountMinor: 199000,
    amountMinor: 1791000,
  });

  const order = await billingMockAdapter.createOrder(
    "Launch",
    "coupon-test-idempotency",
    ["doc-terms"],
    "WELCOME10",
    "IN",
  );
  assert.equal(order.amountMinor, 1791000);
  assert.equal(order.listAmountMinor, 1990000);
  assert.equal(order.discountMinor, 199000);
  assert.equal(order.couponCode, "WELCOME10");

  await assert.rejects(
    billingMockAdapter.previewCoupon("WELCOME10", "Pilot Launch", "IN"),
    /pilot pricing/,
  );
  await assert.rejects(
    billingMockAdapter.previewCoupon("NOPE", "Launch", "IN"),
    /not valid/,
  );
});
