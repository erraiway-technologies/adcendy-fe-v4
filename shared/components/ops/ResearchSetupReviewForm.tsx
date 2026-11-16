'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  buildResearchSetupAnswer,
  readResearchSetupSubmitted,
  describeResearchSetupJudged,
  describeResearchSetupVolume,
  RESEARCH_SETUP_MAX_SELECTED,
  RESEARCH_SETUP_NOTES_MAX_LENGTH,
  researchSetupKey,
  type ResearchSetupAnswer,
  type ResearchSetupModel,
  type ResearchSetupPick,
} from './researchSetupReview';

type ResearchSetupReviewFormProps = {
  model: ResearchSetupModel;
  /** The answer already given, if any: the form starts from it (V3-369). */
  submitted?: unknown;
  /** The task no longer takes an answer. */
  readOnly: boolean;
  pending: boolean;
  onSubmit: (answer: ResearchSetupAnswer) => void;
};

const judgedTone: Record<ResearchSetupPick['judged'], string> = {
  relevant: 'text-emerald-400',
  not_relevant: 'text-destructive',
  unknown: 'text-amber-400',
  unjudged: 'text-muted-foreground',
};

/**
 * The Research Setup Review: the reviewer chooses the one to five searches
 * competitor research starts from. The system's recommendations come first,
 * with how many of the model's asks picked each, the products it is for and
 * what the search's own results showed; then the alternates; then every
 * search on the list. Any search on the list can be chosen. Where the review
 * asks (V3-359), the reviewer also tags which chosen search is for the
 * product the business most wants to grow, with the client's own answer
 * beside it; "can't tell" is a valid answer.
 */
export function ResearchSetupReviewForm({
  model,
  submitted,
  readOnly,
  pending,
  onSubmit,
}: ResearchSetupReviewFormProps) {
  const [given] = useState(() => readResearchSetupSubmitted(submitted));
  const [selected, setSelected] = useState<string[]>(
    () => given?.searches ?? model.recommended.slice(0, RESEARCH_SETUP_MAX_SELECTED).map((pick) => pick.search),
  );
  const [filter, setFilter] = useState('');
  const [notes, setNotes] = useState(given?.notes ?? '');
  const [leadSearch, setLeadSearch] = useState<string | null>(given?.leadSearch ?? null);
  const [error, setError] = useState<string | null>(null);

  const disabled = readOnly || pending;
  const selectedKeys = useMemo(() => new Set(selected.map(researchSetupKey)), [selected]);
  const full = selected.length >= RESEARCH_SETUP_MAX_SELECTED;

  const toggle = (search: string, checked: boolean) => {
    setError(null);
    if (!checked && leadSearch && researchSetupKey(leadSearch) === researchSetupKey(search)) {
      setLeadSearch(null);
    }
    setSelected((current) =>
      checked
        ? [...current.filter((entry) => researchSetupKey(entry) !== researchSetupKey(search)), search]
        : current.filter((entry) => researchSetupKey(entry) !== researchSetupKey(search)),
    );
  };

  const submit = () => {
    const built = buildResearchSetupAnswer({ model, searches: selected, leadSearch, notes });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  const filterKey = researchSetupKey(filter);
  const listed = filterKey
    ? model.fullList.filter((entry) => researchSetupKey(entry.search).includes(filterKey))
    : model.fullList;

  const pickRow = (pick: ResearchSetupPick, idPrefix: string, index: number) => {
    const id = `${idPrefix}-${index}`;
    const isChosen = selectedKeys.has(researchSetupKey(pick.search));
    return (
      <li key={pick.search} className="flex items-start gap-3 p-3">
        <Checkbox
          id={id}
          className="mt-0.5"
          checked={isChosen}
          disabled={disabled || (!isChosen && full)}
          onCheckedChange={(checked) => toggle(pick.search, checked === true)}
        />
        <Label htmlFor={id} className="block flex-1 cursor-pointer space-y-1 font-normal">
          <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold text-foreground">{pick.search}</span>
            <span className="text-xs text-muted-foreground">{describeResearchSetupVolume(pick.volume)}</span>
            {pick.asks > 0 ? (
              <span className="text-xs text-muted-foreground">
                core pick in {pick.coreAsks} of {pick.asks} asks
                {pick.alternateAsks > 0 ? `, alternate in ${pick.alternateAsks}` : ''}
              </span>
            ) : null}
            {pick.filled ? <span className="text-xs text-amber-400">filled a gap</span> : null}
          </span>
          {pick.products.length > 0 ? (
            <span className="block text-xs text-muted-foreground">For: {pick.products.join('; ')}</span>
          ) : null}
          <span className={`block text-xs ${judgedTone[pick.judged]}`}>
            {describeResearchSetupJudged(pick.judged)}
            {pick.evidence.length > 0 ? (
              <span className="text-muted-foreground"> — {pick.evidence.join(' · ')}</span>
            ) : null}
          </span>
          {pick.reason ? <span className="block text-xs italic text-muted-foreground">“{pick.reason}”</span> : null}
          {pick.merged.length > 0 ? (
            <span className="block text-xs text-muted-foreground">Same search as: {pick.merged.join(', ')}</span>
          ) : null}
        </Label>
      </li>
    );
  };

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Research Setup Review</CardTitle>
        <CardDescription>
          Choose the searches competitor research for {model.businessName ?? 'this client'}
          {model.market ? ` in ${model.market}` : ''} starts from: 1 to {RESEARCH_SETUP_MAX_SELECTED}. The businesses
          that show up for them are the candidates every later step checks. The system recommends; you decide, from
          any search on the list.
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

        {full ? (
          <p className="text-xs text-muted-foreground">
            {RESEARCH_SETUP_MAX_SELECTED} searches are chosen, so the others are greyed out: untick one to swap in an
            alternate or any search from the list.
          </p>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Recommended ({model.recommended.length})
            {model.leadOffering ? (
              <span className="font-normal text-muted-foreground"> · main offering: {model.leadOffering}</span>
            ) : null}
          </p>
          {model.recommended.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {model.recommended.map((pick, index) => pickRow(pick, 'research-setup-recommended', index))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recommendations: choose from the whole list below.</p>
          )}
        </div>

        {model.alternates.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Alternates ({model.alternates.length})</p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {model.alternates.map((pick, index) => pickRow(pick, 'research-setup-alternate', index))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              Every search on the list ({model.fullList.length})
            </p>
            <Input
              aria-label="Filter the list"
              className="h-8 w-56"
              value={filter}
              placeholder="Filter, e.g. tracker"
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {listed.map((entry, index) => {
              const id = `research-setup-list-${index}`;
              const isChosen = selectedKeys.has(researchSetupKey(entry.search));
              return (
                <li key={entry.search} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    id={id}
                    checked={isChosen}
                    disabled={disabled || (!isChosen && full)}
                    onCheckedChange={(checked) => toggle(entry.search, checked === true)}
                  />
                  <Label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between gap-3 font-normal">
                    <span className={entry.picked ? 'text-sm font-semibold text-foreground' : 'text-sm text-foreground'}>
                      {entry.search}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {describeResearchSetupVolume(entry.volume)}
                    </span>
                  </Label>
                </li>
              );
            })}
            {listed.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">No search matches.</li> : null}
          </ul>
          <p className="text-xs text-muted-foreground">Bold: a search the model picked or offered as an alternate.</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
          <p className="text-sm font-semibold text-foreground">
            Your choice ({selected.length} of {RESEARCH_SETUP_MAX_SELECTED})
            {full ? (
              <span className="font-normal text-muted-foreground"> · untick one to swap in another</span>
            ) : null}
          </p>
          {selected.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {selected.map((search) => (
                <li
                  key={search}
                  className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1 text-xs text-foreground"
                >
                  {search}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                    onClick={() => toggle(search, false)}
                    aria-label={`Remove ${search}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing chosen yet.</p>
          )}
        </div>

        {model.asksLeadSearch ? (
          <div className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Lead search</p>
              <p className="text-xs text-muted-foreground">
                Which of your chosen searches is for the product or service the business most wants to grow? Search
                channels build for this one, not for the biggest search.
              </p>
              <p className="text-sm text-foreground">
                {model.priorityOffering ? (
                  <>
                    <span className="text-muted-foreground">The client said: </span>
                    {model.priorityOffering}
                  </>
                ) : (
                  <span className="text-muted-foreground">The client didn&apos;t say which product it most wants to grow.</span>
                )}
              </p>
            </div>
            {selected.length > 0 ? (
              <RadioGroup
                aria-label="Lead search"
                value={leadSearch ? researchSetupKey(leadSearch) : 'none'}
                disabled={disabled}
                onValueChange={(value) => {
                  setError(null);
                  setLeadSearch(
                    value === 'none' ? null : (selected.find((entry) => researchSetupKey(entry) === value) ?? null),
                  );
                }}
                className="gap-2"
              >
                {selected.map((search, index) => (
                  <div key={search} className="flex items-center gap-2">
                    <RadioGroupItem value={researchSetupKey(search)} id={`research-setup-lead-${index}`} />
                    <Label htmlFor={`research-setup-lead-${index}`} className="cursor-pointer text-sm font-normal">
                      {search}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="research-setup-lead-none" />
                  <Label htmlFor="research-setup-lead-none" className="cursor-pointer text-sm font-normal">
                    Can&apos;t tell
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <p className="text-sm text-muted-foreground">Choose searches first.</p>
            )}
            {!leadSearch ? (
              <p className="text-xs text-amber-400">
                Untagged: a search channel won&apos;t be named the main channel until a lead search is tagged.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="research-setup-notes">Notes (optional)</Label>
          <Textarea
            id="research-setup-notes"
            value={notes}
            disabled={disabled}
            maxLength={RESEARCH_SETUP_NOTES_MAX_LENGTH}
            placeholder="Why these searches - for example a product line that is not where the business competes."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Approving reruns this market&apos;s research from these searches.
          </p>
          <Button type="button" disabled={disabled || selected.length === 0} onClick={submit}>
            {pending ? 'Submitting…' : 'Approve these searches'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
