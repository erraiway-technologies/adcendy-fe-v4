import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildResearchKeywordsAnswer,
  initialResearchKeywordChoice,
  isResearchKeywordsTask,
  readResearchKeywordsModel,
  readResearchKeywordsSubmitted,
  researchKeywordKey,
} from '../../shared/components/ops/researchKeywordsReview.ts';

// The keyword review (backend V3-329). A running-shoe shop, outside the test
// businesses; the list endpoint camelCases the payload.

const task = {
  failureMode: 'research_setup_keywords',
  questionPayload: {
    questionContext: {
      businessName: 'CloudStride',
      market: 'GB',
      keywordsPerSearch: 5,
      flags: ['"running socks": only 2 of 5'],
      shares: [
        {
          search: 'running shoes',
          volume: 40500,
          state: 'complete',
          keywords: [
            { keyword: 'running shoes', volume: 40500, from: 'approved' },
            { keyword: 'best running shoes', volume: 9900, from: 'model' },
          ],
          candidates: [{ query: 'cheap running shoes', volume: 880 }],
          dropped: [{ search: 'nike running shoes', volume: 6600, verdict: 'brand' }],
        },
        {
          search: 'running socks',
          volume: 2400,
          state: 'short',
          reason: 'only 2 of 5',
          keywords: [
            { keyword: 'running socks', volume: 2400, from: 'approved' },
            { keyword: 'merino running socks', volume: 320, from: 'model' },
          ],
          candidates: [{ query: 'best running shoes', volume: 9900 }],
          dropped: [],
        },
      ],
    },
  },
};

test('reads each search with its picks, other candidates and what the filter left out', () => {
  const model = readResearchKeywordsModel(task);
  assert.ok(model);
  assert.equal(model.shares.length, 2);
  assert.deepEqual(
    model.shares[0].options.map((o) => [o.keyword, o.source, o.leftOutAs]),
    [
      ['running shoes', 'approved', null],
      ['best running shoes', 'picked', null],
      ['cheap running shoes', 'candidate', null],
      ['nike running shoes', 'left_out', 'brand'],
    ],
  );
  assert.equal(model.shares[1].short, true);
  assert.deepEqual(initialResearchKeywordChoice(model), {
    'running shoes': ['running shoes', 'best running shoes'],
    'running socks': ['running socks', 'merino running socks'],
  });
  assert.equal(isResearchKeywordsTask('Research Setup Keywords'), true);
});

test('property: an answer is built exactly when every search has 1-5 of its own list and no keyword is in two searches', () => {
  const model = readResearchKeywordsModel(task);
  assert.ok(model);
  let built = 0;
  let refused = 0;
  for (let seed = 0; seed < 300; seed += 1) {
    const choice: Record<string, string[]> = {};
    model.shares.forEach((share, s) => {
      choice[share.search] = share.options.map((o) => o.keyword).filter((_, i) => ((seed >> (i + s * 4)) & 1) === 1);
    });
    if (seed % 7 === 0) choice['running shoes'].push('running tights');
    const keysOf = (search: string): string[] => (choice[search] ?? []).map(researchKeywordKey);
    const ownOk: boolean = model.shares.every((share) => {
      const own = new Set(share.options.map((o) => researchKeywordKey(o.keyword)));
      const keys = keysOf(share.search);
      return keys.length >= 1 && keys.length <= 5 && keys.every((k) => own.has(k));
    });
    const all: string[] = model.shares.flatMap((share) => keysOf(share.search));
    const valid: boolean = ownOk && new Set(all).size === all.length;
    const result = buildResearchKeywordsAnswer({ model, choice });
    assert.equal('answer' in result, valid, `seed ${seed}: ${JSON.stringify(choice)}`);
    if ('answer' in result) built += 1;
    else refused += 1;
  }
  assert.ok(built > 0 && refused > 0);
});

// V3-369: an answered review shows the answer given, never the defaults.
test('property: an answered keyword review starts from its answer, keyed by the model\'s own search wording', () => {
  const model = readResearchKeywordsModel(task);
  assert.ok(model);
  for (let seed = 1; seed < 200; seed += 1) {
    const shares = model.shares.map((share, i) => ({
      approved_search: seed % 2 === 0 ? share.search.toUpperCase() : share.search,
      keywords: share.options.filter((_, j) => ((seed + i) >> j) % 2 === 1).map((o) => o.keyword),
    }));
    const read = readResearchKeywordsSubmitted({ shares, reviewer_notes: `n${seed}` }, model);
    assert.ok(read, `seed ${seed}`);
    assert.deepEqual(Object.keys(read.choice).sort(), model.shares.map((share) => share.search).sort());
    model.shares.forEach((share, i) => {
      assert.deepEqual(read.choice[share.search], shares[i].keywords, `seed ${seed} ${share.search}`);
    });
    assert.equal(read.notes, `n${seed}`);
  }
  assert.equal(readResearchKeywordsSubmitted(null, model), null);
  assert.equal(readResearchKeywordsSubmitted({ shares: [] }, model), null);
});
