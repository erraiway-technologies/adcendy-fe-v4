'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  buildUnmatchedChannelHoldAnswer,
  UNMATCHED_CHANNEL_NOTES_MAX_LENGTH,
  type UnmatchedChannelDecision,
  type UnmatchedChannelHoldAnswer,
  type UnmatchedChannelHoldModel,
} from './unmatchedChannelHold';

type UnmatchedChannelHoldFormProps = {
  model: UnmatchedChannelHoldModel;
  /** The task no longer takes an answer. */
  readOnly: boolean;
  pending: boolean;
  /** Why the backend refused the last answer, in its own words. */
  refusal: string | null;
  onSubmit: (answer: UnmatchedChannelHoldAnswer) => void;
};

/** The choice that flags a name as a channel the list does not have. */
const NEW_CHANNEL = '__new_channel__';
const NO_SECOND = '__none__';

/**
 * The unmatched-channel hold (V3-154): the client named channels the list
 * does not have. The reviewer maps each to the channel it is - a name for two
 * channels ("Google Search & Shopping") takes a second - or flags it as new.
 */
export function UnmatchedChannelHoldForm({ model, readOnly, pending, refusal, onSubmit }: UnmatchedChannelHoldFormProps) {
  const [decisions, setDecisions] = useState<Record<string, UnmatchedChannelDecision | undefined>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const disabled = readOnly || pending;

  const choose = (label: string, slot: 0 | 1, value: string) => {
    setError(null);
    setDecisions((current) => {
      if (value === NEW_CHANNEL) {
        return { ...current, [label]: { kind: 'new_channel' } };
      }
      const existing = current[label];
      const ids = existing && existing.kind === 'map' ? [...existing.channelIds] : [];
      if (slot === 0) {
        ids[0] = value;
      } else if (value === NO_SECOND) {
        ids.splice(1);
      } else {
        ids[1] = value;
      }
      return { ...current, [label]: { kind: 'map', channelIds: ids.filter(Boolean) } };
    });
  };

  const submit = () => {
    const built = buildUnmatchedChannelHoldAnswer({ model, decisions, notes });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Map The Channels The List Does Not Have</CardTitle>
        <CardDescription>
          The intake for {model.clientName ?? 'this client'} names channels the channel list does not have. Map each to
          the channel it is and the plan reads it that way; the name is kept, so the next client who types it is
          understood. Flag it as a new channel if the list should have it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="divide-y divide-border rounded-xl border border-border">
          {model.names.map((name, index) => {
            const decision = decisions[name.label];
            const first = decision?.kind === 'new_channel' ? NEW_CHANNEL : decision?.channelIds[0];
            const second = decision?.kind === 'map' ? decision.channelIds[1] : undefined;
            const firstId = `unmatched-channel-${index}`;
            const secondId = `unmatched-channel-${index}-second`;
            return (
              <li key={name.label} className="space-y-3 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">&ldquo;{name.label}&rdquo;</p>
                  {name.status ? <p className="text-xs text-muted-foreground">The client marked it {name.status}.</p> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={firstId} className="text-xs text-muted-foreground">
                      The channel it is
                    </Label>
                    <Select value={first} disabled={disabled} onValueChange={(value) => choose(name.label, 0, value)}>
                      <SelectTrigger id={firstId}>
                        <SelectValue placeholder="Choose the channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {model.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_CHANNEL}>A new channel the list should have</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {decision?.kind === 'map' && decision.channelIds.length > 0 ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={secondId} className="text-xs text-muted-foreground">
                        A second channel, if the name covers two (optional)
                      </Label>
                      <Select
                        value={second ?? NO_SECOND}
                        disabled={disabled}
                        onValueChange={(value) => choose(name.label, 1, value)}
                      >
                        <SelectTrigger id={secondId}>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_SECOND}>None</SelectItem>
                          {model.options
                            .filter((option) => option.value !== first)
                            .map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="space-y-1.5">
          <Label htmlFor="unmatched-channel-notes">Notes (optional)</Label>
          <Textarea
            id="unmatched-channel-notes"
            value={notes}
            disabled={disabled}
            maxLength={UNMATCHED_CHANNEL_NOTES_MAX_LENGTH}
            placeholder="What a new channel is, for the channel list."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {refusal ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm font-semibold text-destructive">The answer was refused</p>
            <p className="mt-1 text-sm text-foreground">{refusal}</p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Mapped names are written into this intake and kept for the next client. Research then starts again from
            client context assembly.
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
