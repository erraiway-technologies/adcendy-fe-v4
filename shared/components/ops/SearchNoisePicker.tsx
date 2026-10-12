'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  buildSearchNoiseAnswer,
  describeSearchNoiseCompetitor,
  describeSearchNoiseDomain,
  normalizeCompetitorDomain,
  SEARCH_NOISE_MAX_ADDED,
  SEARCH_NOISE_NOTES_MAX_LENGTH,
  type SearchNoiseAnswer,
  type SearchNoiseModel,
} from './searchNoiseReview';

type SearchNoisePickerProps = {
  model: SearchNoiseModel;
  /** The task no longer takes an answer. */
  readOnly: boolean;
  pending: boolean;
  onSubmit: (answer: SearchNoiseAnswer) => void;
};

/**
 * The search-noise question (V3-66). The competitors the run already holds are
 * shown first, so the reviewer answers with them in view; each noise domain
 * stays noise unless the reviewer marks it as a competitor; and up to five
 * competitor domains the research missed can be added.
 *
 * The rendered question is not repeated here: it carries the same two lists
 * as prose, and a task asked before V3-66 words the noise as "surfaced"
 * domains, which is what misled reviewers.
 */
export function SearchNoisePicker({ model, readOnly, pending, onSubmit }: SearchNoisePickerProps) {
  const [included, setIncluded] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const disabled = readOnly || pending;
  const knownDomains = new Set(model.competitorsFound.map((entry) => entry.domain).filter(Boolean));
  const listedDomains = new Set(model.noiseDomains.map((entry) => entry.domain));

  const toggle = (domain: string, checked: boolean) => {
    setError(null);
    setIncluded((current) =>
      checked ? [...current.filter((entry) => entry !== domain), domain] : current.filter((entry) => entry !== domain),
    );
  };

  const addTyped = () => {
    const domain = normalizeCompetitorDomain(draft);
    if (!domain) {
      setError('Type a competitor domain, such as huel.com.');
      return;
    }
    if (knownDomains.has(domain)) {
      setError(`${domain} is already one of the competitors found.`);
      setDraft('');
      return;
    }
    if (listedDomains.has(domain)) {
      // A listed noise domain is included rather than added twice.
      toggle(domain, true);
      setDraft('');
      return;
    }
    if (added.includes(domain)) {
      setError('That domain is already on the list.');
      setDraft('');
      return;
    }
    if (added.length >= SEARCH_NOISE_MAX_ADDED) {
      setError(`Add at most ${SEARCH_NOISE_MAX_ADDED} competitors.`);
      return;
    }
    setError(null);
    setAdded((current) => [...current, domain]);
    setDraft('');
  };

  const removeAdded = (domain: string) => {
    setError(null);
    setAdded((current) => current.filter((entry) => entry !== domain));
  };

  const submit = () => {
    const built = buildSearchNoiseAnswer({ model, included, added, notes });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  const changes = included.length + added.length;

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Confirm The Competitor Set</CardTitle>
        <CardDescription>
          The competitor set for {model.clientName ?? 'this client'}
          {model.marketLabel ? ` in ${model.marketLabel}` : ''} is in doubt. Check the competitors already found, then
          say whether any of the search-noise domains below is really a direct competitor, and add any the research
          missed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {model.diagnosis ? (
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-sm font-semibold text-foreground">Why this is being asked</p>
            <p className="mt-1 text-sm text-muted-foreground">{model.diagnosis}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Competitors already found ({model.competitorsFound.length})
          </p>
          {model.competitorsFound.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {model.competitorsFound.map((competitor) => {
                const detail = describeSearchNoiseCompetitor(competitor);
                return (
                  <li key={`${competitor.name}-${competitor.domain ?? ''}`} className="p-3">
                    <span className="block text-sm font-semibold text-foreground">{competitor.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[competitor.domain, detail || null].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No competitor was verified for this market, or this task was asked before the list was recorded.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Search noise ({included.length} marked as competitors)
          </p>
          <p className="text-xs text-muted-foreground">
            Marketplaces, social networks, video sites, publishers and reference sites the search results carried.
            They are left out of the competitor set unless you mark one.
          </p>
          {model.noiseDomains.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {model.noiseDomains.map((entry, index) => {
                const checkboxId = `search-noise-domain-${index}`;
                const detail = describeSearchNoiseDomain(entry);
                return (
                  <li key={entry.domain} className="flex items-start gap-3 p-3">
                    <Checkbox
                      id={checkboxId}
                      className="mt-0.5"
                      checked={included.includes(entry.domain)}
                      disabled={disabled}
                      onCheckedChange={(checked) => toggle(entry.domain, checked === true)}
                    />
                    <Label htmlFor={checkboxId} className="block flex-1 cursor-pointer space-y-1 font-normal">
                      <span className="block text-sm font-semibold text-foreground">{entry.domain}</span>
                      <span className="block text-xs text-muted-foreground">
                        {included.includes(entry.domain) ? 'Include as a competitor' : 'Leave as noise'}
                        {detail ? ` · ${detail}` : ''}
                      </span>
                    </Label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No search-noise domains were recorded for this market.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-noise-draft">Add a competitor the research missed</Label>
          <div className="flex gap-2">
            <Input
              id="search-noise-draft"
              value={draft}
              disabled={disabled || added.length >= SEARCH_NOISE_MAX_ADDED}
              placeholder="huel.com"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTyped();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled || added.length >= SEARCH_NOISE_MAX_ADDED}
              onClick={addTyped}
            >
              Add
            </Button>
          </div>
          {added.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {added.map((domain) => (
                <li
                  key={domain}
                  className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1 text-xs text-foreground"
                >
                  {domain}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                    onClick={() => removeAdded(domain)}
                    aria-label={`Remove ${domain}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {added.length} of {SEARCH_NOISE_MAX_ADDED} added.
          </p>
        </div>

        {model.requiresDecisionPerDomain ? null : (
          <div className="space-y-1.5">
            <Label htmlFor="search-noise-notes">Notes (optional)</Label>
            <Textarea
              id="search-noise-notes"
              value={notes}
              disabled={disabled}
              maxLength={SEARCH_NOISE_NOTES_MAX_LENGTH}
              placeholder="Anything the pipeline should know about these competitors."
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {changes === 0
              ? 'Submitting with nothing marked goes on with the competitors already found.'
              : 'Marked and added domains are verified like any other competitor before they are used.'}
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : changes === 0 ? 'Go on with these competitors' : 'Submit competitors'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
