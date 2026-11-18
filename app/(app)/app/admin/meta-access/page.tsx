'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { metaAccessApi } from '@/shared/api/real/metaAccess.real';
import { describeMetaAccess, type MetaTokenHealth } from '@/shared/components/ops/metaAccess';

const TONE_CLASS = {
  ok: 'border-emerald-500/40 bg-emerald-500/5',
  warn: 'border-amber-500/40 bg-amber-500/5',
  bad: 'border-destructive/40 bg-destructive/5',
  off: 'border-border bg-card',
} as const;

/**
 * Meta access (backend V3-401): the token the competitor Meta ads research
 * reads. Shows whether it works and when it expires; a new token is pasted
 * here, checked with Meta before it replaces the stored one, and stored
 * encrypted for every server process. The token is never shown again.
 */
export default function AdminMetaAccessPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const statusQuery = useQuery({
    queryKey: ['admin', 'meta-access', 'status'],
    queryFn: () => metaAccessApi.status(),
    enabled: isAdmin,
  });
  const health: MetaTokenHealth | null = statusQuery.data ?? null;
  const loading = statusQuery.isFetching;
  const loadError = statusQuery.error
    ? statusQuery.error instanceof Error
      ? statusQuery.error.message
      : 'The status could not be read.'
    : statusQuery.isSuccess && !statusQuery.data
      ? 'The status could not be read.'
      : null;
  const load = () => statusQuery.refetch();
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    const pasted = token.trim();
    if (!pasted) {
      setResult({ ok: false, text: 'Paste a token first.' });
      return;
    }
    setSaving(true);
    setResult(null);
    try {
      await metaAccessApi.save(pasted);
      setToken('');
      const check = await metaAccessApi.verify();
      setResult({
        ok: check.ok,
        text: check.ok
          ? `Saved. ${check.detail}`
          : `Saved, but the Ad Library check failed: ${check.detail} The token may lack Ad Library access.`,
      });
      await load();
    } catch (error) {
      setResult({
        ok: false,
        text: `Not saved: ${error instanceof Error ? error.message : 'Meta refused the token.'} The current token was kept.`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">This page is for admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const view = health ? describeMetaAccess(health) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-space-grotesk text-3xl font-bold text-foreground">Meta access</h1>
        <p className="text-sm text-muted-foreground">
          The token the competitor research uses to read the Meta Ad Library.
        </p>
      </div>

      <Card className={view ? TONE_CLASS[view.tone] : 'border-border bg-card'}>
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            {view?.tone === 'ok' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {view?.headline ?? (loading ? 'Checking…' : 'Status unknown')}
              </p>
              <p className="text-sm text-muted-foreground">{view?.detail ?? loadError ?? ''}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Check again
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Save a new token
          </CardTitle>
          <CardDescription>
            Best: a System User token from Meta Business Manager, with Ad Library access - it does not expire. Meta is
            asked about the token before it replaces the current one; a token it refuses is not saved. Once saved, the
            token is stored encrypted and never shown again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="meta-access-token">Access token</Label>
            <Input
              id="meta-access-token"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              disabled={saving}
              placeholder="Paste the token"
              onChange={(event) => setToken(event.target.value)}
            />
          </div>
          {result ? (
            <p className={result.ok ? 'text-sm text-emerald-400' : 'text-sm text-destructive'}>{result.text}</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="button" disabled={saving || !token.trim()} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save and check'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
