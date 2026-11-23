/**
 * R-14c: the operator's money reports, as the Backend serves them
 * (`/api/v2/admin/billing/reports`). Amounts are in the currency's minor unit
 * and are never added across currencies.
 */

export interface MoneyLine {
  currency: string;
  orders: number;
  grossMinor: number;
  taxMinor: number;
  refundedMinor: number;
  netMinor: number;
  credits: number;
}

export interface BusinessOverview {
  from: string;
  to: string;
  months: string[];
  totals: MoneyLine[];
  byMonth: Array<MoneyLine & { month: string }>;
  byCountry: Array<MoneyLine & { country: string }>;
  byChannel: Array<MoneyLine & { channel: 'checkout' | 'payment_link' }>;
  byClient: Array<
    MoneyLine & {
      userId: string;
      email: string;
      name: string | null;
      countries: string[];
      firstPaidAt: string;
      lastPaidAt: string;
    }
  >;
  clientCount: number;
}

export interface GstTotals {
  count: number;
  taxableMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalMinor: number;
}

export interface GstRegisterRow {
  type: 'Invoice' | 'Credit note';
  number: string;
  date: string;
  againstInvoice: string;
  supplyType: 'B2B' | 'B2C' | 'Export';
  buyerName: string;
  buyerEmail: string;
  businessName: string;
  gstin: string;
  placeOfSupply: string;
  stateCode: string;
  currency: string;
  taxableMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalMinor: number;
}

export interface GstMonth {
  month: string;
  rows: GstRegisterRow[];
  summary: {
    invoices: GstTotals;
    creditNotes: GstTotals;
    net: { b2b: GstTotals; b2c: GstTotals };
    b2cByState: Array<GstTotals & { stateCode: string; placeOfSupply: string }>;
    exports: Array<GstTotals & { currency: string }>;
    sacCodes: string[];
  };
}

export const CHANNEL_LABELS: Record<'checkout' | 'payment_link', string> = {
  checkout: 'Checkout',
  payment_link: 'Payment links',
};

/** The month in India now, as YYYY-MM. */
export function currentIndiaMonth(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 7);
}

/** The month before a YYYY-MM month. */
export function previousMonth(month: string): string {
  const [year, value] = month.split('-').map(Number);
  return value === 1 ? `${year - 1}-12` : `${year}-${String(value - 1).padStart(2, '0')}`;
}

/** The kept share of what was charged, as a whole percentage; null when nothing was charged. */
export function keptPercent(line: Pick<MoneyLine, 'grossMinor' | 'netMinor'>): number | null {
  return line.grossMinor > 0 ? Math.round((line.netMinor / line.grossMinor) * 100) : null;
}
