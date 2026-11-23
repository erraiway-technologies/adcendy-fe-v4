import { http } from "../index";
import type { ApiResponse } from "../types";
import type {
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

function unwrapData<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

export const billingRealAdapter = {
  // No country is sent: the server prices by the visitor's location alone.
  async listPublicBundles(): Promise<BillingCatalogue> {
    const response = await http<
      ApiResponse<BillingCatalogue> | BillingCatalogue
    >("/v1/billing/public/bundles");
    return unwrapData(response);
  },

  async listBundles(): Promise<BillingCatalogue> {
    const response = await http<
      ApiResponse<BillingCatalogue> | BillingCatalogue
    >("/v1/billing/bundles");
    return unwrapData(response);
  },

  async createOrder(
    sku: string,
    idempotencyKey: string,
    acceptedLegalDocumentVersionIdsV2: string[],
    couponCode?: string | null,
    givenConsentTypesV2: string[] = [],
    billingDetails: BillingDetailsInput | null = null,
  ): Promise<BillingOrder> {
    const response = await http<ApiResponse<BillingOrder> | BillingOrder>(
      "/v1/billing/orders",
      {
        method: "POST",
        // The buyer's tick travels with the order, so the acceptance is
        // recorded before any payment is started. The coupon is checked
        // again by the server when the order is created.
        body: {
          sku,
          acceptedLegalDocumentVersionIdsV2,
          // A required consent this buyer has not given yet (V3-63).
          ...(givenConsentTypesV2.length ? { givenConsentTypesV2 } : {}),
          ...(couponCode ? { couponCode } : {}),
          // R-14: who the invoice is for; required where tax needs the state.
          ...(billingDetails ? { billingDetails } : {}),
        },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    return unwrapData(response);
  },

  async previewCoupon(couponCode: string, sku: string): Promise<CouponPreview> {
    const response = await http<ApiResponse<CouponPreview> | CouponPreview>(
      "/v1/billing/coupons/preview",
      { method: "POST", body: { couponCode, sku }, allowAuthReplay: true },
    );
    return unwrapData(response);
  },

  /** R-14: the billing details checkout asks for here, and the saved ones. */
  async getBillingDetailsForm(): Promise<BillingDetailsForm> {
    const response = await http<ApiResponse<BillingDetailsForm> | BillingDetailsForm>(
      "/v1/billing/billing-details",
    );
    return unwrapData(response);
  },

  /** R-14: the buyer's invoices and credit notes, newest first. */
  async listDocuments(): Promise<BillingDocument[]> {
    const response = await http<
      ApiResponse<{ items: BillingDocument[] }> | { items: BillingDocument[] }
    >("/v1/billing/documents");
    return unwrapData(response).items;
  },

  /** R-14: a short-lived link to one document's PDF. */
  async getDocumentLink(documentId: string): Promise<BillingDocumentLink> {
    const response = await http<ApiResponse<BillingDocumentLink> | BillingDocumentLink>(
      `/v1/billing/documents/${encodeURIComponent(documentId)}/download`,
    );
    return unwrapData(response);
  },

  async getOrder(orderId: string): Promise<BillingOrder> {
    const response = await http<ApiResponse<BillingOrder> | BillingOrder>(
      `/v1/billing/orders/${encodeURIComponent(orderId)}`,
    );
    return unwrapData(response);
  },

  async verifyPayment(
    orderId: string,
    payload: VerifyPaymentPayload,
  ): Promise<VerifyPaymentResult> {
    const response = await http<
      ApiResponse<VerifyPaymentResult> | VerifyPaymentResult
    >(`/v1/billing/orders/${encodeURIComponent(orderId)}/verify`, {
      method: "POST",
      body: payload,
    });
    return unwrapData(response);
  },
};
