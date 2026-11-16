'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  buildResearchKeywordsAnswer,
  initialResearchKeywordChoice,
  readResearchKeywordsSubmitted,
  RESEARCH_KEYWORDS_NOTES_MAX_LENGTH,
  researchKeywordKey,
  type ResearchKeywordOption,
  type ResearchKeywordsAnswer,
  type ResearchKeywordsModel,
} from './researchKeywordsReview';

type ResearchKeywordsReviewFormProps = {
  model: ResearchKeywordsModel;
  /** The answer already given, if any: the form starts from it (V3-369). */
  submitted?: unknown;
  readOnly: boolean;
  pending: boolean;
  onSubmit: (answer: ResearchKeywordsAnswer) => void;
};

const sourceLabel = (option: ResearchKeywordOption): string | null => {
  switch (option.source) {
    case 'approved':
      return 'approved search';
    case 'picked':
      return 'model pick';
    case 'left_out':
      return option.leftOutAs === 'brand'
        ? 'left out: names a brand'
        : option.leftOutAs === 'other_kind'
          ? 'left out: another kind'
          : 'left out';
    default:
      return null;
  }
};

/**
 * The keyword review: for each approved search, the keywords researched for
 * it. The model's picks are ticked; the search's other candidates and what the
 * kind filter left out sit below them. One to the share size per search, from
 * its own list, none in two searches.
 */
export function ResearchKeywordsReviewForm({
  model,
  submitted,
  readOnly,
  pending,
  onSubmit,
}: ResearchKeywordsReviewFormProps) {
  const [given] = useState(() => readResearchKeywordsSubmitted(submitted, model));
  const [choice, setChoice] = useState<Record<string, string[]>>(
    () => given?.choice ?? initialResearchKeywordChoice(model),
  );
  const [notes, setNotes] = useState(given?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const disabled = readOnly || pending;

  // A keyword ticked under one search cannot be ticked under another.
  const owner = useMemo(() => {
    const map = new Map<string, string>();
    for (const [search, keywords] of Object.entries(choice)) {
      for (const keyword of keywords) map.set(researchKeywordKey(keyword), search);
    }
    return map;
  }, [choice]);

  const toggle = (search: string, keyword: string, checked: boolean) => {
    setError(null);
    setChoice((current) => {
      const list = current[search] ?? [];
      const key = researchKeywordKey(keyword);
      return {
        ...current,
        [search]: checked
          ? [...list.filter((k) => researchKeywordKey(k) !== key), keyword]
          : list.filter((k) => researchKeywordKey(k) !== key),
      };
    });
  };

  const submit = () => {
    const built = buildResearchKeywordsAnswer({ model, choice, notes });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  const total = Object.values(choice).reduce((n, list) => n + list.length, 0);

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Research Setup Review: keywords</CardTitle>
        <CardDescription>
          The keywords researched for each approved search for {model.businessName ?? 'this client'}
          {model.market ? ` in ${model.market}` : ''}: 1 to {model.perSearch} per search, from that search&apos;s own list.
          The businesses that show up for them are the competitor candidates. The model&apos;s picks are ticked; swap in any
          other search below, including one the filter left out.
        </CardDescription>
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

        {model.shares.map((share, s) => {
          const chosen = choice[share.search] ?? [];
          const full = chosen.length >= model.perSearch;
          return (
            <div key={share.search} className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {share.search}{' '}
                <span className="font-normal text-muted-foreground">
                  · {share.volume.toLocaleString('en-IN')} a month · {chosen.length} of {model.perSearch} chosen
                </span>
                {share.short && share.reason ? (
                  <span className="font-normal text-amber-400"> · short: {share.reason}</span>
                ) : null}
              </p>
              <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                {share.options.map((option, i) => {
                  const id = `research-keyword-${s}-${i}`;
                  const key = researchKeywordKey(option.keyword);
                  const isChosen = chosen.some((k) => researchKeywordKey(k) === key);
                  const takenElsewhere = !isChosen && owner.has(key) && owner.get(key) !== share.search;
                  const label = sourceLabel(option);
                  return (
                    <li key={option.keyword} className="flex items-center gap-3 px-3 py-2">
                      <Checkbox
                        id={id}
                        checked={isChosen}
                        disabled={disabled || takenElsewhere || (!isChosen && full)}
                        onCheckedChange={(checked) => toggle(share.search, option.keyword, checked === true)}
                      />
                      <Label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between gap-3 font-normal">
                        <span className="text-sm text-foreground">
                          {option.keyword}
                          {label ? (
                            <span
                              className={
                                option.source === 'left_out' ? 'ml-2 text-xs text-amber-400' : 'ml-2 text-xs text-muted-foreground'
                              }
                            >
                              {label}
                            </span>
                          ) : null}
                          {takenElsewhere ? (
                            <span className="ml-2 text-xs text-muted-foreground">chosen under “{owner.get(key)}”</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {option.volume.toLocaleString('en-IN')} a month
                        </span>
                      </Label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="space-y-1.5">
          <Label htmlFor="research-keywords-notes">Notes (optional)</Label>
          <Textarea
            id="research-keywords-notes"
            value={notes}
            disabled={disabled}
            maxLength={RESEARCH_KEYWORDS_NOTES_MAX_LENGTH}
            placeholder="Why these keywords - for example a buyer need the business does not serve."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {total} keywords chosen. Your choice is recorded on this run; discovery is not connected to this review yet, so
            nothing reruns.
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : 'Approve these keywords'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
