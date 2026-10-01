import { createRuntimeRepositoryAdapter } from "@/lib/env";
import { billingMockAdapter } from "../mock/billing.mock";
import { billingRealAdapter } from "../real/billing.real";
import type { VerifyPaymentPayload } from "@/shared/types/billing";

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
  ) =>
    adapter.createOrder(
      sku,
      idempotencyKey,
      acceptedLegalDocumentVersionIdsV2,
      couponCode,
    ),
  /** What a coupon does to one bundle's price; nothing is held. */
  previewCoupon: (couponCode: string, sku: string) =>
    adapter.previewCoupon(couponCode, sku),
  getOrder: (orderId: string) => adapter.getOrder(orderId),
  verifyPayment: (orderId: string, payload: VerifyPaymentPayload) =>
    adapter.verifyPayment(orderId, payload),
};
