import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { billingMockAdapter } from "../../shared/api/mock/billing.mock.ts";
import {
  billingDetailsPayload,
  billingDetailsProblem,
  billingDocumentLabel,
  checkoutAmountRows,
  emptyBillingDetailsDraft,
  taxSuffix,
} from "../../shared/payments/invoice-billing.ts";
import { normalizeAdminOrder } from "../../shared/types/adminOrders.ts";
import type { BillingDetailsForm } from "../../shared/types/billing.ts";

// R-14: Indian prices show "+ GST", checkout shows price, tax and total before
// payment and asks for the state and PIN code an invoice needs, and every
// invoice and credit note can be downloaded.

const GST = { label: "GST", rateBasisPoints: 1800, addedOnTop: true as const };
const INDIA_FORM: BillingDetailsForm = {
  required: true,
  states: [
    { code: "08", name: "Rajasthan" },
    { code: "27", name: "Maharashtra" },
  ],
  fullAddressFromMinor: 5_000_000,
  saved: null,
};

test("a price shows '+ GST' only where tax is added on top", () => {
  assert.equal(taxSuffix(GST), "+ GST");
  assert.equal(taxSuffix(null), null);
  assert.equal(taxSuffix(undefined), null);
});

test("property: the summary rows add up to the total the buyer pays, with and without a coupon", () => {
  for (const amountMinor of [100, 49_900, 1_490_000, 1_990_000, 4_999_999]) {
    const taxMinor = Math.round((amountMinor * 1800) / 10_000);
    const bundle = { amountMinor, taxMinor, totalMinor: amountMinor + taxMinor };
    for (const discountMinor of [0, 1, Math.floor(amountMinor / 10)]) {
      const discounted = amountMinor - discountMinor;
      const couponTax = Math.round((discounted * 1800) / 10_000);
      const coupon =
        discountMinor === 0
          ? null
          : {
              couponCode: "WELCOME10",
              discountMinor,
              amountMinor: discounted,
              taxMinor: couponTax,
              totalMinor: discounted + couponTax,
            };
      for (const tax of [GST, null]) {
        const { rows, totalMinor } = checkoutAmountRows({
          bundle: tax ? bundle : { amountMinor, totalMinor: amountMinor, taxMinor: 0 },
          coupon: tax || !coupon ? coupon : { ...coupon, taxMinor: 0, totalMinor: discounted },
          tax,
        });
        const total = rows.at(-1)!;
        assert.equal(total.label, "Total");
        assert.equal(total.amountMinor, totalMinor);
        const sum = rows.slice(0, -1).reduce((acc, row) => acc + row.amountMinor, 0);
        assert.equal(sum, totalMinor, JSON.stringify({ amountMinor, discountMinor, tax }));
        assert.equal(rows.some((row) => row.label === "GST (18%)"), Boolean(tax));
      }
    }
  }
});

test("billing details: state and PIN are needed in India, GST details are optional and checked", () => {
  const draft = emptyBillingDetailsDraft(null);
  assert.equal(billingDetailsProblem(INDIA_FORM, draft, 1_990_000), "Choose your state.");
  assert.equal(
    billingDetailsProblem(INDIA_FORM, { ...draft, stateCode: "27" }, 1_990_000),
    "Enter your 6-digit PIN code.",
  );
  const filled = { ...draft, stateCode: "27", postalCode: "411001" };
  assert.equal(billingDetailsProblem(INDIA_FORM, filled, 1_990_000), null);
  assert.deepEqual(billingDetailsPayload(INDIA_FORM, filled), { stateCode: "27", postalCode: "411001" });

  const withGst = { ...filled, addGstDetails: true, gstin: "27aapfu0939f1zv" };
  assert.equal(
    billingDetailsProblem(INDIA_FORM, withGst, 1_990_000),
    "Enter the business name your GSTIN is registered to.",
  );
  assert.equal(
    billingDetailsProblem(INDIA_FORM, { ...withGst, stateCode: "08", businessName: "X" }, 1_990_000),
    "Your GSTIN is registered in a different state from the one you chose.",
  );
  const complete = { ...withGst, businessName: " Example Ltd " };
  assert.equal(billingDetailsProblem(INDIA_FORM, complete, 1_990_000), null);
  assert.deepEqual(billingDetailsPayload(INDIA_FORM, complete), {
    stateCode: "27",
    postalCode: "411001",
    gstin: "27AAPFU0939F1ZV",
    businessName: "Example Ltd",
  });
});

test("property: an address is asked for exactly from the threshold, and never outside India", () => {
  const filled = { ...emptyBillingDetailsDraft(null), stateCode: "27", postalCode: "411001" };
  for (const taxableMinor of [0, 4_999_999, 5_000_000, 9_000_000]) {
    const problem = billingDetailsProblem(INDIA_FORM, filled, taxableMinor);
    assert.equal(problem === "Enter your billing address.", taxableMinor >= 5_000_000);
    assert.equal(
      billingDetailsProblem({ ...INDIA_FORM, required: false }, emptyBillingDetailsDraft(null), taxableMinor),
      null,
    );
  }
  assert.equal(billingDetailsPayload({ ...INDIA_FORM, required: false }, filled), null);
});

test("saved details fill the form, GST section open when a GSTIN was saved", () => {
  const draft = emptyBillingDetailsDraft({
    stateCode: "27",
    postalCode: "411001",
    gstin: "27AAPFU0939F1ZV",
    businessName: "Example Ltd",
    addressLine: null,
  });
  assert.equal(draft.addGstDetails, true);
  assert.equal(billingDetailsProblem(INDIA_FORM, draft, 1_990_000), null);
});

test("mock checkout in India: GST on top, an invoice after payment", async () => {
  const catalogue = await billingMockAdapter.listBundles("IN");
  assert.deepEqual(catalogue.tax, GST);
  const launch = catalogue.items.find((item) => item.sku === "Launch")!;
  assert.equal(launch.taxMinor, 358_200);
  assert.equal(launch.totalMinor, 2_348_200);

  await assert.rejects(
    billingMockAdapter.createOrder("Launch", "k1", ["doc-terms"], null, [], null, "IN"),
    /Choose your state/,
  );
  const order = await billingMockAdapter.createOrder(
    "Launch",
    "k2",
    ["doc-terms"],
    null,
    [],
    { stateCode: "27", postalCode: "411001" },
    "IN",
  );
  assert.equal(order.amountMinor, 2_348_200);
  await billingMockAdapter.verifyPayment(order.orderId, {
    providerOrderId: order.providerOrderId!,
    providerPaymentId: "pay_1",
    signature: "0".repeat(64),
  });
  const [invoice] = await billingMockAdapter.listDocuments();
  assert.equal(invoice.orderId, order.orderId);
  assert.equal(invoice.totalMinor, 2_348_200);
  assert.equal(billingDocumentLabel(invoice), `Invoice ${invoice.number}`);
  assert.equal(
    billingDocumentLabel({ kind: "credit_note", number: "ADC-CN/2627/0001", againstInvoiceNumber: invoice.number }),
    `Credit note ADC-CN/2627/0001 (for invoice ${invoice.number})`,
  );

  const us = await billingMockAdapter.listBundles("US");
  assert.equal(us.tax, null);
  assert.ok(us.items.every((item) => item.taxMinor === 0 && item.totalMinor === item.amountMinor));
});

test("the admin orders screen reads each order's invoice and credit notes", () => {
  const order = normalizeAdminOrder({
    id: "o1",
    status: "PAID",
    currency: "INR",
    amountMinor: 2_348_200,
    taxMinor: 358_200,
    documents: [
      { documentId: "d1", kind: "invoice", number: "ADC/2627/00001", issuedOn: "2026-11-23", totalMinor: 2_348_200, currency: "INR", emailed: true },
      { documentId: "d2", kind: "credit_note", number: "ADC-CN/2627/0001", issuedOn: "2026-11-24", totalMinor: 100, currency: "INR", emailed: false },
      { kind: "invoice" },
    ],
  });
  assert.equal(order?.taxMinor, 358_200);
  assert.deepEqual(
    order?.documents.map((document) => [document.kind, document.number, document.emailed]),
    [
      ["invoice", "ADC/2627/00001", true],
      ["credit_note", "ADC-CN/2627/0001", false],
    ],
  );
});

test("checkout, the landing prices and the billing page carry the tax and the invoices", () => {
  const checkout = readFileSync("app/(app)/app/checkout/page.tsx", "utf8");
  assert.match(checkout, /checkoutAmountRows\(/);
  assert.match(checkout, /billingDetailsPayload\(billingForm, draft\)/);
  assert.match(checkout, /<InvoicesCard \/>/);
  assert.match(checkout, /Boolean\(billingProblem\)/);
  const pricing = readFileSync("features/landing/components/home/PricingCard.tsx", "utf8");
  assert.match(pricing, /taxSuffix\(catalogue\.data\?\.tax\)/);
  assert.equal((pricing.match(/priceSuffix=\{priceSuffix\}/g) ?? []).length, 2);
});
