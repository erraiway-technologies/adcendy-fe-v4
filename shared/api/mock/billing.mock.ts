import type {
  BillingBundle,
  BillingCatalogue,
  BillingDetailsForm,
  BillingDetailsInput,
  BillingDocument,
  BillingDocumentLink,
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
const documents: BillingDocument[] = [];

// R-14: India adds 18% GST on top, rounded to the paisa once, as the server
// does; elsewhere no tax is added.
const MOCK_GST_BASIS_POINTS = 1800;
const mockTaxMinor = (amountMinor: number, currency: string) =>
  currency === "INR" ? Math.round((amountMinor * MOCK_GST_BASIS_POINTS) / 10_000) : 0;
const withMockTax = (bundle: BillingBundle): BillingBundle => {
  const taxMinor = mockTaxMinor(bundle.amountMinor, bundle.currency);
  return { ...bundle, taxMinor, totalMinor: bundle.amountMinor + taxMinor };
};

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
  const amountMinor = bundle.amountMinor - discountMinor;
  const taxMinor = mockTaxMinor(amountMinor, bundle.currency);
  return {
    couponCode: code,
    sku: bundle.sku,
    currency: bundle.currency,
    listAmountMinor: bundle.amountMinor,
    discountMinor,
    amountMinor,
    taxMinor,
    totalMinor: amountMinor + taxMinor,
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
      items: (isIndia ? indiaBundles : usBundles).map(withMockTax),
      tax: isIndia
        ? { label: "GST", rateBasisPoints: MOCK_GST_BASIS_POINTS, addedOnTop: true }
        : null,
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
    _givenConsentTypesV2?: string[],
    billingDetails?: BillingDetailsInput | null,
    countryCode?: string,
  ): Promise<BillingOrder> {
    const catalogue = await this.listBundles(countryCode);
    const bundle = catalogue.items.find((item) => item.sku === sku);
    if (!bundle) throw new Error("Invalid bundle SKU");
    const coupon = couponCode ? priceWithMockCoupon(bundle, couponCode) : null;
    if (bundle.currency === "INR" && (!billingDetails?.stateCode || !billingDetails.postalCode)) {
      throw new Error("Choose your state.");
    }
    const taxableAmountMinor = coupon?.amountMinor ?? bundle.amountMinor;
    const taxMinor = mockTaxMinor(taxableAmountMinor, bundle.currency);
    const orderId = `mock-${crypto.randomUUID()}`;
    const order: BillingOrder = {
      orderId,
      provider: "RAZORPAY",
      providerOrderId: `order_${crypto.randomUUID().replaceAll("-", "")}`,
      providerPaymentId: null,
      amountMinor: taxableAmountMinor + taxMinor,
      taxableAmountMinor,
      taxMinor,
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
    documents.unshift({
      documentId: `doc-${orderId}`,
      kind: "invoice",
      number: `ADC/2627/${String(documents.length + 1).padStart(5, "0")}`,
      issuedOn: paid.paidAt!.slice(0, 10),
      currency: paid.currency,
      taxableMinor: paid.taxableAmountMinor ?? paid.amountMinor,
      taxMinor: paid.taxMinor ?? 0,
      totalMinor: paid.amountMinor,
      orderId,
      againstInvoiceNumber: null,
      emailed: true,
    });
    return { verified: true, order: paid };
  },

  async getBillingDetailsForm(countryCode?: string): Promise<BillingDetailsForm> {
    const isIndia = (countryCode ?? "US").toUpperCase() === "IN";
    return {
      required: isIndia,
      states: isIndia
        ? [
            { code: "07", name: "Delhi" },
            { code: "29", name: "Karnataka" },
            { code: "27", name: "Maharashtra" },
            { code: "08", name: "Rajasthan" },
          ]
        : [],
      fullAddressFromMinor: isIndia ? 5_000_000 : null,
      saved: null,
    };
  },

  async listDocuments(): Promise<BillingDocument[]> {
    return [...documents];
  },

  async getDocumentLink(documentId: string): Promise<BillingDocumentLink> {
    const document = documents.find((item) => item.documentId === documentId);
    if (!document) throw new Error("Document not found");
    return {
      url: "about:blank",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      fileName: `invoice-${document.number.replaceAll("/", "-")}.pdf`,
    };
  },
};
