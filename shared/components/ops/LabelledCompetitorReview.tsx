'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  buildLabelledCompetitorAnswer,
  COMPETITOR_REVIEW_NOTES_MAX_LENGTH,
  competitorKey,
  competitorLabelOf,
  groupCompetitorCandidates,
  initialCompetitorLabelling,
  moveDirectCompetitor,
  readCompetitorReviewSubmitted,
  setCompetitorLabel,
  type CompetitorLabel,
  type CompetitorLabelling,
  type CompetitorReviewAnswer,
  type CompetitorReviewCandidate,
  type CompetitorReviewModel,
} from './competitorReview';

type LabelledCompetitorReviewProps = {
  model: CompetitorReviewModel;
  submitted?: unknown;
  readOnly: boolean;
  pending: boolean;
  onSubmit: (answer: CompetitorReviewAnswer) => void;
};

const LABELS: ReadonlyArray<{ value: CompetitorLabel; text: string }> = [
  { value: 'direct', text: 'Direct' },
  { value: 'nearby', text: 'Nearby' },
  { value: 'none', text: 'Not a competitor' },
];

/**
 * The competitor review with the reviewer's labels (backend V3-398): each
 * candidate is direct, nearby or not a competitor, and the direct ones are
 * put in order - the first lead the plan. The check's verdict is where each
 * starts; the reviewer's label decides.
 */
export function LabelledCompetitorReview({
  model,
  submitted,
  readOnly,
  pending,
  onSubmit,
}: LabelledCompetitorReviewProps) {
  const [labelling, setLabelling] = useState<CompetitorLabelling>(() => initialCompetitorLabelling(model, submitted));
  const [notes, setNotes] = useState(() => readCompetitorReviewSubmitted(submitted, model)?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const disabled = readOnly || pending;
  const byKey = new Map(model.candidates.map((c) => [competitorKey(c.name), c]));

  const label = (name: string, value: CompetitorLabel) => {
    setError(null);
    setLabelling((current) => setCompetitorLabel(current, name, value));
  };
  const move = (name: string, step: -1 | 1) => {
    setError(null);
    setLabelling((current) => moveDirectCompetitor(current, name, step));
  };
  const submit = () => {
    const built = buildLabelledCompetitorAnswer({ model, labelling, notes });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  const labelButtons = (candidate: CompetitorReviewCandidate) => {
    const current = competitorLabelOf(labelling, candidate.name);
    return (
      <div className="flex shrink-0 flex-wrap gap-1" role="group" aria-label={`What ${candidate.name} is`}>
        {LABELS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={current === option.value ? 'default' : 'outline'}
            aria-pressed={current === option.value}
            disabled={disabled}
            onClick={() => label(candidate.name, option.value)}
          >
            {option.text}
          </Button>
        ))}
      </div>
    );
  };

  const details = (candidate: CompetitorReviewCandidate) => (
    <div className="min-w-0 flex-1 space-y-0.5">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-medium text-foreground">{candidate.name}</span>
        <span className="text-xs text-muted-foreground">#{candidate.rank}</span>
        {candidate.clientNamed ? <span className="text-xs text-amber-400">named by the client</span> : null}
        {candidate.listing ? <span className="text-xs text-muted-foreground">store listing</span> : null}
      </p>
      {candidate.site ? (
        <a
          href={/^https?:\/\//i.test(candidate.site) ? candidate.site : `https://${candidate.site}`}
          target="_blank"
          rel="noreferrer noopener"
          className="block truncate text-xs text-sky-400 hover:underline"
        >
          {candidate.site}
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">
          {candidate.verdict === 'not_checked' ? 'Site not looked up yet' : 'No site found'}
        </p>
      )}
      {candidate.why ? <p className="text-xs text-muted-foreground">{candidate.why}</p> : null}
      {candidate.quote ? <p className="text-xs italic text-foreground/80">Its page: “{candidate.quote}”</p> : null}
    </div>
  );

  const minimum = model.minimumDirect;
  const directCount = labelling.direct.length;

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Research Setup Review: competitors</CardTitle>
        <CardDescription>
          The competitors of {model.businessName ?? 'this client'}
          {model.market ? ` in ${model.market}` : ''}. The check read {model.checked} of the {model.candidates.length}{' '}
          ranked candidates&apos; own sites. Mark each one direct, nearby or not a competitor, then put the direct ones
          in order - the first ones lead the plan. Each starts where the check placed it; your label decides.
        </CardDescription>
        {model.checkedAgainst ? (
          <p className="text-sm text-muted-foreground">
            Checked against: <span className="font-medium text-foreground">{model.checkedAgainst}</span>.
            {model.otherCategories.length > 0
              ? ` Not checked: ${model.otherCategories.join(', ')} - mark a competitor in those by hand if it matters.`
              : ''}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {model.flags.length > 0 ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-sm font-semibold text-foreground">Look at these first</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {model.flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Your direct competitors, in order{' '}
              <span className="font-normal text-muted-foreground">· {directCount}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Same kind of product, same buyer, in this market. Number 1 leads; use the arrows to reorder.
            </p>
          </div>
          {directCount === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              None yet - mark at least one candidate below as Direct.
            </p>
          ) : (
            <ol className="divide-y divide-border rounded-xl border border-border">
              {labelling.direct.map((name, index) => {
                const candidate = byKey.get(competitorKey(name));
                if (!candidate) return null;
                return (
                  <li key={`direct-${candidate.rank}`} className="flex flex-wrap items-start gap-3 px-3 py-2.5">
                    <span className="w-6 pt-0.5 text-sm font-semibold tabular-nums text-foreground">{index + 1}</span>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Move ${candidate.name} up`}
                        disabled={disabled || index === 0}
                        onClick={() => move(candidate.name, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Move ${candidate.name} down`}
                        disabled={disabled || index === directCount - 1}
                        onClick={() => move(candidate.name, 1)}
                      >
                        ↓
                      </Button>
                    </div>
                    {details(candidate)}
                    {labelButtons(candidate)}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Nearby <span className="font-normal text-muted-foreground">· {labelling.nearby.length}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Serve the same buyer or need with another kind of product, or sell yours as a side line. The plan keeps
              them as nearby competitors.
            </p>
          </div>
          {labelling.nearby.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              None.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {labelling.nearby.map((name) => {
                const candidate = byKey.get(competitorKey(name));
                if (!candidate) return null;
                return (
                  <li key={`nearby-${candidate.rank}`} className="flex flex-wrap items-start gap-3 px-3 py-2.5">
                    {details(candidate)}
                    {labelButtons(candidate)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Everything the check found</p>
          {groupCompetitorCandidates(model).map((group) => {
            const unlabelled = group.candidates.filter((c) => competitorLabelOf(labelling, c.name) === 'none');
            return unlabelled.length === 0 ? null : (
              <div key={group.key} className="space-y-2">
                <div>
                  <p className="text-sm text-foreground">
                    {group.title} <span className="text-muted-foreground">· {unlabelled.length} not marked</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{group.hint}</p>
                </div>
                <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto rounded-xl border border-border">
                  {unlabelled.map((candidate) => (
                    <li key={`${group.key}-${candidate.rank}`} className="flex flex-wrap items-start gap-3 px-3 py-2.5">
                      {details(candidate)}
                      {labelButtons(candidate)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="competitor-review-notes">Notes (optional)</Label>
          <Textarea
            id="competitor-review-notes"
            value={notes}
            disabled={disabled}
            maxLength={COMPETITOR_REVIEW_NOTES_MAX_LENGTH}
            placeholder="Why you moved one - for example, it sells to the same buyer but a different product."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {directCount} direct, {labelling.nearby.length} nearby
            {minimum !== null && directCount < minimum
              ? ` - fewer than ${minimum} direct: say in the notes why this market has fewer`
              : ''}
            .
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : 'Approve these competitors'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
