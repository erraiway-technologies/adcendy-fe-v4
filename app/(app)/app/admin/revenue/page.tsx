'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronLeft, Download } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { billingReportsRepository } from '@/shared/api/repositories/billingReports.repo';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import {
  CHANNEL_LABELS,
  currentIndiaMonth,
  keptPercent,
  previousMonth,
  type GstTotals,
  type MoneyLine,
} from '@/shared/types/billingReports';

const money = (amountMinor: number, currency: string) => formatMinorAmount({ amountMinor, currency });

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function monthLabel(month: string): string {
  const [year, value] = month.split('-').map(Number);
  return new Date(Date.UTC(year, value - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** A table of money lines: the first column is whatever the lines are grouped by. */
function MoneyTable<T extends MoneyLine>({
  title,
  rows,
  label,
  detail,
  testId,
}: {
  title: string;
  rows: T[];
  label: (row: T) => React.ReactNode;
  detail?: (row: T) => React.ReactNode;
  testId: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nothing in this range.</p>
        ) : (
          <table className="w-full text-sm" data-testid={testId}>
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium" />
                <th className="px-4 py-2 text-right font-medium">Orders</th>
                <th className="px-4 py-2 text-right font-medium">Credits</th>
                <th className="px-4 py-2 text-right font-medium">Charged</th>
                <th className="px-4 py-2 text-right font-medium">of which GST</th>
                <th className="px-4 py-2 text-right font-medium">Refunded</th>
                <th className="px-4 py-2 text-right font-medium">Kept</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2">
                    <div className="font-medium">{label(row)}</div>
                    {detail ? <div className="text-xs text-muted-foreground">{detail(row)}</div> : null}
                  </td>
                  <td className="px-4 py-2 text-right">{row.orders}</td>
                  <td className="px-4 py-2 text-right">{row.credits}</td>
                  <td className="px-4 py-2 text-right">{money(row.grossMinor, row.currency)}</td>
                  <td className="px-4 py-2 text-right">{row.taxMinor ? money(row.taxMinor, row.currency) : '-'}</td>
                  <td className="px-4 py-2 text-right">
                    {row.refundedMinor ? money(-row.refundedMinor, row.currency) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{money(row.netMinor, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function GstLine({ label, totals }: { label: string; totals: GstTotals }) {
  const inr = (minor: number) => money(minor, 'INR');
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-4 py-2">{label}</td>
      <td className="px-4 py-2 text-right">{totals.count}</td>
      <td className="px-4 py-2 text-right">{inr(totals.taxableMinor)}</td>
      <td className="px-4 py-2 text-right">{inr(totals.cgstMinor)}</td>
      <td className="px-4 py-2 text-right">{inr(totals.sgstMinor)}</td>
      <td className="px-4 py-2 text-right">{inr(totals.igstMinor)}</td>
      <td className="px-4 py-2 text-right font-medium">{inr(totals.totalMinor)}</td>
    </tr>
  );
}

function GstSection() {
  const [month, setMonth] = useState(() => previousMonth(currentIndiaMonth()));
  const gst = useQuery({
    queryKey: ['billingReports', 'gst', month],
    queryFn: () => billingReportsRepository.gstMonth(month),
    enabled: /^\d{4}-\d{2}$/.test(month),
  });
  const download = useMutation({
    mutationFn: async () => {
      const { blob, fileName } = await billingReportsRepository.gstMonthCsv(month);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });
  const summary = gst.data?.summary;
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">GST register</CardTitle>
          <CardDescription>
            Every invoice and credit note issued in a month (by the date in India), grouped the way the monthly
            return asks. The CSV has one line per document with the buyer, GSTIN, place of supply and tax split.
          </CardDescription>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="gst-month">Month</Label>
            <Input id="gst-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          <Button type="button" variant="outline" disabled={download.isPending} onClick={() => download.mutate()}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto p-0 pb-4">
        {download.error ? (
          <p className="px-4 text-sm text-destructive">{errorText(download.error, 'The download failed.')}</p>
        ) : null}
        {gst.isLoading ? (
          <p className="px-4 text-sm text-muted-foreground">Loading…</p>
        ) : gst.error ? (
          <p className="px-4 text-sm text-destructive">{errorText(gst.error, 'Failed to load the register.')}</p>
        ) : summary ? (
          <>
            <table className="w-full text-sm" data-testid="gst-summary">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">India (INR)</th>
                  <th className="px-4 py-2 text-right font-medium">Documents</th>
                  <th className="px-4 py-2 text-right font-medium">Taxable</th>
                  <th className="px-4 py-2 text-right font-medium">CGST</th>
                  <th className="px-4 py-2 text-right font-medium">SGST</th>
                  <th className="px-4 py-2 text-right font-medium">IGST</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                <GstLine label="Invoices" totals={summary.invoices} />
                <GstLine label="Credit notes" totals={summary.creditNotes} />
                <GstLine label="Net to registered buyers (B2B, with GSTIN)" totals={summary.net.b2b} />
                <GstLine label="Net to unregistered buyers (B2C)" totals={summary.net.b2c} />
                {summary.b2cByState.map((state) => (
                  <GstLine key={state.stateCode} label={`  B2C · ${state.placeOfSupply}`} totals={state} />
                ))}
              </tbody>
            </table>
            <div className="px-4 text-sm text-muted-foreground">
              {summary.exports.length === 0
                ? 'No sales outside India this month.'
                : `Outside India (no GST): ${summary.exports
                    .map((item) => `${item.count} documents, ${money(item.taxableMinor, item.currency)} net`)
                    .join('; ')}.`}{' '}
              {summary.sacCodes.length > 0 ? `SAC: ${summary.sacCodes.join(', ')}.` : ''}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function AdminRevenuePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [to, setTo] = useState(() => currentIndiaMonth());
  const [from, setFrom] = useState(() => {
    let month = currentIndiaMonth();
    for (let i = 0; i < 11; i++) month = previousMonth(month);
    return month;
  });
  const valid = /^\d{4}-\d{2}$/.test(from) && /^\d{4}-\d{2}$/.test(to) && from <= to;
  const overview = useQuery({
    queryKey: ['billingReports', 'overview', from, to],
    queryFn: () => billingReportsRepository.overview({ from, to }),
    enabled: isAdmin && valid,
  });

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading revenue...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-lg font-semibold">Permission denied</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = overview.data;
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
          <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Revenue</h1>
          <p className="max-w-3xl text-muted-foreground">
            What was charged, refunded and kept, by month, market, client and how it was sold. Payments count in
            the month they were paid and refunds in the month they went through; currencies are never added
            together.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="revenue-from">From</Label>
          <Input id="revenue-from" type="month" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="revenue-to">To</Label>
          <Input id="revenue-to" type="month" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        {!valid ? <p className="text-sm text-destructive">Choose a start month before the end month.</p> : null}
      </div>

      {overview.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : overview.error ? (
        <p className="text-sm text-destructive">{errorText(overview.error, 'Failed to load revenue.')}</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="revenue-totals">
            {data.totals.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="p-5 text-sm text-muted-foreground">No payments in this range.</CardContent>
              </Card>
            ) : (
              data.totals.map((total) => {
                const kept = keptPercent(total);
                return (
                  <Card key={total.currency} className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Kept in {total.currency}</CardDescription>
                      <CardTitle className="text-2xl">{money(total.netMinor, total.currency)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Charged {money(total.grossMinor, total.currency)}
                        {total.taxMinor ? ` (GST ${money(total.taxMinor, total.currency)})` : ''}
                      </p>
                      <p>
                        Refunded {money(total.refundedMinor, total.currency)}
                        {kept !== null ? ` · ${kept}% kept` : ''}
                      </p>
                      <p>
                        {total.orders} orders · {total.credits} credits
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardDescription>Paying clients</CardDescription>
                <CardTitle className="text-2xl">{data.clientCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <MoneyTable
            title="By client"
            testId="revenue-by-client"
            rows={data.byClient}
            label={(row) => row.name || row.email}
            detail={(row) =>
              `${row.name ? `${row.email} · ` : ''}${row.countries.join(', ')}${
                row.lastPaidAt ? ` · last paid ${row.lastPaidAt.slice(0, 10)}` : ''
              }`
            }
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <MoneyTable title="By market" testId="revenue-by-market" rows={data.byCountry} label={(row) => row.country} />
            <MoneyTable
              title="By how it was sold"
              testId="revenue-by-channel"
              rows={data.byChannel}
              label={(row) => CHANNEL_LABELS[row.channel] ?? row.channel}
            />
          </div>
          <MoneyTable
            title="By month"
            testId="revenue-by-month"
            rows={data.byMonth}
            label={(row) => `${monthLabel(row.month)} · ${row.currency}`}
          />
        </>
      ) : null}

      <GstSection />
    </div>
  );
}
