'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  answerLabel,
  buildBusinessProfileHoldAnswer,
  PROFILE_HOLD_NOTES_MAX_LENGTH,
  PROFILE_HOLD_REASON_MAX_LENGTH,
  PROFILE_HOLD_REASON_MIN_LENGTH,
  type BusinessProfileHoldAnswer,
  type BusinessProfileHoldModel,
} from './businessProfileHold';

type BusinessProfileHoldFormProps = {
  model: BusinessProfileHoldModel;
  /** The task no longer takes an answer. */
  readOnly: boolean;
  pending: boolean;
  /** Why the backend refused the last answer, in its own words. */
  refusal: string | null;
  onSubmit: (answer: BusinessProfileHoldAnswer) => void;
};

/**
 * The business-profile hold (V3-94): the intake does not settle what kind of
 * business this is. The reviewer answers each question the hold names - from
 * the answers the task allows - and may correct any other, each with the
 * reason: how the business actually closes, sells or buys.
 */
export function BusinessProfileHoldForm({
  model,
  readOnly,
  pending,
  refusal,
  onSubmit,
}: BusinessProfileHoldFormProps) {
  const [edits, setEdits] = useState<Record<string, { value: string; reason: string }>>(() =>
    Object.fromEntries(
      model.heldQuestions.map((held) => [
        held,
        { value: model.questions.find((entry) => entry.question === held)?.current ?? '', reason: '' },
      ]),
    ),
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const disabled = readOnly || pending;

  const update = (questionKey: string, patch: Partial<{ value: string; reason: string }>) => {
    setError(null);
    setEdits((current) => ({
      ...current,
      [questionKey]: {
        value: patch.value ?? current[questionKey]?.value ?? '',
        reason: patch.reason ?? current[questionKey]?.reason ?? '',
      },
    }));
  };

  const stopEditing = (questionKey: string) => {
    setError(null);
    setEdits((current) => {
      const next = { ...current };
      delete next[questionKey];
      return next;
    });
  };

  const submit = () => {
    const built = buildBusinessProfileHoldAnswer({ model, edits, notes });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  const unanswerable = model.holds.filter((hold) => hold.questions.length === 0);

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Settle What Kind Of Business This Is</CardTitle>
        <CardDescription>
          The intake for {model.clientName ?? 'this client'}
          {model.marketLabel ? ` in ${model.marketLabel}` : ''} does not settle how it sells, so the plan cannot choose
          its conversion steps, measurement or wording. Answer the questions the hold names and correct any other answer
          that is wrong, each with the reason.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {model.holds.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
            <p className="text-sm font-semibold text-foreground">Why this is being asked</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {model.holds.map((hold, index) => (
                <li key={`${hold.code}-${index}`}>{hold.diagnosis}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {unanswerable.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {unanswerable.length === 1 ? 'One hold needs' : 'Some holds need'} an intake answer this form does not
            cover (the market or the business stage); correct the intake and run it again.
          </p>
        ) : null}

        <ul className="divide-y divide-border rounded-xl border border-border">
          {model.questions.map((entry) => {
            const held = model.heldQuestions.includes(entry.question);
            const edit = edits[entry.question];
            const selectId = `profile-hold-${entry.question}`;
            const reasonId = `profile-hold-${entry.question}-reason`;
            return (
              <li key={entry.question} className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {entry.label}
                      {held ? <span className="ml-2 text-xs font-medium text-destructive">needs an answer</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">Intake says: {answerLabel(entry, entry.current)}</p>
                  </div>
                  {!held ? (
                    edit ? (
                      <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => stopEditing(entry.question)}>
                        Keep the intake answer
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => update(entry.question, { value: entry.current ?? '' })}
                      >
                        Change
                      </Button>
                    )
                  ) : null}
                </div>

                {edit ? (
                  <div className="space-y-2">
                    <Label htmlFor={selectId} className="sr-only">
                      {entry.label}
                    </Label>
                    <Select
                      value={edit.value || undefined}
                      disabled={disabled}
                      onValueChange={(value) => update(entry.question, { value })}
                    >
                      <SelectTrigger id={selectId}>
                        <SelectValue placeholder="Choose the answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {entry.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label htmlFor={reasonId} className="text-xs text-muted-foreground">
                      Reason (at least {PROFILE_HOLD_REASON_MIN_LENGTH} characters): how the business actually works
                    </Label>
                    <Textarea
                      id={reasonId}
                      value={edit.reason}
                      disabled={disabled}
                      maxLength={PROFILE_HOLD_REASON_MAX_LENGTH}
                      placeholder="Patients book a slot online and pay at the clinic."
                      onChange={(event) => update(entry.question, { reason: event.target.value })}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="space-y-1.5">
          <Label htmlFor="profile-hold-notes">Notes (optional)</Label>
          <Textarea
            id="profile-hold-notes"
            value={notes}
            disabled={disabled}
            maxLength={PROFILE_HOLD_NOTES_MAX_LENGTH}
            placeholder="Anything the pipeline should know about this business."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {refusal ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm font-semibold text-destructive">The answers were refused</p>
            <p className="mt-1 text-sm text-foreground">{refusal}</p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Each answer replaces the intake&apos;s for this run, with your reason kept beside it. Research then starts
            again from client context assembly.
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : 'Submit answers'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
