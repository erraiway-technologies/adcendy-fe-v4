'use client';

import { useState } from 'react';
import { History, Lock, Pencil, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { formatOpsDateTime } from '@/shared/components/ops/opsUtils';
import {
  useRevertSystemSettingChange,
  useSystemSettingHistory,
  useUpdateSystemSetting,
} from '@/hooks/useSystemSettings';
import type { SettingChange, SystemSetting } from '@/shared/types/systemSettings';

const MIN_REASON_CHARS = 10;

/** Milliseconds read as seconds, minutes or hours; other units as given. */
export function formatSettingNumber(value: number, unit: string | null): string {
  if (unit === 'ms') {
    if (value >= 3_600_000 && value % 60_000 === 0) {
      const hours = value / 3_600_000;
      return `${hours.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    if (value >= 60_000 && value % 1_000 === 0) {
      const minutes = value / 60_000;
      return `${minutes.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    if (value >= 1_000) {
      const seconds = value / 1_000;
      return `${seconds.toLocaleString('en-US', { maximumFractionDigits: 3 })} ${seconds === 1 ? 'second' : 'seconds'}`;
    }
    return `${value.toLocaleString('en-US')} ms`;
  }
  const formatted = value.toLocaleString('en-US');
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatLeaf(value: unknown): string {
  if (value === null || value === undefined) {
    return 'not set';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('en-US');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => `${key} ${formatLeaf(child)}`)
      .join(' · ');
  }
  return String(value);
}

/** An object value as one line per top-level key, instead of raw JSON. */
export function structuredValueLines(value: unknown): Array<[string, string]> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, formatLeaf(child)]);
}

export function formatSettingValue(setting: Pick<SystemSetting, 'valueType' | 'unit'>, value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not set';
  }
  if (typeof value === 'boolean') {
    return value ? 'On' : 'Off';
  }
  if (typeof value === 'number') {
    return formatSettingNumber(value, setting.unit);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? 'None' : value.map((item) => String(item)).join(', ');
  }
  return JSON.stringify(value);
}

export function describeBounds(setting: SystemSetting): string | null {
  const show = (value: number) => formatSettingNumber(value, setting.unit);
  const each = setting.valueType === 'object' ? 'Each value: ' : '';
  if (setting.allowed && setting.valueType === 'string') {
    return `One of: ${setting.allowed.join(', ')}`;
  }
  if (setting.min !== null && setting.max !== null) {
    // "1 to 32 calls", but "0 ms to 10 minutes" when the units differ.
    const low = show(setting.min);
    const high = show(setting.max);
    const lowUnit = low.replace(/^[\d.,]+ ?/, '');
    const range =
      lowUnit && high.endsWith(` ${lowUnit}`) && setting.unit !== 'ms'
        ? `${setting.min.toLocaleString('en-US')} to ${high}`
        : `${low} to ${high}`;
    return `${each || 'Allowed: '}${range}`;
  }
  if (setting.min !== null) {
    return `${each}At least ${show(setting.min)}`;
  }
  if (setting.max !== null) {
    return `${each}At most ${show(setting.max)}`;
  }
  return null;
}

function ValueDisplay({ setting, value }: { setting: SystemSetting; value: unknown }) {
  const lines = setting.valueType === 'object' ? structuredValueLines(value) : [];
  if (lines.length === 0) {
    return <>{formatSettingValue(setting, value)}</>;
  }
  return (
    <ul className="space-y-0.5">
      {lines.map(([key, text]) => (
        <li key={key}>
          <span className="font-mono text-xs text-muted-foreground">{key}</span>{' '}
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function initialDraft(setting: SystemSetting): string {
  if (setting.valueType === 'array' || setting.valueType === 'object') {
    return JSON.stringify(setting.value ?? setting.defaultValue, null, 2);
  }
  if (setting.value === null || setting.value === undefined) {
    return '';
  }
  return String(setting.value);
}

/** Turns the editor's text into the value the Backend expects, or explains why it can't. */
function parseDraft(setting: SystemSetting, draft: string): { value: unknown } | { error: string } {
  switch (setting.valueType) {
    case 'number': {
      const trimmed = draft.trim();
      const value = Number(trimmed);
      if (trimmed === '' || !Number.isFinite(value)) {
        return { error: 'Enter a number.' };
      }
      return { value };
    }
    case 'boolean':
      return { value: draft === 'true' };
    case 'array':
    case 'object': {
      try {
        return { value: JSON.parse(draft) as unknown };
      } catch {
        return { error: 'This must be valid JSON, in the same shape as the current value.' };
      }
    }
    default:
      return draft.trim() ? { value: draft.trim() } : { error: 'Enter a value.' };
  }
}

function errorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }
  return error instanceof Error ? error.message : 'The change could not be saved.';
}

function ChangeLine({ setting, change }: { setting: SystemSetting; change: SettingChange }) {
  return (
    <span>
      {formatSettingValue(setting, change.previousValue)} → {formatSettingValue(setting, change.newValue)}
      {change.changeKind === 'revert' ? ' (undo)' : ''}
    </span>
  );
}

function SettingHistory({ setting }: { setting: SystemSetting }) {
  const historyQuery = useSystemSettingHistory(setting.key);
  const revert = useRevertSystemSettingChange();
  const [undoing, setUndoing] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (historyQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }
  const changes = historyQuery.data ?? [];
  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground">Never changed from this screen.</p>;
  }

  return (
    <ul className="space-y-3">
      {changes.map((change) => (
        <li key={change.id} className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-foreground">
                <ChangeLine setting={setting} change={change} />
              </p>
              <p className="text-muted-foreground">“{change.reason}”</p>
              <p className="text-xs text-muted-foreground">
                {change.changedBy ?? 'Unknown user'} · {formatOpsDateTime(change.changedAt)}
              </p>
            </div>
            {setting.editable && undoing !== change.id ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUndoing(change.id);
                  setReason('');
                  revert.reset();
                }}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Undo
              </Button>
            ) : null}
          </div>
          {undoing === change.id ? (
            <div className="mt-3 space-y-2">
              <Label htmlFor={`undo-${change.id}`}>
                Why undo this? Puts back {formatSettingValue(setting, change.previousValue)}.
              </Label>
              <Textarea
                id={`undo-${change.id}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
              />
              {errorMessage(revert.error) ? (
                <p className="text-sm text-destructive">{errorMessage(revert.error)}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={reason.trim().length < MIN_REASON_CHARS || revert.isPending}
                  onClick={() =>
                    revert.mutate(
                      { changeId: change.id, reason },
                      { onSuccess: () => setUndoing(null) },
                    )
                  }
                >
                  {revert.isPending ? 'Undoing…' : 'Undo change'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setUndoing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SystemSettingRow({ setting }: { setting: SystemSetting }) {
  const update = useUpdateSystemSetting();
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [draft, setDraft] = useState(() => initialDraft(setting));
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const bounds = describeBounds(setting);
  const isStructured = setting.valueType === 'array' || setting.valueType === 'object';
  const draftId = `setting-${setting.key}`;

  const startEditing = () => {
    setDraft(initialDraft(setting));
    setReason('');
    setLocalError(null);
    update.reset();
    setEditing(true);
  };

  const save = () => {
    const parsed = parseDraft(setting, draft);
    if ('error' in parsed) {
      setLocalError(parsed.error);
      return;
    }
    setLocalError(null);
    update.mutate(
      { key: setting.key, value: parsed.value, reason },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <article className="space-y-3 border-t border-border p-4 first:border-t-0 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold text-foreground">{setting.label}</h3>
          <p className="break-all font-mono text-xs text-muted-foreground">{setting.key}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!setting.editable ? (
            <Badge variant="secondary">
              <Lock className="mr-1 h-3 w-3" />
              Locked
            </Badge>
          ) : null}
          {!setting.isDefault ? <Badge variant="outline">Changed from default</Badge> : null}
          <Badge variant="outline">{setting.appliesWhen === 'live' ? 'Applies within a minute' : 'New runs only'}</Badge>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{setting.effect}</p>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Current</dt>
        <dd className="break-words font-medium text-foreground">
          <ValueDisplay setting={setting} value={setting.value} />
        </dd>
        {!setting.isDefault ? (
          <>
            <dt className="text-muted-foreground">Default</dt>
            <dd className="break-words text-muted-foreground">
              <ValueDisplay setting={setting} value={setting.defaultValue} />
            </dd>
          </>
        ) : null}
        {bounds ? (
          <>
            <dt className="text-muted-foreground">Limits</dt>
            <dd className="text-muted-foreground">{bounds}</dd>
          </>
        ) : null}
        {setting.lastChange ? (
          <>
            <dt className="text-muted-foreground">Last change</dt>
            <dd className="text-muted-foreground">
              {setting.lastChange.changedBy ?? 'Unknown user'}, {formatOpsDateTime(setting.lastChange.changedAt)}: “
              {setting.lastChange.reason}”
            </dd>
          </>
        ) : null}
      </dl>

      {!setting.editable && setting.lockedReason ? (
        <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{setting.lockedReason}</p>
      ) : null}

      {editing ? (
        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3 sm:p-4">
          <div className="space-y-2">
            <Label htmlFor={draftId}>New value</Label>
            {setting.valueType === 'boolean' ? (
              <div className="flex items-center gap-3">
                <Switch
                  id={draftId}
                  checked={draft === 'true'}
                  onCheckedChange={(checked) => setDraft(checked ? 'true' : 'false')}
                />
                <span className="text-sm">{draft === 'true' ? 'On' : 'Off'}</span>
              </div>
            ) : setting.valueType === 'string' && setting.allowed ? (
              <Select value={draft} onValueChange={setDraft}>
                <SelectTrigger id={draftId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {setting.allowed.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : isStructured ? (
              <Textarea
                id={draftId}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={Math.min(14, Math.max(4, draft.split('\n').length))}
                className="font-mono text-xs"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  id={draftId}
                  value={draft}
                  inputMode={setting.valueType === 'number' ? 'decimal' : undefined}
                  onChange={(event) => setDraft(event.target.value)}
                  className="max-w-xs"
                />
                {setting.unit ? <span className="text-sm text-muted-foreground">{setting.unit}</span> : null}
                {setting.unit === 'ms' && Number.isFinite(Number(draft)) && draft.trim() !== '' ? (
                  <span className="text-sm text-muted-foreground">= {formatSettingNumber(Number(draft), 'ms')}</span>
                ) : null}
              </div>
            )}
            {isStructured ? (
              <p className="text-xs text-muted-foreground">
                Keep the same keys as the current value; only the values inside may change.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${draftId}-reason`}>Why are you changing it?</Label>
            <Textarea
              id={`${draftId}-reason`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="Kept in the setting's history."
            />
          </div>
          {localError || errorMessage(update.error) ? (
            <p className="text-sm text-destructive">{localError ?? errorMessage(update.error)}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={reason.trim().length < MIN_REASON_CHARS || update.isPending}>
              {update.isPending ? 'Saving…' : 'Save change'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {setting.editable ? (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Change
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setShowHistory((open) => !open)}>
            <History className="mr-2 h-3.5 w-3.5" />
            {showHistory ? 'Hide history' : 'History'}
          </Button>
        </div>
      )}

      {showHistory ? <SettingHistory setting={setting} /> : null}
    </article>
  );
}
