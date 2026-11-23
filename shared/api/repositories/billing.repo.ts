import { createRuntimeRepositoryAdapter } from "@/lib/env";
import { billingMockAdapter } from "../mock/billing.mock";
import { billingRealAdapter } from "../real/billing.real";
import type {
  BillingDetailsInput,
  VerifyPaymentPayload,
} from "@/shared/types/billing";

const adapter = createRuntimeRepositoryAdapter(
  billingMockAdapter,
  billingRealAdapter,
);

export const billingRepository = {
  listPublicBundles: () => adapter.listPublicBundles(),
  listBundles: () => adapter.listBundles(),
  createOrder: (
    sku: string,
    idempotencyKey: string,
    acceptedLegalDocumentVersionIdsV2: string[],
    couponCode?: string | null,
    givenConsentTypesV2: string[] = [],
    billingDetails: BillingDetailsInput | null = null,
  ) =>
    adapter.createOrder(
      sku,
      idempotencyKey,
      acceptedLegalDocumentVersionIdsV2,
      couponCode,
      givenConsentTypesV2,
      billingDetails,
    ),
  /** R-14: the billing details checkout asks for here, and the saved ones. */
  getBillingDetailsForm: () => adapter.getBillingDetailsForm(),
  /** R-14: the buyer's invoices and credit notes. */
  listDocuments: () => adapter.listDocuments(),
  getDocumentLink: (documentId: string) => adapter.getDocumentLink(documentId),
  /** What a coupon does to one bundle's price; nothing is held. */
  previewCoupon: (couponCode: string, sku: string) =>
    adapter.previewCoupon(couponCode, sku),
  getOrder: (orderId: string) => adapter.getOrder(orderId),
  verifyPayment: (orderId: string, payload: VerifyPaymentPayload) =>
    adapter.verifyPayment(orderId, payload),
};
