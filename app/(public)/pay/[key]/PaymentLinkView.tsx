'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequiredAgreement } from '@/shared/legal/RequiredAgreement';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ENV } from '@/lib/env';
import { paymentLinksRepository } from '@/shared/api/repositories';
import { queryKeys } from '@/shared/api/queryKeys';
import { buildConsentLabel } from '@/shared/legal/legal-flow-utils';
import { useConsentCatalogue } from '@/shared/legal/useLegalCatalogue';
import { formatMinorAmount, loadRazorpayCheckout } from '@/shared/payments/razorpay';
import {
  PAYMENT_LINK_CLOSED_MESSAGES,
  paymentLinkAmountRows,
  readPaymentLinkKey,
  type PaymentLinkState,
  type PublicPaymentLink,
} from '@/shared/types/paymentLinks';

const money = (amountMinor: number, currency: string) => formatMinorAmount({ amountMinor, currency });

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-[140px] max-sm:pt-[110px]">{children}</main>;
}

/**
 * R-14b: a client pays a payment link here, signed in or not. The page shows
 * nothing about the purchase until the email the link was sent to is given;
 * the Backend holds every amount and charges only what it stored.
 */
export function PaymentLinkView({ linkKey }: { linkKey: string }) {
  const key = readPaymentLinkKey(linkKey);
  const [email, setEmail] = useState('');
  const [link, setLink] = useState<PublicPaymentLink | null>(null);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [consents, setConsents] = useState<string[]>([]);
  const [paidState, setPaidState] = useState<PaymentLinkState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pollUntilPaid, setPollUntilPaid] = useState(false);
  const consentCatalogue = useConsentCatalogue();

  const state = useQuery({
    queryKey: queryKeys.paymentLinks.page(key ?? 'invalid'),
    queryFn: () => paymentLinksRepository.publicState(key as string),
    enabled: key !== null,
    retry: false,
    // After paying, until Razorpay's capture marks the link paid.
    refetchInterval: (query) => (pollUntilPaid && query.state.data?.state !== 'paid' ? 3000 : false),
  });
  const isPaid = paidState === 'paid' || (pollUntilPaid && state.data?.state === 'paid');

  const open = useMutation({
    mutationFn: () => paymentLinksRepository.open(key as string, email.trim()),
    onSuccess: (opened) => {
      setLink(opened);
      setAccepted([]);
      setConsents([]);
    },
    onError: () => void state.refetch(),
  });

  const documents = link?.requirements.documents ?? [];
  const requiredConsents = link?.requirements.consents ?? [];
  const allAccepted =
    documents.every((document) => accepted.includes(document.id)) &&
    requiredConsents.every((consent) => consents.includes(consent));

  const pay = useMutation({
    mutationFn: async () => {
      if (!key || !link) throw new Error('Open the link first.');
      const keyId = ENV.public.razorpayKeyId;
      if (!ENV.API.isMock && !keyId) throw new Error('Payments are temporarily unavailable. Please try again later.');
      const Razorpay = ENV.API.isMock ? null : await loadRazorpayCheckout();
      const payment = await paymentLinksRepository.pay(key, {
        email: email.trim(),
        acceptedLegalDocumentVersionIdsV2: documents.map((document) => document.id),
        givenConsentTypesV2: requiredConsents,
      });
      const complete = async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        setNotice('Payment received. Confirming it with Razorpay…');
        try {
          const verified = await paymentLinksRepository.verify(key, {
            email: email.trim(),
            providerOrderId: response.razorpay_order_id,
            providerPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          if (verified.state === 'paid') setPaidState('paid');
          else setPollUntilPaid(true);
        } catch (error) {
          setNotice(errorText(error, 'We could not confirm the payment. Please contact us before paying again.'));
        }
      };
      if (ENV.API.isMock) {
        await complete({
          razorpay_order_id: payment.providerOrderId,
          razorpay_payment_id: 'pay_mock',
          razorpay_signature: '0'.repeat(64),
        });
        return;
      }
      if (!Razorpay || !keyId) throw new Error('Razorpay Checkout is not available.');
      const checkout = new Razorpay({
        key: keyId,
        amount: payment.amountMinor,
        currency: payment.currency,
        name: 'AdCendy',
        description: payment.description,
        image: `${window.location.origin}/Adcendy-logo-tight.svg`,
        order_id: payment.providerOrderId,
        prefill: { email: payment.prefillEmail },
        theme: { color: '#232323' },
        retry: { enabled: true },
        modal: {
          confirm_close: true,
          ondismiss: () => setNotice('Payment window closed. You have not been charged for an incomplete payment.'),
        },
        handler: (response) => void complete(response),
      });
      checkout.on('payment.failed', (response) =>
        setNotice(response.error?.description ?? 'Payment failed. Please retry or use another method.'),
      );
      checkout.open();
    },
    onMutate: () => setNotice(null),
  });

  if (!key || state.error) {
    return (
      <Shell>
        <Alert variant="destructive">
          <AlertDescription>This payment link is not valid. Please check the address in your email.</AlertDescription>
        </Alert>
      </Shell>
    );
  }

  if (isPaid) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Thank you, payment received</CardTitle>
            <CardDescription>
              {link ? `${link.credits} ${link.credits === 1 ? 'credit has' : 'credits have'} been added to your account. ` : ''}
              Your invoice is on its way to your email, and you can also download it from Billing when you sign in.
            </CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  const current = state.data?.state;
  if (current && current !== 'open' && !link) {
    return (
      <Shell>
        <Alert>
          <AlertDescription>{PAYMENT_LINK_CLOSED_MESSAGES[current]}</AlertDescription>
        </Alert>
      </Shell>
    );
  }

  if (!link) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Your AdCendy payment link</CardTitle>
            <CardDescription>
              Enter the email address this link was sent to. You don&apos;t need to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (email.trim()) open.mutate();
              }}
            >
              <Label htmlFor="pay-email">Email address</Label>
              <Input
                id="pay-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {open.error ? (
                <p className="text-sm text-destructive">{errorText(open.error, 'That email does not match.')}</p>
              ) : null}
              <Button type="submit" disabled={!email.trim() || open.isPending || state.isLoading}>
                {open.isPending ? 'Checking…' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle>Your AdCendy order</CardTitle>
          <CardDescription>
            For {link.client.name}. This link works until {new Date(link.expiresAt).toLocaleDateString()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1 text-sm" data-testid="payment-link-summary">
            {link.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4">
                <span>
                  {line.quantity} × {line.label}
                </span>
                <span>{money(line.amountMinor, link.currency)}</span>
              </div>
            ))}
            <div className="my-2 border-t border-border" />
            {paymentLinkAmountRows(link).map((row) => (
              <div key={row.label} className={`flex justify-between ${row.strong ? 'text-base font-semibold' : ''}`}>
                <span>{row.label}</span>
                <span>{money(row.amountMinor, link.currency)}</span>
              </div>
            ))}
            <p className="pt-1 text-muted-foreground">
              {link.credits} {link.credits === 1 ? 'credit' : 'credits'} added to your account once you pay.
            </p>
          </div>

          {link.billingDetails ? (
            <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Invoice to</p>
              <p>{link.billingDetails.businessName ?? link.client.name}</p>
              <p>
                {[link.billingDetails.stateName, link.billingDetails.postalCode].filter(Boolean).join(' - ')}
              </p>
              {link.billingDetails.gstin ? <p>GSTIN: {link.billingDetails.gstin}</p> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <RequiredAgreement
              testId="payment-link-required-agreement"
              documents={documents.map((document) => ({
                key: document.id,
                label: document.title,
                href: document.publicUrl ?? null,
              }))}
              consents={requiredConsents.map((consent) => ({
                key: consent,
                label: buildConsentLabel(consent, consentCatalogue.data ?? []),
                href: consentCatalogue.data?.find((item) => item.consentType === consent)?.detailsUrl ?? null,
              }))}
              consentPurpose="needed to build your strategy"
              checked={allAccepted}
              onCheckedChange={(checked) => {
                setAccepted(checked ? documents.map((document) => document.id) : []);
                setConsents(checked ? [...requiredConsents] : []);
              }}
            />
          </div>

          {notice ? (
            <Alert>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          {pay.error ? (
            <Alert variant="destructive">
              <AlertDescription>{errorText(pay.error, 'The payment could not be started.')}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={!allAccepted || pay.isPending || pollUntilPaid}
            onClick={() => pay.mutate()}
          >
            {pollUntilPaid ? 'Confirming payment…' : `Pay ${money(link.totalMinor, link.currency)}`}
          </Button>
        </CardContent>
      </Card>
    </Shell>
  );
}
