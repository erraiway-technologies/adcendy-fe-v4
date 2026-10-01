'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, ChevronLeft, Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useCoupons, useCreateCoupon, useUpdateCoupon } from '@/hooks/useCoupons';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatOpsDateTime } from '@/shared/components/ops/opsUtils';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import {
  couponState,
  couponUsageLabel,
  isoToLocalDateTime,
  localDateTimeToIso,
  majorToMinorUnits,
  type AdminCoupon,
  type CouponDiscountType,
  type CouponState,
  type CreateCouponPayload,
} from '@/shared/types/coupons';

const STATE_LABELS: Record<CouponState, string> = {
  active: 'Active',
  off: 'Switched off',
  scheduled: 'Not started',
  expired: 'Expired',
  'used-up': 'Fully used',
};

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** An optional whole number of at least 1: '' is no limit, NaN is invalid. */
function readLimit(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : Number.NaN;
}

function discountLabel(coupon: AdminCoupon): string {
  if (coupon.discountType === 'PERCENT') {
    return `${coupon.percentOff ?? 0}% off`;
  }
  return coupon.amountOffMinor !== null && coupon.currency
    ? `${formatMinorAmount({ amountMinor: coupon.amountOffMinor, currency: coupon.currency })} off`
    : 'Fixed amount off';
}

function windowLabel(coupon: AdminCoupon): string {
  if (!coupon.startsAt && !coupon.endsAt) return 'No dates';
  const from = coupon.startsAt ? `from ${formatOpsDateTime(coupon.startsAt)}` : '';
  const until = coupon.endsAt ? `until ${formatOpsDateTime(coupon.endsAt)}` : '';
  return [from, until].filter(Boolean).join(' ');
}

type CreateForm = {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  percentOff: string;
  amountOff: string;
  currency: string;
  maxRedemptions: string;
  maxRedemptionsPerUser: string;
  startsAt: string;
  endsAt: string;
};

const EMPTY_FORM: CreateForm = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  percentOff: '',
  amountOff: '',
  currency: 'INR',
  maxRedemptions: '',
  maxRedemptionsPerUser: '1',
  startsAt: '',
  endsAt: '',
};

/** The payload, or what is wrong with the form. Checked again by the server. */
function buildCreatePayload(form: CreateForm): CreateCouponPayload | string {
  const code = form.code.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
    return 'The code must be 3-32 letters, digits, "-" or "_".';
  }
  const maxRedemptions = readLimit(form.maxRedemptions);
  const maxRedemptionsPerUser = readLimit(form.maxRedemptionsPerUser);
  if (Number.isNaN(maxRedemptions) || Number.isNaN(maxRedemptionsPerUser) || maxRedemptionsPerUser === null) {
    return 'Use limits must be whole numbers of at least 1. Leave total uses empty for no limit.';
  }
  const payload: CreateCouponPayload = {
    code,
    description: form.description.trim() || null,
    discountType: form.discountType,
    maxRedemptions,
    maxRedemptionsPerUser,
    startsAt: localDateTimeToIso(form.startsAt),
    endsAt: localDateTimeToIso(form.endsAt),
  };
  if (form.discountType === 'PERCENT') {
    const percentOff = Number(form.percentOff);
    if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
      return 'The percentage must be a whole number from 1 to 100.';
    }
    return { ...payload, percentOff };
  }
  const amountOffMinor = majorToMinorUnits(form.amountOff);
  if (amountOffMinor === null) {
    return 'Enter the amount off, for example 2000 or 19.99.';
  }
  if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
    return 'Enter a three-letter currency, such as INR or USD.';
  }
  return { ...payload, amountOffMinor, currency: form.currency.trim().toUpperCase() };
}

function NewCouponCard({ onDone }: { onDone: () => void }) {
  const createCoupon = useCreateCoupon();
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [problem, setProblem] = useState<string | null>(null);
  const set = (field: keyof CreateForm) => (value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const submit = () => {
    const payload = buildCreatePayload(form);
    if (typeof payload === 'string') {
      setProblem(payload);
      return;
    }
    setProblem(null);
    createCoupon.mutate(payload, {
      onSuccess: () => {
        setForm(EMPTY_FORM);
        onDone();
      },
      onError: (error) => setProblem(errorText(error, 'Could not create the coupon.')),
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>New coupon</CardTitle>
        <CardDescription>
          The code and the discount cannot be changed once created; to offer a different discount, create a new
          coupon and switch the old one off.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Code</Label>
            <Input
              id="coupon-code"
              value={form.code}
              onChange={(event) => set('code')(event.target.value.toUpperCase())}
              placeholder="LAUNCH20"
              maxLength={32}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-description">Note for admins (optional)</Label>
            <Input
              id="coupon-description"
              value={form.description}
              onChange={(event) => set('description')(event.target.value)}
              placeholder="Who it is for, and why"
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label>Discount</Label>
            <Select
              value={form.discountType}
              onValueChange={(value) => set('discountType')(value as CouponDiscountType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percentage off</SelectItem>
                <SelectItem value="FIXED_AMOUNT">Fixed amount off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.discountType === 'PERCENT' ? (
            <div className="space-y-2">
              <Label htmlFor="coupon-percent">Percentage off</Label>
              <Input
                id="coupon-percent"
                inputMode="numeric"
                value={form.percentOff}
                onChange={(event) => set('percentOff')(event.target.value)}
                placeholder="20"
              />
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-amount">Amount off</Label>
                <Input
                  id="coupon-amount"
                  inputMode="decimal"
                  value={form.amountOff}
                  onChange={(event) => set('amountOff')(event.target.value)}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-currency">Currency</Label>
                <Input
                  id="coupon-currency"
                  value={form.currency}
                  onChange={(event) => set('currency')(event.target.value.toUpperCase())}
                  maxLength={3}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="coupon-max">Total uses (empty for no limit)</Label>
            <Input
              id="coupon-max"
              inputMode="numeric"
              value={form.maxRedemptions}
              onChange={(event) => set('maxRedemptions')(event.target.value)}
              placeholder="No limit"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-per-user">Uses per customer</Label>
            <Input
              id="coupon-per-user"
              inputMode="numeric"
              value={form.maxRedemptionsPerUser}
              onChange={(event) => set('maxRedemptionsPerUser')(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-starts">Valid from (optional)</Label>
            <Input
              id="coupon-starts"
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => set('startsAt')(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-ends">Valid until (optional)</Label>
            <Input
              id="coupon-ends"
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => set('endsAt')(event.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          A fixed amount applies only to prices in its currency. Coupons never apply to pilot pricing, and the
          price after a coupon must stay at least 1.00, so a 100% coupon cannot be used.
        </p>
        {problem ? <p className="text-sm text-destructive">{problem}</p> : null}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={createCoupon.isPending}>
            {createCoupon.isPending ? 'Creating…' : 'Create coupon'}
          </Button>
          <Button variant="ghost" onClick={onDone} disabled={createCoupon.isPending}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditCouponDialog({ coupon, onClose }: { coupon: AdminCoupon; onClose: () => void }) {
  const updateCoupon = useUpdateCoupon();
  const [description, setDescription] = useState(coupon.description ?? '');
  const [maxRedemptions, setMaxRedemptions] = useState(coupon.maxRedemptions?.toString() ?? '');
  const [perUser, setPerUser] = useState(coupon.maxRedemptionsPerUser.toString());
  const [startsAt, setStartsAt] = useState(isoToLocalDateTime(coupon.startsAt));
  const [endsAt, setEndsAt] = useState(isoToLocalDateTime(coupon.endsAt));
  const [problem, setProblem] = useState<string | null>(null);

  const save = () => {
    const total = readLimit(maxRedemptions);
    const mine = readLimit(perUser);
    if (Number.isNaN(total) || Number.isNaN(mine) || mine === null) {
      setProblem('Use limits must be whole numbers of at least 1. Leave total uses empty for no limit.');
      return;
    }
    setProblem(null);
    updateCoupon.mutate(
      {
        couponId: coupon.id,
        payload: {
          description: description.trim() || null,
          maxRedemptions: total,
          maxRedemptionsPerUser: mine,
          startsAt: localDateTimeToIso(startsAt),
          endsAt: localDateTimeToIso(endsAt),
        },
      },
      {
        onSuccess: onClose,
        onError: (error) => setProblem(errorText(error, 'Could not save the coupon.')),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {coupon.code}</DialogTitle>
          <DialogDescription>
            {discountLabel(coupon)} · {couponUsageLabel(coupon)}. Lowering the limit below what is already used
            stops new uses; orders already paid are not affected.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-description">Note for admins</Label>
            <Input id="edit-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-max">Total uses (empty for no limit)</Label>
            <Input
              id="edit-max"
              inputMode="numeric"
              value={maxRedemptions}
              onChange={(event) => setMaxRedemptions(event.target.value)}
              placeholder="No limit"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-per-user">Uses per customer</Label>
            <Input id="edit-per-user" inputMode="numeric" value={perUser} onChange={(event) => setPerUser(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-starts">Valid from</Label>
            <Input id="edit-starts" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ends">Valid until</Label>
            <Input id="edit-ends" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          </div>
        </div>
        {problem ? <p className="text-sm text-destructive">{problem}</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={updateCoupon.isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={updateCoupon.isPending}>
            {updateCoupon.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CouponRow({ coupon, onEdit }: { coupon: AdminCoupon; onEdit: (coupon: AdminCoupon) => void }) {
  const updateCoupon = useUpdateCoupon();
  const state = couponState(coupon);
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-semibold">{coupon.code}</span>
          <Badge variant={state === 'active' ? 'default' : 'secondary'}>{STATE_LABELS[state]}</Badge>
          <span className="text-sm font-medium">{discountLabel(coupon)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {couponUsageLabel(coupon)} · {coupon.maxRedemptionsPerUser} per customer · {windowLabel(coupon)}
        </p>
        {coupon.description ? <p className="text-sm text-muted-foreground">{coupon.description}</p> : null}
        {updateCoupon.error ? (
          <p className="text-sm text-destructive">{errorText(updateCoupon.error, 'Could not change the coupon.')}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id={`coupon-active-${coupon.id}`}
            checked={coupon.isActive}
            disabled={updateCoupon.isPending}
            onCheckedChange={(isActive) => updateCoupon.mutate({ couponId: coupon.id, payload: { isActive } })}
          />
          <Label htmlFor={`coupon-active-${coupon.id}`}>{coupon.isActive ? 'On' : 'Off'}</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(coupon)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const couponsQuery = useCoupons(isAdmin);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading coupons...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Permission denied</p>
              <p className="text-sm text-muted-foreground">Coupons are only available to administrators.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupons = couponsQuery.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-3">
        <Link href="/app/admin">
          <Button variant="ghost" className="-ml-3 w-fit">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Admin Ops
          </Button>
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Coupons</h1>
            <p className="max-w-3xl text-muted-foreground">
              Codes customers enter at checkout. The server checks a coupon again at the moment the order is
              created, just before payment, so a coupon switched off, expired or used up here stops working at
              once. A use counts from the moment a customer starts paying; if they do not pay within 30 minutes,
              or the payment fails or is refunded, the use is given back.
            </p>
          </div>
          {!creating ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New coupon
            </Button>
          ) : null}
        </div>
      </div>

      {creating ? <NewCouponCard onDone={() => setCreating(false)} /> : null}

      {couponsQuery.isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">Loading coupons...</CardContent>
        </Card>
      ) : couponsQuery.error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            {errorText(couponsQuery.error, 'Failed to load coupons.')}
          </CardContent>
        </Card>
      ) : coupons.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">No coupons yet.</CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {coupons.map((coupon) => (
              <CouponRow key={coupon.id} coupon={coupon} onEdit={setEditing} />
            ))}
          </CardContent>
        </Card>
      )}

      {editing ? <EditCouponDialog key={editing.id} coupon={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
