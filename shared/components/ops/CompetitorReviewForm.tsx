'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  buildCompetitorReviewAnswer,
  COMPETITOR_REVIEW_NOTES_MAX_LENGTH,
  competitorKey,
  groupCompetitorCandidates,
  initialCompetitorChoice,
  readCompetitorReviewSubmitted,
  type CompetitorReviewAnswer,
  type CompetitorReviewModel,
} from './competitorReview';

type CompetitorReviewFormProps = {
  model: CompetitorReviewModel;
  /** The answer already given, if any: the form starts from it (V3-369). */
  submitted?: unknown;
  readOnly: boolean;
  pending: boolean;
  onSubmit: (answer: CompetitorReviewAnswer) => void;
};

/**
 * The competitor approval review: every ranked candidate, grouped by what
 * the check said, each with its reason and the page's own words. The
 * confirmed ones are ticked; tick or untick any candidate.
 */
export function CompetitorReviewForm({ model, submitted, readOnly, pending, onSubmit }: CompetitorReviewFormProps) {
  const [given] = useState(() => readCompetitorReviewSubmitted(submitted, model));
  const [choice, setChoice] = useState<string[]>(() => given?.choice ?? initialCompetitorChoice(model));
  const [notes, setNotes] = useState(given?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const disabled = readOnly || pending;
  const chosen = new Set(choice.map(competitorKey));

  const toggle = (name: string, checked: boolean) => {
    setError(null);
    const key = competitorKey(name);
    setChoice((current) =>
      checked
        ? [...current.filter((n) => competitorKey(n) !== key), name]
        : current.filter((n) => competitorKey(n) !== key),
    );
  };

  const submit = () => {
    const built = buildCompetitorReviewAnswer({ model, choice, notes });
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
        <CardTitle>Research Setup Review: competitors</CardTitle>
        <CardDescription>
          The direct competitors of {model.businessName ?? 'this client'}
          {model.market ? ` in ${model.market}` : ''}. The check read {model.checked} of the {model.candidates.length}{' '}
          ranked candidates&apos; own sites, in rank order. The ones it confirmed are ticked; every other candidate is
          below with what the check found. Tick or untick any of them.
        </CardDescription>
        {model.checkedAgainst ? (
          <p className="text-sm text-muted-foreground">
            Checked against: <span className="font-medium text-foreground">{model.checkedAgainst}</span>.
            {model.otherCategories.length > 0
              ? ` Not checked: ${model.otherCategories.join(', ')} - tick a competitor in those by hand if it matters.`
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

        {groupCompetitorCandidates(model).map((group) =>
          group.candidates.length === 0 ? null : (
            <div key={group.key} className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {group.title}{' '}
                  <span className="font-normal text-muted-foreground">
                    · {group.candidates.length} ·{' '}
                    {group.candidates.filter((c) => chosen.has(competitorKey(c.name))).length} ticked
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{group.hint}</p>
              </div>
              <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto rounded-xl border border-border">
                {group.candidates.map((candidate) => {
                  const id = `competitor-${group.key}-${candidate.rank}`;
                  const isChosen = chosen.has(competitorKey(candidate.name));
                  return (
                    <li key={id} className="flex items-start gap-3 px-3 py-2.5">
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={isChosen}
                        disabled={disabled}
                        onCheckedChange={(checked) => toggle(candidate.name, checked === true)}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <Label
                          htmlFor={id}
                          className="flex cursor-pointer flex-wrap items-baseline gap-x-2 font-normal"
                        >
                          <span className="text-sm font-medium text-foreground">{candidate.name}</span>
                          <span className="text-xs text-muted-foreground">#{candidate.rank}</span>
                          {candidate.clientNamed ? (
                            <span className="text-xs text-amber-400">named by the client</span>
                          ) : null}
                          {candidate.listing ? (
                            <span className="text-xs text-muted-foreground">store listing</span>
                          ) : null}
                        </Label>
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
                        {candidate.quote ? (
                          <p className="text-xs italic text-foreground/80">Its page: “{candidate.quote}”</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
        )}

        <div className="space-y-1.5">
          <Label htmlFor="competitor-review-notes">Notes (optional)</Label>
          <Textarea
            id="competitor-review-notes"
            value={notes}
            disabled={disabled}
            maxLength={COMPETITOR_REVIEW_NOTES_MAX_LENGTH}
            placeholder="Why you added or removed one - for example, it sells the same product under another name."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {choice.length} competitors approved
            {model.minimumDirect !== null && choice.length < model.minimumDirect
              ? ` - fewer than ${model.minimumDirect}: say in the notes why this market has fewer`
              : ''}
            . Your choice is recorded on this run; the competitor steps are not connected to this review yet, so nothing
            reruns.
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : 'Approve these competitors'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
