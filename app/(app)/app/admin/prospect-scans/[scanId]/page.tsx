'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, Copy, ExternalLink, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import {
  useAddProspectFact,
  useMarkOutreachSent,
  useProspectScan,
  useRecheckProspect,
  useRescanProspect,
  useUpdateProspectInputs,
} from '@/hooks/useProspectScans';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { formatOpsDateTime } from '@/shared/components/ops/opsUtils';
import {
  OPERATOR_FACT_FIELDS,
  PROSPECT_FACT_KIND_LABELS,
  PROSPECT_INPUT_KIND_LABELS,
  PROSPECT_STATUS_LABELS,
  buildOperatorValues,
  describeFactFigures,
  readableReason,
  type ProspectBusinessType,
  type ProspectInputNeeded,
  type ProspectOperatorFactKind,
  type ProspectScanDetail,
} from '@/shared/types/prospectScans';

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const UNSET = '__unset__';

/** A hand reading of one kind: its figures, the page it was read on, and when. */
function HandReadingDialog({
  scan,
  kind,
  suggestedLink,
  onClose,
}: {
  scan: ProspectScanDetail;
  kind: ProspectOperatorFactKind;
  suggestedLink: string | null;
  onClose: () => void;
}) {
  const addFact = useAddProspectFact(scan.id);
  const fields = OPERATOR_FACT_FIELDS[kind];
  const [form, setForm] = useState<Record<string, string>>({});
  const [verifyUrl, setVerifyUrl] = useState(suggestedLink ?? '');
  const [checkedOn, setCheckedOn] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const set = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const save = () => {
    const { values, problems: found } = buildOperatorValues(kind, form);
    const linkProblems = verifyUrl.trim() ? [] : ['The link the prospect would open is required.'];
    if (!values || linkProblems.length) {
      setProblems([...found, ...linkProblems]);
      return;
    }
    setProblems([]);
    addFact.mutate(
      { kind, values, verifyUrl: verifyUrl.trim(), ...(checkedOn ? { checkedOn } : {}) },
      {
        onSuccess: onClose,
        onError: (error) => setProblems([errorText(error, 'The reading was not saved.')]),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{PROSPECT_FACT_KIND_LABELS[kind]}, read by hand</DialogTitle>
          <DialogDescription>
            {scan.targetName ?? scan.targetDomain} against {scan.competitorName}, in {scan.country}. Enter exactly
            what the page shows; it is checked like any other reading before it can reach the email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label htmlFor={`fact-${field.name}`}>{field.label}</Label>
              {field.type === 'boolean' ? (
                <Select
                  value={form[field.name] || UNSET}
                  onValueChange={(value) => set(field.name, value === UNSET ? '' : value)}
                >
                  <SelectTrigger id={`fact-${field.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET}>{field.nullable ? 'Could not tell' : 'No'}</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`fact-${field.name}`}
                  type={field.type === 'date' ? 'date' : 'text'}
                  inputMode={field.type === 'count' || field.type === 'position' || field.type === 'money' ? 'decimal' : undefined}
                  value={form[field.name] ?? ''}
                  onChange={(event) => set(field.name, event.target.value)}
                />
              )}
              {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="fact-link">Link the prospect would open to check it</Label>
            <Input id="fact-link" value={verifyUrl} onChange={(event) => setVerifyUrl(event.target.value)} />
            {kind === 'google_ads' || kind === 'meta_ads' ? (
              <p className="text-xs text-muted-foreground">Must be filtered to {scan.country}.</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="fact-checked-on">Read on (leave empty for today)</Label>
            <Input id="fact-checked-on" type="date" value={checkedOn} onChange={(event) => setCheckedOn(event.target.value)} />
          </div>
          {problems.map((problem) => (
            <p key={problem} className="text-sm text-destructive">
              {problem}
            </p>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={addFact.isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={addFact.isPending}>
            {addFact.isPending ? 'Saving…' : 'Save reading'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The scan's inputs, correctable after submitting. */
function InputsDialog({ scan, onClose }: { scan: ProspectScanDetail; onClose: () => void }) {
  const update = useUpdateProspectInputs(scan.id);
  const rescan = useRescanProspect(scan.id);
  const { toast } = useToast();
  const [form, setForm] = useState({
    targetName: scan.targetName ?? '',
    competitorName: scan.competitorName,
    contactFirstName: scan.contactFirstName ?? '',
    hiringSignal: scan.hiringSignal,
    hiringSignalUrl: scan.hiringSignalUrl ?? '',
    businessType: scan.businessType,
    categoryTerm: scan.operatorCategoryTerm ?? '',
  });
  const [problem, setProblem] = useState<string | null>(null);
  const set = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const save = () =>
    update.mutate(form, {
      onSuccess: (result) => {
        if (result.rescanNeeded) {
          rescan.mutate(undefined, {
            onSuccess: () => toast({ title: 'Saved and re-scanning', description: 'The new search term is read on this re-scan.' }),
          });
        } else {
          toast({ title: 'Saved', description: 'The email reflects the change.' });
        }
        onClose();
      },
      onError: (error) => setProblem(errorText(error, 'Not saved.')),
    });

  const text = (name: keyof typeof form, label: string, help?: string) => (
    <div className="space-y-1">
      <Label htmlFor={`input-${name}`}>{label}</Label>
      <Input id={`input-${name}`} value={form[name]} onChange={(event) => set(name, event.target.value)} />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prospect details</DialogTitle>
          <DialogDescription>Names and the hiring signal change the email at once; a new search term needs a re-scan, which starts when you save.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {text('targetName', "Prospect's brand name")}
          {text('competitorName', 'Competitor, as the prospect knows it')}
          {text('contactFirstName', 'First name of the person you email', 'Empty: "Hi there".')}
          {text('hiringSignal', 'Why now', 'Written to follow "I saw", e.g. "you\'re hiring a Head of Growth".')}
          {text('hiringSignalUrl', 'Where the hiring signal is')}
          <div className="space-y-1">
            <Label>Business type</Label>
            <Select value={form.businessType} onValueChange={(value) => set('businessType', value as ProspectBusinessType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="sole_trader">Sole trader</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {text('categoryTerm', 'Search term', "What the prospect's customers search for. Empty: the scan picks terms the competitor leads on.")}
          {problem ? <p className="text-sm text-destructive">{problem}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkSentDialog({ scan, onClose }: { scan: ProspectScanDetail; onClose: () => void }) {
  const markSent = useMarkOutreachSent(scan.id);
  const alreadySent = scan.outreaches.find((outreach) => outreach.status === 'SENT');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record this email as sent</DialogTitle>
          <DialogDescription>
            Send it from your own mailbox first. This saves the exact text, the facts it rested on, and who sent
            it to whom.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {alreadySent ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              Already emailed {formatOpsDateTime(alreadySent.sentAt)}
              {alreadySent.recipientEmail ? ` to ${alreadySent.recipientEmail}` : ''}. Saving records a second email.
            </p>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="sent-to">Sent to</Label>
            <Input
              id="sent-to"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </div>
          {problem ? <p className="text-sm text-destructive">{problem}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={markSent.isPending}>
            Cancel
          </Button>
          <Button
            disabled={markSent.isPending}
            onClick={() =>
              markSent.mutate(
                { ...(recipientEmail.trim() ? { recipientEmail: recipientEmail.trim() } : {}), ...(alreadySent ? { allowRepeat: true } : {}) },
                { onSuccess: onClose, onError: (error) => setProblem(errorText(error, 'Not recorded.')) },
              )
            }
          >
            {markSent.isPending ? 'Saving…' : alreadySent ? 'Record a second email' : 'Record as sent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NeedRow({ need, onEnter }: { need: ProspectInputNeeded; onEnter: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border p-4 last:border-b-0 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{PROSPECT_INPUT_KIND_LABELS[need.kind]}</span>
          <Badge variant={need.priority === 'recommended' ? 'default' : 'outline'}>
            {need.priority === 'recommended' ? 'Recommended' : 'Optional'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{need.why}</p>
        <p className="text-sm">{need.howTo}</p>
        {need.checkLink ? (
          <a href={need.checkLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline">
            Open where to read it <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onEnter}>
        Enter
      </Button>
    </div>
  );
}

export default function ProspectScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const scanId = params?.scanId as string;
  const isAdmin = user?.role === 'ADMIN';
  const scanQuery = useProspectScan(scanId, isAdmin);
  const rescan = useRescanProspect(scanId);
  const recheck = useRecheckProspect(scanId);
  const [entering, setEntering] = useState<{ kind: ProspectOperatorFactKind; link: string | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading prospect...</div>;
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

  if (scanQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading prospect...</div>;
  }

  if (scanQuery.error || !scanQuery.data) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-8 text-sm text-destructive">
            {errorText(scanQuery.error, 'Failed to load the prospect.')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const scan = scanQuery.data;
  const email = scan.outreachEmail;
  const inProgress = ['PENDING', 'SCANNING', 'RECHECK_PENDING'].includes(scan.status);
  const recommended = scan.inputsNeeded.filter((need) => need.priority === 'recommended');
  const optional = scan.inputsNeeded.filter((need) => need.priority === 'optional');

  const copyEmail = async () => {
    if (!email?.subject || !email.body) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
      toast({ title: 'Email copied', description: 'Paste it into your mail, then record the send here.' });
    } catch {
      toast({ title: 'Not copied', description: 'Select the text and copy it instead.', variant: 'destructive' });
    }
  };

  const enter = (need: ProspectInputNeeded) =>
    need.kind === 'category_term' ? setEditing(true) : setEntering({ kind: need.kind, link: need.checkLink });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-3">
        <Button variant="ghost" className="-ml-3 w-fit" onClick={() => router.push('/admin/prospect-scans')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Prospect scans
        </Button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="font-space-grotesk text-3xl font-bold text-foreground">
              {scan.targetName ?? scan.targetDomain} vs {scan.competitorName}
            </h1>
            <p className="text-muted-foreground">
              {scan.targetDomain} · {scan.competitorDomain} · {scan.country} · spent ${scan.costUsd.toFixed(2)}
              {scan.scannedAt ? ` · scanned ${formatOpsDateTime(scan.scannedAt)}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={scan.status === 'READY' ? 'default' : scan.status === 'HELD' || scan.status === 'FAILED' ? 'destructive' : 'secondary'}>
              {PROSPECT_STATUS_LABELS[scan.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit details
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={inProgress || recheck.isPending || !email?.basedOn || email.basedOn.source !== 'api'}
              onClick={() =>
                recheck.mutate(undefined, {
                  onError: (error) => toast({ title: 'Not re-checked', description: errorText(error, ''), variant: 'destructive' }),
                })
              }
            >
              Re-check fact
            </Button>
            <Button variant="outline" size="sm" disabled={inProgress || rescan.isPending} onClick={() => rescan.mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-scan
            </Button>
          </div>
        </div>
        {scan.holdReason ? <p className="text-sm text-destructive">Held: {readableReason(scan.holdReason)}</p> : null}
        {inProgress ? <p className="text-sm text-muted-foreground">The worker is on it; this page refreshes itself.</p> : null}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Outreach email</CardTitle>
          <CardDescription>
            {email?.status === 'drafted'
              ? email.isFallback
                ? 'Neutral: no checked fact yet. Add a reading below to give it one.'
                : `Built on a checked fact${email.wordsAboveSignature ? `, ${email.wordsAboveSignature} words above the signature` : ''}.`
              : `Not drafted: ${readableReason(email?.notSendableReason) || 'not scanned yet'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email?.subject && email.body ? (
            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">Subject: {email.subject}</p>
              <pre className="whitespace-pre-wrap font-sans text-sm">{email.body}</pre>
            </div>
          ) : null}
          {email?.basedOn?.checkLink ? (
            <a href={email.basedOn.checkLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline">
              Check the fact yourself before sending <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {email && !email.sendable && email.status === 'drafted' ? (
            <p className="text-sm text-destructive">Not sendable yet: {readableReason(email.notSendableReason)}.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyEmail} disabled={!email?.body}>
              <Copy className="mr-2 h-4 w-4" />
              Copy email
            </Button>
            <Button onClick={() => setMarkingSent(true)} disabled={!email?.sendable}>
              <Send className="mr-2 h-4 w-4" />
              Record as sent
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Needs your input</CardTitle>
          <CardDescription>
            What the scan could not read, or read but cannot print. Recommended items can give the email a fact.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recommended.length === 0 && optional.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing: every check was settled.</p>
          ) : (
            [...recommended, ...optional].map((need) => (
              <NeedRow key={need.kind} need={need} onEnter={() => enter(need)} />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Checks</CardTitle>
          <CardDescription>Every reading, automated or yours, with what it found and where to check it.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {scan.facts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No checks yet.</p>
          ) : (
            scan.facts.map((fact) => (
              <div key={fact.id} className="space-y-1 border-b border-border p-4 last:border-b-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{PROSPECT_FACT_KIND_LABELS[fact.kind]}</span>
                  <Badge variant={fact.state === 'gap' ? 'default' : fact.state === 'unknown' ? 'outline' : 'secondary'}>
                    {fact.state === 'gap' ? 'Competitor ahead' : fact.state === 'no_gap' ? 'No gap' : "Couldn't tell"}
                  </Badge>
                  <Badge variant="outline">{fact.source === 'operator' ? 'Yours' : 'Automated'}</Badge>
                  {scan.outreachEmail?.basedOn?.factId === fact.id ? <Badge>In the email</Badge> : null}
                </div>
                <p className="text-sm">{describeFactFigures(fact) || readableReason(fact.reason)}</p>
                <p className="text-xs text-muted-foreground">
                  {readableReason(fact.reason)} · {formatOpsDateTime(fact.capturedAt)}
                  {fact.verifyUrl ? (
                    <>
                      {' · '}
                      <a href={fact.verifyUrl} target="_blank" rel="noreferrer" className="underline">
                        check link
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Outreach history</CardTitle>
          <CardDescription>Every draft as it read, and every send you recorded.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {scan.outreaches.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No drafts saved yet.</p>
          ) : (
            scan.outreaches.map((outreach) => (
              <details key={outreach.id} className="border-b border-border p-4 last:border-b-0">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                  <Badge variant={outreach.status === 'SENT' ? 'default' : 'secondary'}>
                    {outreach.status === 'SENT' ? 'Sent' : 'Draft'}
                  </Badge>
                  <span className="font-medium">{outreach.subject}</span>
                  <span className="text-muted-foreground">
                    {outreach.status === 'SENT'
                      ? `${formatOpsDateTime(outreach.sentAt)}${outreach.recipientEmail ? ` to ${outreach.recipientEmail}` : ''}`
                      : formatOpsDateTime(outreach.createdAt)}
                  </span>
                  {outreach.isFallback ? <Badge variant="outline">Neutral</Badge> : null}
                </summary>
                <Textarea readOnly value={outreach.body} className="mt-3 min-h-40 text-sm" />
              </details>
            ))
          )}
        </CardContent>
      </Card>

      {entering ? (
        <HandReadingDialog
          key={entering.kind}
          scan={scan}
          kind={entering.kind}
          suggestedLink={entering.link}
          onClose={() => setEntering(null)}
        />
      ) : null}
      {editing ? <InputsDialog scan={scan} onClose={() => setEditing(false)} /> : null}
      {markingSent ? <MarkSentDialog scan={scan} onClose={() => setMarkingSent(false)} /> : null}
    </div>
  );
}
