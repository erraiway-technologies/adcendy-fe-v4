'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentLinksRepository } from '@/shared/api/repositories';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatOpsDateTime } from '@/shared/components/ops/opsUtils';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import { majorToMinorUnits } from '@/shared/types/coupons';
import {
  PAYMENT_LINK_STATE_LABELS,
  paymentLinkAmountRows,
  type AdminPaymentLink,
  type IssuedPaymentLink,
  type PaymentLinkRequest,
} from '@/shared/types/paymentLinks';

const money = (amountMinor: number, currency: string) => formatMinorAmount({ amountMinor, currency });

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** The link's address with a copy button: shown when it is made or renewed, and never again. */
function IssuedLink({ issued, onClose }: { issued: IssuedPaymentLink; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment link ready</DialogTitle>
          <DialogDescription>
            {issued.link.emailedAt
              ? `Emailed to ${issued.link.client.email}.`
              : `The email to ${issued.link.client.email} did not go out${issued.link.emailError ? ` (${issued.link.emailError})` : ''}. Share the link yourself.`}{' '}
            Copy it now to share on WhatsApp or anywhere else: for safety it is not shown again. If you need it later,
            use New link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={issued.url} onFocus={(event) => event.target.select()} data-testid="payment-link-url" />
          <Button type="button" variant="outline" onClick={() => void copy()}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {money(issued.link.totalMinor, issued.link.currency)} · {issued.link.credits}{' '}
          {issued.link.credits === 1 ? 'credit' : 'credits'} · works until {formatOpsDateTime(issued.link.expiresAt)}
        </p>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type LineDraft = { sku: string; quantity: string };

function CreateLinkDialog({ onClose, onIssued }: { onClose: () => void; onIssued: (issued: IssuedPaymentLink) => void }) {
  const queryClient = useQueryClient();
  const [clientEmail, setClientEmail] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [market, setMarket] = useState('IN');
  const [lines, setLines] = useState<LineDraft[]>([{ sku: '', quantity: '1' }]);
  const [discount, setDiscount] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [stateCode, setStateCode] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [addressLine, setAddressLine] = useState('');

  const options = useQuery({
    queryKey: queryKeys.paymentLinks.options(market, lookupEmail),
    queryFn: () => paymentLinksRepository.options({ pricingCountryCode: market, clientEmail: lookupEmail || undefined }),
  });
  const packages = options.data?.packages ?? [];
  const form = options.data?.billingDetails;
  const client = options.data?.client ?? null;

  // A line with no package chosen yet stands for the market's first package.
  const skuOf = (line: LineDraft) => line.sku || packages[0]?.sku || '';

  /** Finds the client, and fills the form with the details they saved last time. */
  const findClient = async () => {
    const email = clientEmail.trim();
    setLookupEmail(email);
    if (!email) return;
    const found = await queryClient
      .fetchQuery({
        queryKey: queryKeys.paymentLinks.options(market, email),
        queryFn: () => paymentLinksRepository.options({ pricingCountryCode: market, clientEmail: email }),
      })
      .catch(() => null);
    const saved = found?.client?.saved;
    if (!saved) return;
    setStateCode(saved.stateCode ?? '');
    setPostalCode(saved.postalCode ?? '');
    setGstin(saved.gstin ?? '');
    setBusinessName(saved.businessName ?? '');
    setAddressLine(saved.addressLine ?? '');
  };

  const discountMinor = discount.trim() ? majorToMinorUnits(discount) : 0;
  const request: PaymentLinkRequest | null =
    client && discountMinor !== null && lines.every((line) => skuOf(line) && Number(line.quantity) >= 1)
      ? {
          clientEmail: client.email,
          pricingCountryCode: market,
          lines: lines.map((line) => ({ sku: skuOf(line), quantity: Number(line.quantity) })),
          discountMinor: discountMinor || undefined,
          expiresInDays: Number(expiresInDays) || undefined,
          billingDetails: form?.required
            ? {
                stateCode: stateCode || undefined,
                postalCode: postalCode.trim() || undefined,
                gstin: gstin.trim() || undefined,
                businessName: businessName.trim() || undefined,
                addressLine: addressLine.trim() || undefined,
              }
            : null,
        }
      : null;

  const preview = useQuery({
    queryKey: ['paymentLinks', 'preview', request],
    queryFn: () => paymentLinksRepository.preview(request as PaymentLinkRequest),
    enabled: request !== null,
    retry: false,
  });

  const create = useMutation({
    mutationFn: () => paymentLinksRepository.create(request as PaymentLinkRequest),
    onSuccess: async (issued) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.paymentLinks.all });
      onIssued(issued);
    },
  });

  const usedSkus = new Set(lines.map(skuOf));
  const canAddLine = lines.length < (options.data?.limits.maxLines ?? 10) && packages.some((p) => !usedSkus.has(p.sku));
  const addressNeeded =
    form?.fullAddressFromMinor !== null &&
    form?.fullAddressFromMinor !== undefined &&
    (preview.data?.taxableMinor ?? 0) >= form.fullAddressFromMinor;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New payment link</DialogTitle>
          <DialogDescription>
            The client gets the link by email as soon as it is made. Once they pay, the credits are added to their
            account and one invoice listing every package is emailed to them.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (request && preview.data && !preview.data.billingProblem) create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="link-client">Client account email</Label>
            <div className="flex gap-2">
              <Input
                id="link-client"
                type="email"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="name@company.com"
              />
              <Button type="button" variant="outline" onClick={() => void findClient()}>
                Find
              </Button>
            </div>
            {lookupEmail ? (
              client ? (
                <p className="text-sm text-muted-foreground">
                  {client.name ? `${client.name} · ` : ''}
                  {client.email}
                </p>
              ) : options.isFetching ? null : (
                <p className="text-sm text-destructive">No client account has that email.</p>
              )
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Market (sets the prices and tax)</Label>
              <Select value={market} onValueChange={(value) => { setMarket(value); setLines([{ sku: '', quantity: '1' }]); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options.data?.markets ?? []).map((item) => (
                    <SelectItem key={item.countryCode} value={item.countryCode}>
                      {item.countryCode} · {item.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-expiry">Works for (days)</Label>
              <Input
                id="link-expiry"
                inputMode="numeric"
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Packages</Label>
            {lines.map((line, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={skuOf(line)}
                  onValueChange={(sku) => setLines(lines.map((item, i) => (i === index ? { ...item, sku } : item)))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages
                      .filter((item) => item.sku === skuOf(line) || !usedSkus.has(item.sku))
                      .map((item) => (
                        <SelectItem key={item.sku} value={item.sku}>
                          {item.sku} · {item.credits} {item.credits === 1 ? 'credit' : 'credits'} ·{' '}
                          {money(item.amountMinor, item.currency)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  className="w-24"
                  inputMode="numeric"
                  aria-label="Quantity"
                  value={line.quantity}
                  onChange={(event) =>
                    setLines(
                      lines.map((item, i) =>
                        i === index ? { ...item, quantity: event.target.value.replace(/\D/g, '') } : item,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove package"
                  disabled={lines.length === 1}
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {canAddLine ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines([...lines, { sku: '', quantity: '1' }])}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add a package
              </Button>
            ) : null}
          </div>

          <div className="space-y-2 sm:w-1/2">
            <Label htmlFor="link-discount">Discount off the total, before tax (optional)</Label>
            <Input
              id="link-discount"
              inputMode="decimal"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              placeholder="0"
            />
          </div>

          {form?.required ? (
            <div className="space-y-3 rounded-md border border-border p-3">
              <p className="text-sm font-medium">Billing details for the invoice</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.states.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-pin">PIN code</Label>
                  <Input
                    id="link-pin"
                    inputMode="numeric"
                    maxLength={6}
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-gstin">GSTIN (optional)</Label>
                  <Input id="link-gstin" value={gstin} onChange={(event) => setGstin(event.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-business">Business name {gstin ? '' : '(optional)'}</Label>
                  <Input id="link-business" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-address">Billing address {addressNeeded ? '' : '(optional)'}</Label>
                <Input id="link-address" value={addressLine} onChange={(event) => setAddressLine(event.target.value)} />
              </div>
            </div>
          ) : null}

          {preview.data ? (
            <div className="space-y-1 rounded-md bg-muted/40 p-3 text-sm" data-testid="payment-link-preview">
              {preview.data.lines.map((line) => (
                <div key={line.sku} className="flex justify-between">
                  <span>
                    {line.quantity} × {line.label}
                  </span>
                  <span>{money(line.amountMinor, preview.data.currency)}</span>
                </div>
              ))}
              {paymentLinkAmountRows(preview.data).map((row) => (
                <div key={row.label} className={`flex justify-between ${row.strong ? 'font-semibold' : ''}`}>
                  <span>{row.label}</span>
                  <span>{money(row.amountMinor, preview.data.currency)}</span>
                </div>
              ))}
              <p className="pt-1 text-muted-foreground">
                {preview.data.credits} {preview.data.credits === 1 ? 'credit' : 'credits'} added when paid.
              </p>
              {preview.data.billingProblem ? (
                <p className="text-destructive">{preview.data.billingProblem}</p>
              ) : null}
            </div>
          ) : preview.error ? (
            <p className="text-sm text-destructive">{errorText(preview.error, 'Could not price these packages.')}</p>
          ) : null}

          {create.error ? (
            <p className="text-sm text-destructive">{errorText(create.error, 'The link was not created.')}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!request || !preview.data || Boolean(preview.data.billingProblem) || create.isPending}
            >
              {create.isPending ? 'Creating…' : 'Create and email link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkRow({ link, onIssued }: { link: AdminPaymentLink; onIssued: (issued: IssuedPaymentLink) => void }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentLinks.all });
  const cancel = useMutation({ mutationFn: () => paymentLinksRepository.cancel(link.id), onSuccess: refresh });
  const renew = useMutation({
    mutationFn: () => paymentLinksRepository.renew(link.id),
    onSuccess: async (issued) => {
      await refresh();
      onIssued(issued);
    },
  });
  const error = cancel.error ?? renew.error;
  return (
    <div className="flex flex-col gap-2 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{link.client.name || link.client.email}</span>
          <Badge variant={link.state === 'paid' ? 'default' : 'outline'}>{PAYMENT_LINK_STATE_LABELS[link.state]}</Badge>
          {link.locked ? <Badge variant="destructive">Locked after wrong emails</Badge> : null}
        </div>
        <p className="text-sm">
          {money(link.totalMinor, link.currency)} · {link.lines.map((line) => `${line.quantity} × ${line.sku}`).join(', ')}
          {link.discountMinor > 0 ? ` · ${money(link.discountMinor, link.currency)} off` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {link.client.email} · made {formatOpsDateTime(link.createdAt)} ·{' '}
          {link.paidAt ? `paid ${formatOpsDateTime(link.paidAt)}` : `works until ${formatOpsDateTime(link.expiresAt)}`}
          {link.emailedAt ? '' : ' · email not sent'}
        </p>
        {error ? <p className="text-xs text-destructive">{errorText(error, 'That did not work.')}</p> : null}
      </div>
      {link.state === 'open' ? (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={renew.isPending} onClick={() => renew.mutate()}>
            <Link2 className="mr-1 h-4 w-4" />
            New link
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            Cancel link
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** R-14b: payment links on the admin orders screen. */
export function PaymentLinksPanel() {
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<IssuedPaymentLink | null>(null);
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: queryKeys.paymentLinks.list(page),
    queryFn: () => paymentLinksRepository.list({ page, pageSize: 10 }),
  });
  const items = list.data?.items ?? [];
  const lastPage = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Payment links</CardTitle>
          <CardDescription>
            For a client buying several packages at once. The link is emailed to them; paying adds the credits and
            emails one invoice.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New payment link
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {list.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading payment links…</p>
        ) : list.error ? (
          <p className="p-4 text-sm text-destructive">{errorText(list.error, 'Failed to load payment links.')}</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No payment links yet.</p>
        ) : (
          items.map((link) => <LinkRow key={link.id} link={link} onIssued={setIssued} />)
        )}
        {list.data && list.data.total > list.data.pageSize ? (
          <div className="flex items-center justify-between p-4 text-sm text-muted-foreground">
            <span>
              Page {page} of {lastPage}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
      {creating ? (
        <CreateLinkDialog
          onClose={() => setCreating(false)}
          onIssued={(result) => {
            setCreating(false);
            setIssued(result);
          }}
        />
      ) : null}
      {issued ? <IssuedLink issued={issued} onClose={() => setIssued(null)} /> : null}
    </Card>
  );
}
