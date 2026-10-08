'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, ChevronLeft, Undo2 } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useAdminOrders, useCreateRefund } from '@/hooks/useAdminOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatOpsDateTime } from '@/shared/components/ops/opsUtils';
import { marketCountLabel } from '@/shared/payments/market-catalogue';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import { majorToMinorUnits } from '@/shared/types/coupons';
import {
  defaultMarketsToTakeBack,
  marketsLeftToTakeBack,
  refundMarketsLabel,
  refundStateOf,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminRefund,
  type RefundCreditsAction,
} from '@/shared/types/adminOrders';

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  CREATED: 'Not paid',
  PENDING: 'Awaiting capture',
  PAID: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const REFUND_STATUS_LABELS: Record<AdminRefund['status'], string> = {
  REQUESTED: 'With Razorpay',
  PROCESSED: 'Refunded',
  FAILED: 'Failed',
};

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const money = (amountMinor: number, currency: string) => formatMinorAmount({ amountMinor, currency });

/** The amount as typed in the main unit, prefilled without grouping. */
const toMajorInput = (amountMinor: number) => (amountMinor / 100).toFixed(2).replace(/\.00$/, '');

function RefundDialog({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const createRefund = useCreateRefund();
  const [amount, setAmount] = useState(toMajorInput(order.refundableMinor));
  const [action, setAction] = useState<RefundCreditsAction>('TAKE_BACK');
  const amountMinor = majorToMinorUnits(amount);
  const suggestedMarkets =
    amountMinor !== null ? defaultMarketsToTakeBack(order, Math.min(amountMinor, order.refundableMinor)) : 0;
  const [markets, setMarkets] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const leftToTake = marketsLeftToTakeBack(order);
  const marketsValue = markets ?? String(suggestedMarkets);
  const isFull = amountMinor === order.refundableMinor;

  const submit = () => {
    if (amountMinor === null || amountMinor > order.refundableMinor) {
      setProblem(`Enter an amount up to ${money(order.refundableMinor, order.currency)}.`);
      return;
    }
    const creditsToTakeBack = Number(marketsValue);
    if (action === 'TAKE_BACK' && (!Number.isInteger(creditsToTakeBack) || creditsToTakeBack < 0 || creditsToTakeBack > leftToTake)) {
      setProblem(`Markets to take back must be a whole number from 0 to ${leftToTake}.`);
      return;
    }
    if (reason.trim().length < 3) {
      setProblem('Say why, for the record.');
      return;
    }
    setProblem(null);
    createRefund.mutate(
      {
        orderId: order.id,
        payload: {
          amountMinor,
          creditsAction: action,
          ...(action === 'TAKE_BACK' ? { creditsToTakeBack } : {}),
          reason: reason.trim(),
        },
      },
      {
        onSuccess: onClose,
        onError: (error) => setProblem(errorText(error, 'The refund was not started.')),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refund {order.buyerEmail}</DialogTitle>
          <DialogDescription>
            {money(order.amountMinor, order.currency)} for {marketCountLabel(order.credits).toLowerCase()}
            {order.refundedMinor > 0 ? `, ${money(order.refundedMinor, order.currency)} already refunded` : ''}.
            The buyer has {marketCountLabel(order.buyerCreditsBalance).toLowerCase()} unused right now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Amount to refund ({order.currency})</Label>
            <Input
              id="refund-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Up to {money(order.refundableMinor, order.currency)}.{' '}
              {isFull ? 'This refunds everything left on the order.' : 'Less than that is a partial refund; the order stays paid.'}
            </p>
          </div>

          <div className="space-y-3">
            <Label>The order&apos;s markets</Label>
            <RadioGroup value={action} onValueChange={(value) => setAction(value as RefundCreditsAction)}>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="TAKE_BACK" id="refund-take-back" className="mt-0.5" />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">Take back unused markets</span>
                  <span className="block text-xs text-muted-foreground">
                    Markets already used for a campaign stay used; only what the buyer still has is removed.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="KEEP" id="refund-keep" className="mt-0.5" />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">Let them keep the markets</span>
                  <span className="block text-xs text-muted-foreground">
                    Money back, nothing removed - a goodwill refund.
                  </span>
                </span>
              </label>
            </RadioGroup>
            {action === 'TAKE_BACK' ? (
              <div className="space-y-2 pl-1">
                <Label htmlFor="refund-markets">Markets to take back</Label>
                <Input
                  id="refund-markets"
                  inputMode="numeric"
                  className="w-28"
                  value={marketsValue}
                  onChange={(event) => setMarkets(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Suggested {suggestedMarkets}: the share this amount paid for. At most {leftToTake} from this order,
                  and never more than the buyer has unused when Razorpay completes the refund.
                </p>
                {Number(marketsValue) > order.buyerCreditsBalance ? (
                  <p className="text-xs font-medium text-foreground">
                    The buyer has only {order.buyerCreditsBalance} unused now, so at most{' '}
                    {order.buyerCreditsBalance} will be taken back; the rest were already used.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Customer asked within the refund window"
              maxLength={500}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Razorpay sends the money back now; the markets change when Razorpay confirms the refund, usually
            within minutes. This cannot be undone.
          </p>
          {problem ? <p className="text-sm text-destructive">{problem}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={createRefund.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={createRefund.isPending || amountMinor === null}>
            {createRefund.isPending
              ? 'Refunding…'
              : `Refund ${amountMinor !== null ? money(amountMinor, order.currency) : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundLine({ refund }: { refund: AdminRefund }) {
  const who =
    refund.source === 'PROVIDER_DASHBOARD'
      ? 'Refunded in the Razorpay dashboard; unused markets taken back by default'
      : `By ${refund.requestedByEmail ?? 'an admin'}`;
  return (
    <li className="space-y-0.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{money(refund.amountMinor, refund.currency)}</span>
        <Badge variant={refund.status === 'FAILED' ? 'destructive' : 'secondary'}>
          {REFUND_STATUS_LABELS[refund.status]}
        </Badge>
        <span className="text-muted-foreground">{refundMarketsLabel(refund)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {who} · {formatOpsDateTime(refund.processedAt ?? refund.createdAt)}
        {refund.reason && refund.source === 'ADMIN' ? ` · ${refund.reason}` : ''}
        {refund.failureMessage ? ` · ${refund.failureMessage}` : ''}
      </p>
    </li>
  );
}

function OrderRow({ order, onRefund }: { order: AdminOrder; onRefund: (order: AdminOrder) => void }) {
  const refundState = refundStateOf(order);
  return (
    <div className="space-y-3 border-b border-border p-4 last:border-b-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{order.buyerEmail}</span>
            <Badge variant={order.status === 'PAID' ? 'default' : 'secondary'}>{STATUS_LABELS[order.status]}</Badge>
            {refundState === 'partial' ? <Badge variant="outline">Partly refunded</Badge> : null}
            {refundState === 'in-flight' ? <Badge variant="outline">Refund with Razorpay</Badge> : null}
          </div>
          <p className="text-sm">
            {money(order.amountMinor, order.currency)} · {marketCountLabel(order.credits)}
            {order.couponCode
              ? ` · ${order.couponCode} (${money(order.discountMinor, order.currency)} off)`
              : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatOpsDateTime(order.paidAt ?? order.createdAt)} · buyer has{' '}
            {marketCountLabel(order.buyerCreditsBalance).toLowerCase()} unused
            {order.providerPaymentId ? ` · ${order.providerPaymentId}` : ''}
          </p>
        </div>
        {order.refundableMinor > 0 ? (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => onRefund(order)}>
            <Undo2 className="mr-2 h-4 w-4" />
            Refund
          </Button>
        ) : null}
      </div>
      {order.refunds.length > 0 ? (
        <ul className="space-y-2 border-l-2 border-border pl-3">
          {order.refunds.map((refund) => (
            <RefundLine key={refund.id} refund={refund} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function AdminOrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [status, setStatus] = useState<AdminOrderStatus | 'ALL'>('PAID');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState<AdminOrder | null>(null);
  const ordersQuery = useAdminOrders(
    { status: status === 'ALL' ? undefined : status, search: search || undefined, page, pageSize: PAGE_SIZE },
    isAdmin,
  );

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading orders...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Permission denied</p>
              <p className="text-sm text-muted-foreground">Orders are only available to administrators.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = ordersQuery.data;
  const orders = data?.items ?? [];
  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-3">
        <Link href="/app/admin">
          <Button variant="ghost" className="-ml-3 w-fit">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Admin Ops
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Orders</h1>
          <p className="max-w-3xl text-muted-foreground">
            Every purchase, newest first, and its refunds. Refund from here rather than the Razorpay dashboard:
            here you choose whether the buyer keeps the markets. A refund made in the dashboard takes back the
            unused markets it paid for, and is marked as such below.
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchInput.trim());
          setPage(1);
        }}
      >
        <div className="space-y-2 sm:w-48">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as AdminOrderStatus | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All orders</SelectItem>
              {(Object.keys(STATUS_LABELS) as AdminOrderStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="orders-search">Buyer email, order or payment id</Label>
          <Input
            id="orders-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="name@company.com or pay_..."
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {ordersQuery.isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">Loading orders...</CardContent>
        </Card>
      ) : ordersQuery.error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            {errorText(ordersQuery.error, 'Failed to load orders.')}
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">No orders match.</CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} onRefund={setRefunding} />
            ))}
          </CardContent>
        </Card>
      )}

      {data && data.total > data.pageSize ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {lastPage} · {data.total} orders
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

      {refunding ? <RefundDialog key={refunding.id} order={refunding} onClose={() => setRefunding(null)} /> : null}
    </div>
  );
}
