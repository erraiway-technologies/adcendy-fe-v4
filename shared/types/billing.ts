import type { BillingRefundReason } from "@/shared/payments/pricingPreference";

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface BillingBundle {
  sku: string;
  credits: number;
  amountMinor: number;
  currency: string;
  /** A pilot bundle, sold only while pilot seats remain. */
  pilot?: boolean;
  /** The price before the discount, when the server states one. */
  originalAmountMinor?: number | null;
  discountPercent?: number | null;
  /** The tax on this price where tax is added on top (India); 0 elsewhere. */
  taxMinor?: number;
  /** What the buyer pays: the price plus its tax. */
  totalMinor?: number;
}

/** The tax added on top of a market's prices (India's GST); null elsewhere. */
export interface BillingCatalogueTax {
  label: string;
  /** 1800 is 18%. */
  rateBasisPoints: number;
  addedOnTop: true;
}

/** The pilot as the server reports it; seats are counted from orders. */
export interface BillingPilotOffer {
  label: string;
  note: string | null;
  seatsTotal: number;
  seatsRemaining: number;
  soldOut: boolean;
}

export interface BillingCatalogue {
  catalogueVersion: string;
  effectiveFrom: string;
  requestedCountryCode: string;
  pricingCountryCode: string;
  currency: string;
  fallbackApplied: boolean;
  items: BillingBundle[];
  /**
   * Whether pilot bundles are on sale. Only an explicit `true` puts pilot
   * pricing on the page; absent or false removes it. Regular bundles are
   * listed either way.
   */
  pilot?: boolean;
  /**
   * Present while the pilot runs in this market, sold out or not, so the
   * page can show how many seats are left.
   */
  pilotOffer?: BillingPilotOffer | null;
  /** The tax added on top of these prices; null or absent where none is. */
  tax?: BillingCatalogueTax | null;
}

export interface BillingOrder {
  orderId: string;
  provider: "RAZORPAY";
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amountMinor: number;
  currency: string;
  credits: number;
  status: PaymentStatus;
  bundleSku: string;
  /** Bought at the pilot price. */
  pilot?: boolean;
  /** The coupon applied; `amountMinor` is already after it. */
  couponCode?: string | null;
  /** The bundle price before the coupon; null when none was applied. */
  listAmountMinor?: number | null;
  discountMinor?: number;
  /** What tax was charged on (after any coupon); null before invoicing. */
  taxableAmountMinor?: number | null;
  /** The tax inside `amountMinor`; 0 where none is charged. */
  taxMinor?: number;
  createdAt: string;
  paidAt: string | null;
  /**
   * Why the order is being refunded instead of credited (backend R-8);
   * null for every other order.
   */
  refundReason?: BillingRefundReason | null;
}

export interface VerifyPaymentPayload {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  order: BillingOrder;
}

/** The buyer's billing details, as checkout sends them. */
export interface BillingDetailsInput {
  stateCode?: string;
  postalCode?: string;
  gstin?: string;
  businessName?: string;
  addressLine?: string;
}

/** What checkout asks a buyer for in their market, and what they gave last time. */
export interface BillingDetailsForm {
  /** True where tax needs the buyer's state and PIN code (India). */
  required: boolean;
  states: Array<{ code: string; name: string }>;
  /** A buyer without a GSTIN gives a street address from this taxable amount. */
  fullAddressFromMinor: number | null;
  saved: {
    stateCode: string | null;
    postalCode: string | null;
    gstin: string | null;
    businessName: string | null;
    addressLine: string | null;
  } | null;
}

/** An issued invoice or credit note. */
export interface BillingDocument {
  documentId: string;
  kind: "invoice" | "credit_note";
  number: string;
  issuedOn: string;
  currency: string;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
  orderId: string | null;
  /** Set on a credit note: the invoice it credits. */
  againstInvoiceNumber: string | null;
  emailed: boolean;
}

/** A short-lived link to one document's PDF. */
export interface BillingDocumentLink {
  url: string;
  expiresAt: string;
  fileName: string;
}
