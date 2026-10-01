import type {
  BillingBundle,
  BillingCatalogue,
  BillingOrder,
  VerifyPaymentPayload,
  VerifyPaymentResult,
} from "@/shared/types/billing";
import type { CouponPreview } from "@/shared/types/coupons";

// A SKU's credits are markets: one credit buys one country, covered end to
// end. The server owns these prices and how many packages a country gets;
// this mirrors its shape for mock mode — India lists one package, other
// countries several — so both layouts get exercised without a backend.
// Mirrors the live catalogue 2026-09-21: pilot bundles first, while seats
// remain, then the regular list.
const indiaBundles: BillingBundle[] = [
  {
    sku: "Pilot Launch",
    credits: 1,
    amountMinor: 1490000,
    currency: "INR",
    pilot: true,
    originalAmountMinor: 1990000,
    discountPercent: 25,
  },
  { sku: "Launch", credits: 1, amountMinor: 1990000, currency: "INR" },
];
const usBundles: BillingBundle[] = [
  {
    sku: "Pilot Launch",
    credits: 1,
    amountMinor: 49900,
    currency: "USD",
    pilot: true,
    originalAmountMinor: 60000,
    discountPercent: 17,
  },
  { sku: "Launch", credits: 1, amountMinor: 60000, currency: "USD" },
  { sku: "2 Markets", credits: 2, amountMinor: 108000, currency: "USD" },
  { sku: "3 Markets", credits: 3, amountMinor: 153000, currency: "USD" },
  { sku: "4 Markets", credits: 4, amountMinor: 192000, currency: "USD" },
  { sku: "5 Markets", credits: 5, amountMinor: 225000, currency: "USD" },
];
const orders = new Map<string, BillingOrder>();

// Mock mode's one coupon: 10% off any regular package. The server's rules
// (limits, dates, currency) live in the Backend; this exercises the page.
const MOCK_COUPON_CODE = "WELCOME10";
const MOCK_COUPON_PERCENT = 10;

function priceWithMockCoupon(
  bundle: BillingBundle,
  couponCode: string,
): CouponPreview {
  const code = couponCode.trim().toUpperCase();
  if (code !== MOCK_COUPON_CODE) {
    throw new Error("That coupon code is not valid.");
  }
  if (bundle.pilot) {
    throw new Error(
      "Coupons cannot be used on pilot pricing. Choose a regular package.",
    );
  }
  const discountMinor = Math.floor(
    (bundle.amountMinor * MOCK_COUPON_PERCENT) / 100,
  );
  return {
    couponCode: code,
    sku: bundle.sku,
    currency: bundle.currency,
    listAmountMinor: bundle.amountMinor,
    discountMinor,
    amountMinor: bundle.amountMinor - discountMinor,
  };
}

export const billingMockAdapter = {
  async listPublicBundles(countryCode?: string): Promise<BillingCatalogue> {
    return this.listBundles(countryCode);
  },

  // The country stands in for the visitor's location, which the server reads
  // from Cloudflare; with none, it prices in USD, as the server does.
  async listBundles(countryCode?: string): Promise<BillingCatalogue> {
    const requestedCountryCode = (countryCode ?? "US").toUpperCase();
    const isIndia = requestedCountryCode === "IN";
    return {
      catalogueVersion: "2026-09-21",
      effectiveFrom: "2026-09-22T00:00:00.000Z",
      requestedCountryCode,
      pricingCountryCode: isIndia ? "IN" : "US",
      currency: isIndia ? "INR" : "USD",
      fallbackApplied: !isIndia && requestedCountryCode !== "US",
      items: isIndia ? indiaBundles : usBundles,
      pilot: true,
      pilotOffer: {
        label: "Founding pricing",
        note: "Introductory pricing for our founding clients",
        seatsTotal: 10,
        seatsRemaining: 7,
        soldOut: false,
      },
    };
  },

  async createOrder(
    sku: string,
    _idempotencyKey: string,
    _acceptedLegalDocumentVersionIdsV2?: string[],
    couponCode?: string | null,
    countryCode?: string,
  ): Promise<BillingOrder> {
    const catalogue = await this.listBundles(countryCode);
    const bundle = catalogue.items.find((item) => item.sku === sku);
    if (!bundle) throw new Error("Invalid bundle SKU");
    const coupon = couponCode ? priceWithMockCoupon(bundle, couponCode) : null;
    const orderId = `mock-${crypto.randomUUID()}`;
    const order: BillingOrder = {
      orderId,
      provider: "RAZORPAY",
      providerOrderId: `order_${crypto.randomUUID().replaceAll("-", "")}`,
      providerPaymentId: null,
      amountMinor: coupon?.amountMinor ?? bundle.amountMinor,
      currency: bundle.currency,
      credits: bundle.credits,
      status: "CREATED",
      bundleSku: bundle.sku,
      pilot: bundle.pilot ?? false,
      couponCode: coupon?.couponCode ?? null,
      listAmountMinor: coupon?.listAmountMinor ?? null,
      discountMinor: coupon?.discountMinor ?? 0,
      createdAt: new Date().toISOString(),
      paidAt: null,
      refundReason: null,
    };
    orders.set(orderId, order);
    return order;
  },

  async previewCoupon(
    couponCode: string,
    sku: string,
    countryCode?: string,
  ): Promise<CouponPreview> {
    const catalogue = await this.listBundles(countryCode);
    const bundle = catalogue.items.find((item) => item.sku === sku);
    if (!bundle) throw new Error("Invalid bundle SKU");
    return priceWithMockCoupon(bundle, couponCode);
  },

  async getOrder(orderId: string): Promise<BillingOrder> {
    const order = orders.get(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  },

  async verifyPayment(
    orderId: string,
    payload: VerifyPaymentPayload,
  ): Promise<VerifyPaymentResult> {
    const order = orders.get(orderId);
    if (!order || order.providerOrderId !== payload.providerOrderId) {
      throw new Error("Payment order does not match");
    }
    const paid: BillingOrder = {
      ...order,
      providerPaymentId: payload.providerPaymentId,
      status: "PAID",
      paidAt: new Date().toISOString(),
    };
    orders.set(orderId, paid);
    return { verified: true, order: paid };
  },
};
