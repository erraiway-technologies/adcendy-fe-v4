"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RequiredAgreement } from "@/shared/legal/RequiredAgreement";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { billingRepository, legalRepository } from "@/shared/api/repositories";
import { queryKeys } from "@/shared/api/queryKeys";
import { resolveLegalErrorMessage } from "@/shared/legal/legal-error";
import {
  areAllRequiredDocumentsAccepted,
  buildConsentLabel,
  buildLegalChecklistItems,
  getCheckoutRequiredDocumentIds,
} from "@/shared/legal/legal-flow-utils";
import { useConsentCatalogue } from "@/shared/legal/useLegalCatalogue";
import type { BillingBundle, BillingOrder } from "@/shared/types/billing";
import type { CouponPreview } from "@/shared/types/coupons";
import {
  formatMinorAmount,
  loadRazorpayCheckout,
  type RazorpayCheckoutResponse,
} from "@/shared/payments/razorpay";
import {
  bundleOriginalPrice,
  marketCountDescription,
  marketCountLabel,
  pilotSeatsLabel,
  splitPilotCatalogue,
} from "@/shared/payments/market-catalogue";
import { safeReturnPath } from "@/shared/payments/campaign-entitlement";
import { useAuth } from "@/features/auth/useAuth";
import ENV from "@/lib/env";
import {
  INDIAN_PAYMENT_REFUND_MESSAGE,
  isIndianPaymentRefund,
} from "@/shared/payments/pricingPreference";
import {
  isOrderAwaitingCapture,
  nextOrderPollDelay,
} from "@/shared/payments/order-polling";
import { getSupportContact } from "@/shared/support/support-contact";
import {
  billingDetailsPayload,
  billingDetailsProblem,
  checkoutAmountRows,
  emptyBillingDetailsDraft,
  taxSuffix,
  type BillingDetailsDraft,
} from "@/shared/payments/invoice-billing";
import { BUSINESS_TERMS } from "@/shared/marketing/business-terms";
import { InvoicesCard } from "@/shared/components/billing/InvoicesCard";

function contactSupportPhrase(): string {
  const support = getSupportContact();
  return support ? `contact support at ${support.label}` : "contact support";
}

/** The struck-through price a discounted bundle is measured against. */
function PriceBeforeDiscount({ bundle }: { bundle: BillingBundle }) {
  const original = bundleOriginalPrice(bundle);
  if (!original) return null;
  return (
    <span className="ml-2 text-sm text-muted-foreground">
      <span className="line-through">{formatMinorAmount(original)}</span>
      {bundle.discountPercent ? (
        <span className="ml-1 font-semibold text-primary">
          −{bundle.discountPercent}%
        </span>
      ) : null}
    </span>
  );
}

/** One selectable package; a pilot option is set apart. */
function BundleOption({
  bundle,
  tag,
  note,
  highlight = false,
  selected,
  onSelect,
  priceSuffix = null,
}: {
  bundle: BillingBundle;
  tag?: string;
  note?: string | null;
  highlight?: boolean;
  selected: boolean;
  onSelect: (sku: string) => void;
  /** R-14: "+ GST" where tax is added on top of the price. */
  priceSuffix?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bundle.sku)}
      className={`rounded-lg p-4 text-left transition-colors ${highlight ? "border-2" : "border"} ${selected ? "border-primary bg-primary/10" : highlight ? "border-primary/60 hover:border-primary" : "border-border hover:border-primary/50"}`}
    >
      {tag ? (
        <div
          className={`mb-1 text-xs font-semibold ${highlight ? "text-primary" : "text-muted-foreground"}`}
        >
          {tag}
        </div>
      ) : null}
      <div className="text-2xl font-semibold">
        {marketCountLabel(bundle.credits)}
      </div>
      <div className="text-sm text-muted-foreground">
        {marketCountDescription(bundle.credits)}
      </div>
      <div className="mt-3 font-medium">
        {formatMinorAmount(bundle)}
        {priceSuffix ? (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {priceSuffix}
          </span>
        ) : null}
        <PriceBeforeDiscount bundle={bundle} />
      </div>
      {note ? (
        <div
          className={`mt-1 text-xs ${highlight ? "font-semibold text-primary" : "text-muted-foreground"}`}
        >
          {note}
        </div>
      ) : null}
    </button>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export default function CheckoutPage() {
  const router = useRouter();
  // V3-371: where to go after paying (the draft being submitted), read once.
  const [returnTo] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("returnTo"),
  );
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // SKUs are the server's to name, so nothing is preselected by name: until
  // the buyer picks, the first package the server listed is the choice.
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [acceptedDocumentIds, setAcceptedDocumentIds] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<BillingOrder | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  // The coupon as the server priced it for one bundle; checked again by the
  // server when the order is created.
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  // R-14: who the invoice is for. Filled from the buyer's last checkout.
  const [billingDraft, setBillingDraft] = useState<BillingDetailsDraft | null>(
    null,
  );
  const billingDetailsQuery = useQuery({
    queryKey: queryKeys.billing.billingDetails(),
    queryFn: () => billingRepository.getBillingDetailsForm(),
    refetchOnWindowFocus: false,
  });
  const billingForm = billingDetailsQuery.data ?? null;
  const draft = billingDraft ?? emptyBillingDetailsDraft(billingForm?.saved);
  const updateDraft = (change: Partial<BillingDetailsDraft>) => {
    setSubmitError(null);
    setBillingDraft({ ...draft, ...change });
  };

  // V3-63: what this buyer still owes - the purchase documents, any policy
  // updated since sign-up, any required consent never given - and no more:
  // the terms and privacy policy accepted at sign-up are not asked again.
  const documentsQuery = useQuery({
    queryKey: queryKeys.legal.checkoutRequirements(),
    queryFn: () => legalRepository.getCheckoutRequirements(),
    refetchOnWindowFocus: false,
  });
  const consentCatalogueQuery = useConsentCatalogue();
  const [givenConsents, setGivenConsents] = useState<string[]>([]);
  const orderQuery = useQuery({
    queryKey: queryKeys.billing.order(currentOrder?.orderId ?? "none"),
    queryFn: () => billingRepository.getOrder(currentOrder!.orderId),
    enabled: shouldPoll && Boolean(currentOrder),
    refetchInterval: (query) => {
      const order = query.state.data as BillingOrder | undefined;
      // A refund can take days to settle; the buyer is told at once, so
      // there is nothing more to wait for.
      if (!shouldPoll || isIndianPaymentRefund(order)) return false;
      if (!isOrderAwaitingCapture(order?.status)) return false;
      return nextOrderPollDelay(
        query.state.dataUpdateCount + query.state.errorUpdateCount,
      );
    },
    refetchOnWindowFocus: true,
  });

  const displayedOrder = orderQuery.data ?? currentOrder;
  // An India-priced order paid from abroad is refunded, and the buyer is
  // told why.
  const refundedForIndianPayment = isIndianPaymentRefund(displayedOrder);
  // Polling has hit its cap while Razorpay still has not confirmed capture:
  // the buyer is told the markets will follow, rather than left watching.
  const orderPollState = currentOrder
    ? queryClient.getQueryState(queryKeys.billing.order(currentOrder.orderId))
    : undefined;
  const captureWaitExhausted =
    shouldPoll &&
    !refundedForIndianPayment &&
    !orderQuery.isFetching &&
    isOrderAwaitingCapture(displayedOrder?.status) &&
    orderPollState !== undefined &&
    nextOrderPollDelay(
      orderPollState.dataUpdateCount + orderPollState.errorUpdateCount,
    ) === false;
  // Prices follow the visitor's location alone; there is no switch
  // (backend R-8).
  const bundlesQuery = useQuery({
    queryKey: queryKeys.billing.bundles(),
    queryFn: () => billingRepository.listBundles(),
    refetchOnWindowFocus: false,
  });

  const activeDocuments = useMemo(
    () => documentsQuery.data?.documents ?? [],
    [documentsQuery.data],
  );
  const outstandingConsents = useMemo(
    () => documentsQuery.data?.consents ?? [],
    [documentsQuery.data],
  );
  const hasGivenOutstandingConsents = outstandingConsents.every((consentType) =>
    givenConsents.includes(consentType),
  );
  const bundles = useMemo(
    () => bundlesQuery.data?.items ?? [],
    [bundlesQuery.data],
  );
  const selectedBundle =
    bundles.find((bundle) => bundle.sku === selectedSku) ?? bundles[0];
  const couponForSelection =
    appliedCoupon && appliedCoupon.sku === selectedBundle?.sku
      ? appliedCoupon
      : null;
  // R-14: the price, any coupon, the tax added on top, and the total paid.
  const catalogueTax = bundlesQuery.data?.tax ?? null;
  const priceSuffix = taxSuffix(catalogueTax);
  const summary = selectedBundle
    ? checkoutAmountRows({
        bundle: selectedBundle,
        coupon: couponForSelection,
        tax: catalogueTax,
      })
    : null;
  const amountDue =
    selectedBundle && summary
      ? { amountMinor: summary.totalMinor, currency: selectedBundle.currency }
      : null;
  const taxableMinor = selectedBundle
    ? (couponForSelection?.amountMinor ?? selectedBundle.amountMinor)
    : 0;
  const billingProblem = billingDetailsProblem(billingForm, draft, taxableMinor);
  const pilotOffer = bundlesQuery.data?.pilotOffer ?? null;
  // The pilot is shown beside the regular price for the same markets.
  const { comparisons, others } = useMemo(
    () => splitPilotCatalogue(bundles),
    [bundles],
  );
  const checkoutChecklistItems = useMemo(
    () =>
      buildLegalChecklistItems(activeDocuments, "CHECKOUT"),
    [activeDocuments],
  );
  const requiredDocumentIds = useMemo(
    () => getCheckoutRequiredDocumentIds(activeDocuments),
    [activeDocuments],
  );
  const hasAcceptedAllRequiredDocuments = useMemo(
    () =>
      areAllRequiredDocumentsAccepted(requiredDocumentIds, acceptedDocumentIds) &&
      hasGivenOutstandingConsents,
    [acceptedDocumentIds, requiredDocumentIds, hasGivenOutstandingConsents],
  );

  useEffect(() => {
    if (displayedOrder?.status !== "PAID") return;

    let cancelled = false;
    const returnToDashboard = async () => {
      try {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.profile.me(),
        });
      } finally {
        // V3-371: back to the draft being submitted, when checkout came from one.
        if (!cancelled) router.replace(safeReturnPath(returnTo));
      }
    };

    void returnToDashboard();
    return () => {
      cancelled = true;
    };
  }, [displayedOrder?.status, queryClient, router, returnTo]);

  // "Your markets will appear" would contradict the refund message beside it.
  const statusSuccess = refundedForIndianPayment
    ? null
    : displayedOrder?.status === "PAID"
      ? `Payment captured. ${marketCountLabel(displayedOrder.credits)} added to your account.`
      : captureWaitExhausted
        ? `Payment verified. Razorpay has not confirmed capture yet; your markets will be added as soon as it does. Refresh this page later, or ${contactSupportPhrase()} if they do not appear.`
        : submitSuccess;
  const statusError = refundedForIndianPayment
    ? INDIAN_PAYMENT_REFUND_MESSAGE
    : displayedOrder?.status === "FAILED" ||
        displayedOrder?.status === "CANCELLED"
      ? "The payment was not completed. No markets were added; you can try again."
      : displayedOrder?.status === "REFUNDED"
        ? "This payment was refunded. Its markets are no longer available."
        : submitError;

  const completeCheckout = async (
    order: BillingOrder,
    response: RazorpayCheckoutResponse,
  ) => {
    setIsCheckoutOpen(false);
    setSubmitError(null);
    setSubmitSuccess(
      "Payment received. Verifying and waiting for capture confirmation…",
    );
    try {
      const result = await billingRepository.verifyPayment(order.orderId, {
        providerOrderId: response.razorpay_order_id,
        providerPaymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });
      setCurrentOrder(result.order);
      if (result.order.status === "PAID") {
        setSubmitSuccess(
          `Payment captured. ${marketCountLabel(result.order.credits)} added to your account.`,
        );
      } else {
        setSubmitSuccess(
          "Payment verified. Your markets will appear as soon as Razorpay confirms capture.",
        );
        setShouldPoll(true);
      }
    } catch (error) {
      setSubmitSuccess(null);
      setSubmitError(
        errorMessage(
          error,
          `Payment verification failed. Please ${contactSupportPhrase()} before retrying.`,
        ),
      );
    }
  };

  const startPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBundle) throw new Error("Select how many markets.");
      if (requiredDocumentIds.length === 0) {
        throw new Error(
          "Required checkout policies are unavailable. Please refresh.",
        );
      }
      if (!hasAcceptedAllRequiredDocuments)
        throw new Error("CHECKOUT_POLICIES_NOT_ACCEPTED_V2");
      const razorpayKeyId = ENV.public.razorpayKeyId;
      if (!ENV.API.isMock && !razorpayKeyId) {
        throw new Error(
          "Payments are temporarily unavailable because Razorpay is not configured.",
        );
      }

      const Razorpay = ENV.API.isMock ? null : await loadRazorpayCheckout();
      // The tick travels with the order: the Backend records the acceptance
      // against it before Razorpay is opened, so a payment can never be taken
      // on an order whose policies were not accepted.
      if (billingProblem) throw new Error(billingProblem);
      const order = await billingRepository.createOrder(
        selectedBundle.sku,
        crypto.randomUUID(),
        requiredDocumentIds,
        couponForSelection?.couponCode ?? null,
        outstandingConsents,
        billingDetailsPayload(billingForm, draft),
      );
      if (!order.providerOrderId)
        throw new Error("Razorpay did not return an order ID.");
      setCurrentOrder(order);

      if (ENV.API.isMock) {
        await completeCheckout(order, {
          razorpay_order_id: order.providerOrderId,
          razorpay_payment_id: `pay_${crypto.randomUUID().replaceAll("-", "")}`,
          razorpay_signature: "0".repeat(64),
        });
        return;
      }

      if (!Razorpay || !razorpayKeyId) {
        throw new Error("Razorpay Checkout is not available.");
      }

      const checkout = new Razorpay({
        key: razorpayKeyId,
        amount: order.amountMinor,
        currency: order.currency,
        name: "AdCendy",
        description: `${marketCountLabel(order.credits)} — ${marketCountDescription(order.credits)}`,
        image: `${window.location.origin}/Adcendy-logo-tight.svg`,
        order_id: order.providerOrderId,
        prefill: { email: user?.email },
        theme: { color: "#232323" },
        retry: { enabled: true },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsCheckoutOpen(false);
            setSubmitSuccess(null);
            setSubmitError(
              "Payment window closed. You have not been charged for an incomplete payment.",
            );
          },
        },
        handler: (response) => void completeCheckout(order, response),
      });
      checkout.on("payment.failed", (response) => {
        setSubmitSuccess(null);
        setSubmitError(
          response.error?.description ??
            "Payment failed. Please retry or use another method.",
        );
      });
      setIsCheckoutOpen(true);
      checkout.open();
    },
    onMutate: () => {
      setSubmitError(null);
      setSubmitSuccess(null);
      setShouldPoll(false);
      setCurrentOrder(null);
    },
    onError: (error: unknown) => {
      setIsCheckoutOpen(false);
      setSubmitSuccess(null);
      setSubmitError(
        resolveLegalErrorMessage(
          error,
          errorMessage(error, "Could not start payment. Please retry."),
        ),
      );
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: ({ code, sku }: { code: string; sku: string }) =>
      billingRepository.previewCoupon(code, sku),
    onMutate: () => setCouponError(null),
    onSuccess: (preview) => {
      setAppliedCoupon(preview);
      setCouponInput(preview.couponCode);
    },
    onError: (error: unknown) => {
      setAppliedCoupon(null);
      setCouponError(errorMessage(error, "Could not check that coupon."));
    },
  });

  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code || !selectedBundle) return;
    applyCouponMutation.mutate({ code, sku: selectedBundle.sku });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput("");
  };

  // A coupon is priced per package, so picking another one prices it again.
  const selectBundle = (sku: string) => {
    setSelectedSku(sku);
    if (appliedCoupon && appliedCoupon.sku !== sku) {
      applyCouponMutation.mutate({ code: appliedCoupon.couponCode, sku });
    }
  };

  // One tick agrees to every required document and consent shown.
  const acceptAllRequired = (checked: boolean) => {
    setSubmitError(null);
    setAcceptedDocumentIds(
      checked
        ? [
            ...new Set([
              ...requiredDocumentIds,
              ...checkoutChecklistItems.map((item) => item.id),
            ]),
          ]
        : [],
    );
    setGivenConsents(checked ? [...outstandingConsents] : []);
  };

  const isBusy = startPaymentMutation.isPending || isCheckoutOpen;
  // The Backend says which policies checkout requires; none listed means
  // they are not published, and no payment starts without them.
  const policiesReady = requiredDocumentIds.length > 0;
  const isWaitingOnPolicies =
    policiesReady && !hasAcceptedAllRequiredDocuments && !isBusy;

  const scrollToPolicies = () => {
    document
      .getElementById("checkout-policies")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-5 p-6">
      <div className="space-y-1">
        <h1 className="font-space-grotesk text-3xl font-bold text-foreground">
          Billing &amp; markets
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm your market, accept the required policies, and pay securely
          with Razorpay.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Choose your markets</CardTitle>
              <CardDescription>
                One market is one country, covered end to end. Prices are
                loaded from AdCendy’s billing server.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {pilotOffer ? (
                <p className="text-sm font-medium text-primary sm:col-span-3">
                  {pilotOffer.label} — {pilotSeatsLabel(pilotOffer)}.
                  {pilotOffer.note && !pilotOffer.soldOut
                    ? ` ${pilotOffer.note}.`
                    : ""}
                </p>
              ) : null}
              {bundlesQuery.data?.fallbackApplied ? (
                <Alert className="sm:col-span-3">
                  <AlertDescription>
                    Local pricing is not configured for this country yet. The
                    US price in USD applies.
                  </AlertDescription>
                </Alert>
              ) : null}
              {/* While the pilot is on sale it replaces the regular package for
                  the same markets: the pilot shows that price struck through. */}
              {comparisons.map(({ pilot }) => (
                <BundleOption
                  key={pilot.sku}
                  bundle={pilot}
                  tag={pilotOffer?.label ?? "Pilot price"}
                  note={pilotOffer ? pilotSeatsLabel(pilotOffer) : null}
                  highlight
                  selected={selectedBundle?.sku === pilot.sku}
                  onSelect={selectBundle}
                  priceSuffix={priceSuffix}
                />
              ))}
              {comparisons.length > 0 && others.length > 0 ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-3">
                  More markets
                </p>
              ) : null}
              {others.map((bundle) => (
                <BundleOption
                  key={bundle.sku}
                  bundle={bundle}
                  selected={selectedBundle?.sku === bundle.sku}
                  onSelect={selectBundle}
                  priceSuffix={priceSuffix}
                />
              ))}
              {bundlesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading prices…
                </p>
              ) : null}
              {bundlesQuery.isError ? (
                <Alert variant="destructive" className="sm:col-span-3">
                  <AlertDescription>Could not load pricing.</AlertDescription>
                </Alert>
              ) : null}
              <p className="text-sm text-muted-foreground sm:col-span-3">
                Need a set of countries these don’t cover, or an agency
                partnership?{" "}
                <a
                  className="text-primary hover:underline"
                  href={BUSINESS_TERMS.contact.quoteBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a call for a quote
                </a>{" "}
                — we run the same campaign across each country you name and
                price the package with you. Or email{" "}
                <a
                  className="text-primary hover:underline"
                  href={`mailto:${BUSINESS_TERMS.contact.hello}`}
                >
                  {BUSINESS_TERMS.contact.hello}
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card
            id="checkout-policies"
            className={
              isWaitingOnPolicies ? "border-primary/60 transition-colors" : undefined
            }
          >
            <CardHeader>
              <CardTitle>2. Review and accept</CardTitle>
              <CardDescription>
                These acceptances are linked to this payment order before
                Checkout opens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documentsQuery.isLoading ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  Loading checkout policies…
                </div>
              ) : null}
              {documentsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load checkout policies.
                  </AlertDescription>
                </Alert>
              ) : null}
              <RequiredAgreement
                testId="checkout-required-agreement"
                documents={checkoutChecklistItems.map((item) => ({
                  key: item.id,
                  label: item.label,
                  href: item.href ?? null,
                }))}
                consents={outstandingConsents.map((consentType) => ({
                  key: consentType,
                  label: buildConsentLabel(
                    consentType,
                    consentCatalogueQuery.data ?? [],
                  ),
                  href:
                    consentCatalogueQuery.data?.find(
                      (item) => item.consentType === consentType,
                    )?.detailsUrl ?? null,
                }))}
                consentPurpose="needed to build your strategy"
                checked={hasAcceptedAllRequiredDocuments}
                onCheckedChange={acceptAllRequired}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void documentsQuery.refetch()}
                disabled={isBusy}
              >
                Refresh policies
              </Button>
            </CardContent>
          </Card>

          {billingForm?.required ? (
            <Card id="checkout-billing-details">
              <CardHeader>
                <CardTitle>3. Billing details</CardTitle>
                <CardDescription>
                  For your GST invoice. Your state decides which GST applies.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="billing-state"
                    className="text-sm font-medium text-foreground"
                  >
                    State
                  </label>
                  <select
                    id="billing-state"
                    value={draft.stateCode}
                    onChange={(event) =>
                      updateDraft({ stateCode: event.target.value })
                    }
                    disabled={isBusy}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  >
                    <option value="">Choose your state</option>
                    {billingForm.states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="billing-postal-code"
                    className="text-sm font-medium text-foreground"
                  >
                    PIN code
                  </label>
                  <Input
                    id="billing-postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={draft.postalCode}
                    onChange={(event) =>
                      updateDraft({
                        postalCode: event.target.value.replace(/\D/g, ""),
                      })
                    }
                    disabled={isBusy}
                    placeholder="6 digits"
                  />
                </div>
                {billingForm.fullAddressFromMinor !== null &&
                taxableMinor >= billingForm.fullAddressFromMinor &&
                !draft.addGstDetails ? (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="billing-address"
                      className="text-sm font-medium text-foreground"
                    >
                      Billing address
                    </label>
                    <Input
                      id="billing-address"
                      value={draft.addressLine}
                      onChange={(event) =>
                        updateDraft({ addressLine: event.target.value })
                      }
                      disabled={isBusy}
                      maxLength={300}
                    />
                  </div>
                ) : null}
                <label className="flex items-start gap-3 sm:col-span-2">
                  <Checkbox
                    checked={draft.addGstDetails}
                    onCheckedChange={(checked) =>
                      updateDraft({ addGstDetails: checked === true })
                    }
                    disabled={isBusy}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground/90">
                    Add GST details to claim input credit
                  </span>
                </label>
                {draft.addGstDetails ? (
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="billing-gstin"
                        className="text-sm font-medium text-foreground"
                      >
                        GSTIN
                      </label>
                      <Input
                        id="billing-gstin"
                        value={draft.gstin}
                        onChange={(event) =>
                          updateDraft({
                            gstin: event.target.value.toUpperCase(),
                          })
                        }
                        disabled={isBusy}
                        maxLength={15}
                        placeholder="15 characters"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="billing-business-name"
                        className="text-sm font-medium text-foreground"
                      >
                        Registered business name
                      </label>
                      <Input
                        id="billing-business-name"
                        value={draft.businessName}
                        onChange={(event) =>
                          updateDraft({ businessName: event.target.value })
                        }
                        disabled={isBusy}
                        maxLength={200}
                      />
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
            <CardDescription>
              Razorpay securely handles card, UPI, wallet, and netbanking
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedBundle ? (
              <div className="flex items-end justify-between border-b border-border pb-4">
                <div>
                  <div className="font-medium">
                    {marketCountLabel(selectedBundle.credits)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    One-time purchase
                  </div>
                </div>
                <div className="text-right">
                  {couponForSelection ? (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatMinorAmount(selectedBundle)}
                    </div>
                  ) : null}
                  <div className="text-xl font-semibold">
                    {amountDue ? formatMinorAmount(amountDue) : null}
                  </div>
                </div>
              </div>
            ) : null}
            {summary && selectedBundle && summary.rows.length > 2 ? (
              <dl
                data-testid="checkout-amount-rows"
                className="space-y-1 border-b border-border pb-4 text-sm"
              >
                {summary.rows.map((row) => (
                  <div
                    key={row.label}
                    className={`flex justify-between ${row.strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    <dt>{row.label}</dt>
                    <dd>
                      {row.amountMinor < 0 ? "−" : ""}
                      {formatMinorAmount({
                        amountMinor: Math.abs(row.amountMinor),
                        currency: selectedBundle.currency,
                      })}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="checkout-coupon"
                className="text-sm font-medium text-foreground"
              >
                Coupon code
              </label>
              {couponForSelection ? (
                <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                  <span>
                    <span className="font-mono font-semibold">
                      {couponForSelection.couponCode}
                    </span>{" "}
                    −
                    {formatMinorAmount({
                      amountMinor: couponForSelection.discountMinor,
                      currency: couponForSelection.currency,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    disabled={isBusy}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="checkout-coupon"
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCoupon();
                      }
                    }}
                    placeholder="Enter a code"
                    maxLength={32}
                    disabled={isBusy || applyCouponMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyCoupon}
                    disabled={
                      isBusy ||
                      applyCouponMutation.isPending ||
                      !couponInput.trim() ||
                      !selectedBundle
                    }
                  >
                    {applyCouponMutation.isPending ? "Checking…" : "Apply"}
                  </Button>
                </div>
              )}
              {couponError ? (
                <p className="text-sm text-destructive">{couponError}</p>
              ) : null}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Server-verified
                payment signature
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Markets added
                only after capture
              </div>
            </div>

            {statusError ? (
              <Alert variant="destructive">
                <AlertDescription>{statusError}</AlertDescription>
              </Alert>
            ) : null}
            {statusSuccess ? (
              <Alert>
                <AlertDescription>{statusSuccess}</AlertDescription>
              </Alert>
            ) : null}
            {displayedOrder ? (
              <p className="text-xs text-muted-foreground">
                Order {displayedOrder.orderId} · {displayedOrder.status}
              </p>
            ) : null}

            {isWaitingOnPolicies ? (
              <p
                id="checkout-pay-hint"
                className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-foreground"
              >
                To pay, tick the agreement box in{" "}
                <button
                  type="button"
                  onClick={scrollToPolicies}
                  className="font-medium text-primary hover:underline"
                >
                  2. Review and accept
                </button>
                .
              </p>
            ) : null}
            {billingProblem && !isWaitingOnPolicies && !isBusy ? (
              <p
                id="checkout-billing-hint"
                className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-foreground"
              >
                {billingProblem} (3. Billing details)
              </p>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              aria-describedby={
                isWaitingOnPolicies ? "checkout-pay-hint" : undefined
              }
              onClick={() => startPaymentMutation.mutate()}
              disabled={
                isBusy ||
                documentsQuery.isLoading ||
                bundlesQuery.isLoading ||
                !selectedBundle ||
                !policiesReady ||
                !hasAcceptedAllRequiredDocuments ||
                billingDetailsQuery.isLoading ||
                Boolean(billingProblem)
              }
            >
              {startPaymentMutation.isPending
                ? "Preparing secure checkout…"
                : isCheckoutOpen
                  ? "Checkout open…"
                  : amountDue
                    ? `Pay ${formatMinorAmount(amountDue)}`
                    : "Select a market"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              AdCendy never receives or stores your card, UPI PIN, or banking
              credentials.
            </p>
          </CardContent>
        </Card>
      </div>

      <InvoicesCard />
    </div>
  );
}
