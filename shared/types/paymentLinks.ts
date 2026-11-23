import type { BillingDetailsInput } from './billing.ts';

/**
 * R-14b: payment links. An admin prices catalogue packages by quantity for
 * one client; the client opens the link with their email and pays. The
 * Backend holds every amount: these types only carry what it returns.
 */

export type PaymentLinkState = 'open' | 'paid' | 'cancelled' | 'expired' | 'locked';

export interface PaymentLinkLineInput {
  sku: string;
  quantity: number;
}

export interface PaymentLinkRequest {
  clientEmail: string;
  pricingCountryCode: string;
  lines: PaymentLinkLineInput[];
  discountMinor?: number;
  billingDetails?: BillingDetailsInput | null;
  expiresInDays?: number;
}

export interface PaymentLinkOptions {
  markets: Array<{ countryCode: string; currency: string; taxed: boolean }>;
  packages: Array<{ sku: string; credits: number; amountMinor: number; currency: string }>;
  billingDetails: {
    required: boolean;
    states: Array<{ code: string; name: string }>;
    fullAddressFromMinor: number | null;
  };
  client: {
    email: string;
    name: string | null;
    saved: {
      stateCode: string | null;
      postalCode: string | null;
      gstin: string | null;
      businessName: string | null;
      addressLine: string | null;
    } | null;
  } | null;
  limits: {
    maxLines: number;
    maxQuantity: number;
    defaultExpiryDays: number;
    minExpiryDays: number;
    maxExpiryDays: number;
  };
}

export interface PaymentLinkPreview {
  client: { email: string; name: string | null };
  pricingCountryCode: string;
  currency: string;
  lines: Array<{ sku: string; label: string; quantity: number; unitAmountMinor: number; amountMinor: number }>;
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
  tax: { label: string; rateBasisPoints: number } | null;
  credits: number;
  billingProblem: string | null;
}

export interface AdminPaymentLink {
  id: string;
  state: Exclude<PaymentLinkState, 'locked'>;
  locked: boolean;
  client: { email: string; name: string | null };
  orderId: string;
  currency: string;
  totalMinor: number;
  taxMinor: number;
  credits: number;
  lines: Array<{ sku: string; label: string; quantity: number; amountMinor: number }>;
  discountMinor: number;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  emailedAt: string | null;
  emailError: string | null;
}

export interface AdminPaymentLinkPage {
  items: AdminPaymentLink[];
  page: number;
  pageSize: number;
  total: number;
}

/** The link as just made or renewed: the only time its full address is shown. */
export interface IssuedPaymentLink {
  link: AdminPaymentLink;
  url: string;
}

export interface PublicPaymentLink {
  state: Exclude<PaymentLinkState, 'locked'>;
  client: { name: string; email: string };
  currency: string;
  lines: Array<{ label: string; quantity: number; unitAmountMinor: number; amountMinor: number }>;
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  tax: { label: string; rateBasisPoints: number } | null;
  totalMinor: number;
  credits: number;
  expiresAt: string;
  billingDetails: {
    stateName: string | null;
    postalCode: string | null;
    gstin: string | null;
    businessName: string | null;
  } | null;
  requirements: {
    documents: Array<{ id: string; documentType: string; version: string; title: string; publicUrl: string | null }>;
    consents: string[];
  };
}

export interface PaymentLinkPayment {
  providerOrderId: string;
  amountMinor: number;
  currency: string;
  prefillEmail: string;
  description: string;
}

export const PAYMENT_LINK_STATE_LABELS: Record<PaymentLinkState, string> = {
  open: 'Waiting for payment',
  paid: 'Paid',
  cancelled: 'Cancelled',
  expired: 'Expired',
  locked: 'Locked',
};

/** What the payment page says when a link cannot be paid. */
export const PAYMENT_LINK_CLOSED_MESSAGES: Record<Exclude<PaymentLinkState, 'open'>, string> = {
  paid: 'This payment link has been paid. Thank you: the credits are in your account and the invoice was emailed to you.',
  cancelled: 'This payment link was cancelled. Please ask us for a new one.',
  expired: 'This payment link has expired. Please ask us for a new one.',
  locked: 'Too many wrong email addresses were tried. This link is locked for an hour; please try again later.',
};

/** The rows under a link's packages; they always add up to the total. */
export function paymentLinkAmountRows(link: {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  tax: { label: string; rateBasisPoints: number } | null;
}): Array<{ label: string; amountMinor: number; strong?: boolean }> {
  const rows: Array<{ label: string; amountMinor: number; strong?: boolean }> = [
    { label: 'Price', amountMinor: link.subtotalMinor },
  ];
  if (link.discountMinor > 0) rows.push({ label: 'Discount', amountMinor: -link.discountMinor });
  if (link.tax) {
    rows.push({ label: `${link.tax.label} (${link.tax.rateBasisPoints / 100}%)`, amountMinor: link.taxMinor });
  }
  rows.push({ label: 'Total', amountMinor: link.totalMinor, strong: true });
  return rows;
}

/** The key from a /pay/<key> address, or null when it cannot be one. */
export function readPaymentLinkKey(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');
const asCount = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const STATES = new Set(['open', 'paid', 'cancelled', 'expired']);

export function normalizeAdminPaymentLink(value: unknown): AdminPaymentLink | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string') return null;
  const client = (row.client ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    state: STATES.has(asText(row.state)) ? (row.state as AdminPaymentLink['state']) : 'open',
    locked: row.locked === true,
    client: { email: asText(client.email), name: typeof client.name === 'string' ? client.name : null },
    orderId: asText(row.orderId),
    currency: asText(row.currency),
    totalMinor: asCount(row.totalMinor),
    taxMinor: asCount(row.taxMinor),
    credits: asCount(row.credits),
    lines: Array.isArray(row.lines)
      ? row.lines.map((line) => {
          const item = (line ?? {}) as Record<string, unknown>;
          return {
            sku: asText(item.sku),
            label: asText(item.label),
            quantity: asCount(item.quantity),
            amountMinor: asCount(item.amountMinor),
          };
        })
      : [],
    discountMinor: asCount(row.discountMinor),
    createdAt: asText(row.createdAt),
    expiresAt: asText(row.expiresAt),
    paidAt: typeof row.paidAt === 'string' ? row.paidAt : null,
    emailedAt: typeof row.emailedAt === 'string' ? row.emailedAt : null,
    emailError: typeof row.emailError === 'string' ? row.emailError : null,
  };
}

export function normalizeAdminPaymentLinkPage(value: unknown): AdminPaymentLinkPage {
  const page = (value ?? {}) as Record<string, unknown>;
  return {
    items: Array.isArray(page.items)
      ? page.items.map(normalizeAdminPaymentLink).filter((link): link is AdminPaymentLink => link !== null)
      : [],
    page: asCount(page.page) || 1,
    pageSize: asCount(page.pageSize) || 20,
    total: asCount(page.total),
  };
}
