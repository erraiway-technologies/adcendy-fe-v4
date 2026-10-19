'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, Download, Send } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import {
  useProspectScanSpend,
  useProspectScanSummary,
  useProspectScans,
  useSubmitProspects,
} from '@/hooks/useProspectScans';
import { useToast } from '@/hooks/use-toast';
import { prospectScansRepository } from '@/shared/api/repositories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatOpsDateTime } from '@/shared/components/ops/opsUtils';
import { triggerBlobDownload } from '@/lib/download';
import {
  PROSPECT_PASTE_COLUMNS,
  PROSPECT_STATUS_LABELS,
  parseProspectRows,
  readableReason,
  type ProspectScanStatus,
} from '@/shared/types/prospectScans';

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const PASTE_EXAMPLE = `${PROSPECT_PASTE_COLUMNS.slice(0, 7).join('\t')}
pipandnut.com\tmeridianfoods.co.uk\tGB\tcompany\tyou're hiring a Head of Growth\tPip & Nut\tMeridian`;

function SubmitCard({ onSubmitted }: { onSubmitted: (batchId: string) => void }) {
  const submit = useSubmitProspects();
  const { toast } = useToast();
  const [pasted, setPasted] = useState('');
  const parsed = useMemo(() => (pasted.trim() ? parseProspectRows(pasted) : null), [pasted]);
  const canSubmit = Boolean(parsed && parsed.rows.length > 0 && parsed.rows.length <= 100);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Add prospects</CardTitle>
        <CardDescription>
          Paste rows from a spreadsheet with a header row. Required: <code>targetDomain</code>,{' '}
          <code>competitorDomain</code> (the competitor the prospect would name), <code>country</code>,{' '}
          <code>businessType</code> (company, sole_trader or partnership) and <code>hiringSignal</code>{' '}
          (written to follow &ldquo;I saw&rdquo;). Optional: targetName, competitorName, contactFirstName,
          hiringSignalUrl, categoryTerm. Up to 100 a batch; a prospect already scanned is not paid for again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
          placeholder={PASTE_EXAMPLE}
          className="min-h-36 font-mono text-xs"
        />
        {parsed ? (
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">{parsed.rows.length} prospects read.</p>
            {parsed.errors.map((error) => (
              <p key={error} className="text-destructive">
                {error}
              </p>
            ))}
          </div>
        ) : null}
        <Button
          disabled={!canSubmit || submit.isPending}
          onClick={() =>
            parsed &&
            submit.mutate(parsed.rows, {
              onSuccess: (result) => {
                toast({
                  title: 'Prospects queued',
                  description: `${result.created.length} new, ${result.existing.length} already scanned. The worker scans them one at a time.`,
                });
                setPasted('');
                onSubmitted(result.batchId);
              },
              onError: (error) =>
                toast({ title: 'Not queued', description: errorText(error, 'The batch was not accepted.'), variant: 'destructive' }),
            })
          }
        >
          <Send className="mr-2 h-4 w-4" />
          {submit.isPending ? 'Queuing…' : 'Scan these prospects'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function AdminProspectScansPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [batchId, setBatchId] = useState('');
  const [status, setStatus] = useState<ProspectScanStatus | 'ALL'>('ALL');
  const [exporting, setExporting] = useState(false);
  const query = { batchId: batchId || undefined, status: status === 'ALL' ? undefined : status };
  const scansQuery = useProspectScans(query, isAdmin);
  const summaryQuery = useProspectScanSummary(query.batchId, isAdmin);
  const spendQuery = useProspectScanSpend(isAdmin);

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading prospect scans...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Permission denied</p>
              <p className="text-sm text-muted-foreground">Prospect scans are only available to administrators.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = summaryQuery.data;
  const spend = spendQuery.data;
  const scans = scansQuery.data ?? [];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const csv = await prospectScansRepository.exportCsv(query.batchId);
      triggerBlobDownload(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        `prospect-outreach${query.batchId ? `-${query.batchId}` : ''}.csv`,
      );
    } catch (error) {
      toast({ title: 'Export failed', description: errorText(error, 'The export did not download.'), variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

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
          <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Prospect scans</h1>
          <p className="max-w-3xl text-muted-foreground">
            Each prospect is compared with the competitor you name, and gets an outreach email built only from
            checked facts, or a neutral one when there is none. Open a prospect to add what the scan could not
            read, copy its email, and record the send. Nothing is emailed from here.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Spent today"
          value={spend ? `$${spend.spentUsd.toFixed(2)}` : '—'}
          note={spend ? `of a $${spend.capUsd} daily cap (Settings)` : undefined}
        />
        <Stat
          label="Emails drafted"
          value={summary ? `${summary.emailsDrafted} of ${summary.total}` : '—'}
          note={query.batchId ? 'this batch' : 'all prospects'}
        />
        <Stat
          label="With a checked fact"
          value={summary ? String(summary.withFact) : '—'}
          note={summary ? `${summary.neutral} neutral` : undefined}
        />
        <Stat
          label="Fact rate"
          value={summary?.factRate !== null && summary?.factRate !== undefined ? `${Math.round(summary.factRate * 100)}%` : '—'}
          note="Share of emails carrying a checked fact"
        />
      </div>

      <SubmitCard
        onSubmitted={(id) => {
          setBatchId(id);
          setStatus('ALL');
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="prospect-batch">Batch</Label>
          <Input
            id="prospect-batch"
            value={batchId}
            onChange={(event) => setBatchId(event.target.value.trim())}
            placeholder="All batches (or paste a batch id)"
          />
        </div>
        <div className="space-y-2 sm:w-48">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as ProspectScanStatus | 'ALL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {(Object.keys(PROSPECT_STATUS_LABELS) as ProspectScanStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {PROSPECT_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export sendable emails'}
        </Button>
      </div>

      {scansQuery.isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">Loading prospects...</CardContent>
        </Card>
      ) : scansQuery.error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            {errorText(scansQuery.error, 'Failed to load prospects.')}
          </CardContent>
        </Card>
      ) : scans.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">No prospects yet. Paste some above.</CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {scans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => router.push(`/admin/prospect-scans/${scan.id}`)}
                className="block w-full space-y-1 border-b border-border p-4 text-left last:border-b-0 hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{scan.targetDomain}</span>
                  <span className="text-muted-foreground">vs {scan.competitorDomain}</span>
                  <Badge variant={scan.status === 'READY' ? 'default' : scan.status === 'FAILED' || scan.status === 'HELD' ? 'destructive' : 'secondary'}>
                    {PROSPECT_STATUS_LABELS[scan.status]}
                  </Badge>
                  {scan.status === 'READY' ? (
                    <Badge variant="outline">{scan.isFallback ? 'Neutral email' : 'Checked fact'}</Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{scan.country}</span>
                </div>
                <p className="text-sm">
                  {scan.observationLine ?? (scan.holdReason ? `Held: ${readableReason(scan.holdReason)}` : 'Not scanned yet')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scan.scannedAt ? `Scanned ${formatOpsDateTime(scan.scannedAt)}` : 'Waiting for the worker'}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
