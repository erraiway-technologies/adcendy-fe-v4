import type {
  BillingBundle,
  BillingCatalogueTax,
  BillingDetailsForm,
  BillingDetailsInput,
  BillingDocument,
} from "@/shared/types/billing";
import type { CouponPreview } from "@/shared/types/coupons";

/**
 * R-14: prices with their tax, and the billing details an invoice needs.
 * The server computes every figure; this only arranges what it returned.
 */

/** "+ GST" beside a price where tax is added on top; null where none is. */
export function taxSuffix(tax: BillingCatalogueTax | null | undefined): string | null {
  return tax?.addedOnTop ? `+ ${tax.label}` : null;
}

export type CheckoutAmountRow = {
  label: string;
  amountMinor: number;
  strong?: boolean;
};

/**
 * The order summary's rows: price, any coupon, the tax, and the total the
 * buyer pays. Where no tax is added, the rows are price, coupon and total.
 */
export function checkoutAmountRows(input: {
  bundle: Pick<BillingBundle, "amountMinor" | "taxMinor" | "totalMinor">;
  coupon: Pick<CouponPreview, "couponCode" | "discountMinor" | "amountMinor" | "taxMinor" | "totalMinor"> | null;
  tax: BillingCatalogueTax | null | undefined;
}): { rows: CheckoutAmountRow[]; totalMinor: number } {
  const { bundle, coupon, tax } = input;
  const rows: CheckoutAmountRow[] = [{ label: "Price", amountMinor: bundle.amountMinor }];
  if (coupon) {
    rows.push({ label: `Promo code ${coupon.couponCode} applied`, amountMinor: -coupon.discountMinor });
  }
  const taxMinor = coupon ? (coupon.taxMinor ?? 0) : (bundle.taxMinor ?? 0);
  const totalMinor = coupon
    ? (coupon.totalMinor ?? coupon.amountMinor)
    : (bundle.totalMinor ?? bundle.amountMinor);
  if (tax?.addedOnTop) {
    rows.push({ label: `${tax.label} (${tax.rateBasisPoints / 100}%)`, amountMinor: taxMinor });
  }
  rows.push({ label: "Total", amountMinor: totalMinor, strong: true });
  return { rows, totalMinor };
}

/** The buyer's details as typed, before the server checks them. */
export type BillingDetailsDraft = {
  stateCode: string;
  postalCode: string;
  addGstDetails: boolean;
  gstin: string;
  businessName: string;
  addressLine: string;
};

export function emptyBillingDetailsDraft(saved?: BillingDetailsForm["saved"]): BillingDetailsDraft {
  return {
    stateCode: saved?.stateCode ?? "",
    postalCode: saved?.postalCode ?? "",
    addGstDetails: Boolean(saved?.gstin),
    gstin: saved?.gstin ?? "",
    businessName: saved?.businessName ?? "",
    addressLine: saved?.addressLine ?? "",
  };
}

const GSTIN_SHAPE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * What is still missing before payment, in the buyer's words; null when the
 * details are complete. The server checks them again, including the GSTIN's
 * check character, and its message is shown if it refuses.
 */
export function billingDetailsProblem(
  form: BillingDetailsForm | null | undefined,
  draft: BillingDetailsDraft,
  taxableMinor: number,
): string | null {
  if (!form?.required) return null;
  if (!draft.stateCode) return "Choose your state.";
  if (!/^[1-9]\d{5}$/.test(draft.postalCode.replace(/\s/g, ""))) return "Enter your 6-digit PIN code.";
  if (draft.addGstDetails) {
    const gstin = draft.gstin.replace(/\s/g, "").toUpperCase();
    if (!GSTIN_SHAPE.test(gstin)) return "Enter a 15-character GSTIN, or turn off GST details.";
    if (gstin.slice(0, 2) !== draft.stateCode) {
      return "Your GSTIN is registered in a different state from the one you chose.";
    }
    if (!draft.businessName.trim()) return "Enter the business name your GSTIN is registered to.";
  } else if (
    form.fullAddressFromMinor !== null &&
    taxableMinor >= form.fullAddressFromMinor &&
    !draft.addressLine.trim()
  ) {
    return "Enter your billing address.";
  }
  return null;
}

/** The details sent with the order; GST fields only when the buyer added them. */
export function billingDetailsPayload(
  form: BillingDetailsForm | null | undefined,
  draft: BillingDetailsDraft,
): BillingDetailsInput | null {
  if (!form?.required) return null;
  return {
    stateCode: draft.stateCode,
    postalCode: draft.postalCode.replace(/\s/g, ""),
    ...(draft.addGstDetails
      ? { gstin: draft.gstin.replace(/\s/g, "").toUpperCase(), businessName: draft.businessName.trim() }
      : {}),
    ...(draft.addressLine.trim() ? { addressLine: draft.addressLine.trim() } : {}),
  };
}

/** How a document is named in a list: "Invoice ADC/2627/00001". */
export function billingDocumentLabel(
  document: Pick<BillingDocument, "kind" | "number" | "againstInvoiceNumber">,
): string {
  if (document.kind === "credit_note") {
    return `Credit note ${document.number}${document.againstInvoiceNumber ? ` (for invoice ${document.againstInvoiceNumber})` : ""}`;
  }
  return `Invoice ${document.number}`;
}
