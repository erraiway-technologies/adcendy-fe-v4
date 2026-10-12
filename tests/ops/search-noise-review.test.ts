import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSearchNoiseAnswer,
  describeSearchNoiseCompetitor,
  describeSearchNoiseDomain,
  isSearchNoiseTask,
  normalizeCompetitorDomain,
  readSearchNoiseModel,
  SEARCH_NOISE_MAX_ADDED,
} from '../../shared/components/ops/searchNoiseReview.ts';

// The search-noise question (backend mode_3a, V3-66). The task detail sends its
// values in camelCase; the question context it was asked with is the fallback,
// in snake_case. Huel GB's held run is the shape used here.

const detail = {
  currentValuesToFix: {
    market: 'GB',
    clientName: 'Huel',
    signalSummary: 'Only 1 direct competitor was verified for Tier 1, fewer than the 2 the competitive sections are built on.',
    competitorsFound: [
      { name: 'Yfood', domain: 'yfood.com', tier: 'tier_1', clientNamed: true },
      { name: 'Mana', domain: 'https://www.mana.drinks/', tier: 'tier_2', clientNamed: false },
    ],
    searchNoiseDomains: [
      { domain: 'amazon.co.uk', category: 'marketplace', occurrences: 9 },
      { domain: 'youtube.com', category: 'video', occurrences: 1 },
      { domain: 'amazon.co.uk', category: 'marketplace', occurrences: 9 },
    ],
    requiresDecisionPerDomain: false,
  },
};

test('recognizes the search-noise task by its failure mode', () => {
  assert.equal(isSearchNoiseTask('mode_3a'), true);
  assert.equal(isSearchNoiseTask('MODE-3A'), true);
  assert.equal(isSearchNoiseTask('mode_3b'), false);
  assert.equal(isSearchNoiseTask(null), false);
});

test('normalizes what is typed or listed to the domain the schema accepts', () => {
  assert.equal(normalizeCompetitorDomain('https://www.Huel.com/uk?x=1'), 'huel.com');
  assert.equal(normalizeCompetitorDomain(' mana.drinks '), 'mana.drinks');
  assert.equal(normalizeCompetitorDomain('huel'), null);
  assert.equal(normalizeCompetitorDomain(''), null);
  assert.equal(normalizeCompetitorDomain(42), null);
});

test('reads the competitors found and the search noise from the task detail', () => {
  const model = readSearchNoiseModel(detail);
  assert.ok(model);
  assert.equal(model.clientName, 'Huel');
  assert.equal(model.marketLabel, 'GB');
  assert.match(model.diagnosis ?? '', /Only 1 direct competitor/);
  assert.deepEqual(model.competitorsFound, [
    { name: 'Yfood', domain: 'yfood.com', tier: 'tier_1', clientNamed: true },
    { name: 'Mana', domain: 'mana.drinks', tier: 'tier_2', clientNamed: false },
  ]);
  assert.deepEqual(model.noiseDomains, [
    { domain: 'amazon.co.uk', category: 'marketplace', occurrences: 9 },
    { domain: 'youtube.com', category: 'video', occurrences: 1 },
  ]);
  assert.equal(model.requiresDecisionPerDomain, false);
});

test('falls back to the question context, and to the domain list a task asked before V3-66 carries', () => {
  const model = readSearchNoiseModel({
    questionPayload: {
      question_context: {
        market_label: 'GB',
        client_name: 'Huel',
        candidate_domains: 'amazon.co.uk, www.youtube.com, not a domain',
      },
    },
  });
  assert.ok(model);
  assert.equal(model.marketLabel, 'GB');
  assert.deepEqual(model.competitorsFound, []);
  assert.deepEqual(
    model.noiseDomains.map((entry) => entry.domain),
    ['amazon.co.uk', 'youtube.com'],
  );
  assert.equal(readSearchNoiseModel({}), null);
});

test('sends only what the reviewer marked or added', () => {
  const model = readSearchNoiseModel(detail);
  assert.ok(model);
  assert.deepEqual(
    buildSearchNoiseAnswer({
      model,
      included: ['amazon.co.uk', 'unlisted.com'],
      added: ['https://www.Feed.co/', 'feed.co'],
      notes: '  Amazon sells only Huel here. ',
    }),
    {
      answer: {
        competitor_decisions: [{ domain: 'amazon.co.uk', decision: 'include' }],
        additional_competitors: ['feed.co'],
        reviewer_notes: 'Amazon sells only Huel here.',
      },
    },
  );
});

test('leaving every domain as noise is a valid answer', () => {
  const model = readSearchNoiseModel(detail);
  assert.ok(model);
  assert.deepEqual(buildSearchNoiseAnswer({ model, included: [], added: [] }), { answer: {} });
});

test('a typed noise domain is included rather than added', () => {
  const model = readSearchNoiseModel(detail);
  assert.ok(model);
  assert.deepEqual(buildSearchNoiseAnswer({ model, included: [], added: ['youtube.com'] }), {
    answer: { competitor_decisions: [{ domain: 'youtube.com', decision: 'include' }] },
  });
});

test('says why an answer cannot be sent', () => {
  const model = readSearchNoiseModel(detail);
  assert.ok(model);
  const tooMany = buildSearchNoiseAnswer({
    model,
    included: [],
    added: Array.from({ length: SEARCH_NOISE_MAX_ADDED + 1 }, (_, index) => `rival${index}.com`),
  });
  assert.ok('error' in tooMany);
  assert.match(tooMany.error, /at most 5/);

  const known = buildSearchNoiseAnswer({ model, included: [], added: ['www.yfood.com'] });
  assert.ok('error' in known);
  assert.match(known.error, /already one of the competitors found/);

  const notADomain = buildSearchNoiseAnswer({ model, included: [], added: ['huel'] });
  assert.ok('error' in notADomain);
});

test('a task asked before V3-66 gets a decision for every listed domain, and no notes', () => {
  const legacy = readSearchNoiseModel({
    currentValuesToFix: { ...detail.currentValuesToFix, requiresDecisionPerDomain: true },
  });
  assert.ok(legacy);
  assert.deepEqual(
    buildSearchNoiseAnswer({ model: legacy, included: ['youtube.com'], added: [], notes: 'ignored' }),
    {
      answer: {
        competitor_decisions: [
          { domain: 'amazon.co.uk', decision: 'exclude' },
          { domain: 'youtube.com', decision: 'include' },
        ],
      },
    },
  );
  const empty = buildSearchNoiseAnswer({
    model: { ...legacy, noiseDomains: [] },
    included: [],
    added: ['feed.co'],
  });
  assert.ok('error' in empty);
});

test('describes competitors and noise domains as the lists read them', () => {
  assert.equal(
    describeSearchNoiseCompetitor({ name: 'Yfood', domain: 'yfood.com', tier: 'tier_1', clientNamed: true }),
    'Tier 1 · client-named',
  );
  assert.equal(
    describeSearchNoiseCompetitor({ name: 'X', domain: null, tier: 'unverified', clientNamed: false }),
    'not yet verified',
  );
  assert.equal(
    describeSearchNoiseDomain({ domain: 'amazon.co.uk', category: 'online_marketplace', occurrences: 9 }),
    'online marketplace · 9 search results',
  );
  assert.equal(describeSearchNoiseDomain({ domain: 'a.com', category: null, occurrences: null }), '');
});
