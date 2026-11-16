import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCompetitorReviewAnswer,
  COMPETITOR_REVIEW_VERDICTS,
  competitorKey,
  groupCompetitorCandidates,
  initialCompetitorChoice,
  isCompetitorReviewTask,
  readCompetitorReviewModel,
  readCompetitorReviewSubmitted,
} from '../../shared/components/ops/competitorReview.ts';

// The competitor approval review (backend V3-338). A running-shoe shop,
// outside the test businesses; the list endpoint camelCases the payload.

const task = {
  failureMode: 'research_setup_competitors',
  questionPayload: {
    questionContext: {
      businessName: 'CloudStride',
      market: 'GB',
      enoughDirect: 8,
      checked: 3,
      flags: ['Sock Hut, named by the client, came out nearby, not direct: socks.'],
      candidates: [
        {
          rank: 1,
          name: 'Stride Co',
          site: 'stride.co',
          verdict: 'direct',
          why: 'same kind',
          quote: 'Running shoes',
        },
        {
          rank: 2,
          name: 'Sock Hut',
          site: 'sockhut.com',
          clientNamed: true,
          verdict: 'nearby',
          why: 'socks',
        },
        {
          rank: 3,
          name: 'Quiet Page',
          site: 'quiet.com',
          verdict: 'not_read',
          why: 'unreadable',
        },
        { rank: 4, name: 'Late Brand', site: null, verdict: 'not_checked' },
        { rank: 5, name: 'Odd Brand', verdict: 'something new' },
      ],
    },
  },
};

test('reads each candidate with its verdict, groups them and starts with the confirmed ones ticked', () => {
  const model = readCompetitorReviewModel(task);
  assert.ok(model);
  assert.equal(model.candidates.length, 5);
  assert.equal(model.candidates[1].clientNamed, true);
  // An unrecognised verdict is the reviewer's call, never a rejection.
  assert.equal(model.candidates[4].verdict, 'unknown');
  assert.deepEqual(initialCompetitorChoice(model), ['Stride Co']);
  assert.deepEqual(
    groupCompetitorCandidates(model).map((g) => [g.key, g.candidates.map((c) => c.name)]),
    [
      ['confirmed', ['Stride Co']],
      ['your_call', ['Quiet Page', 'Odd Brand']],
      ['nearby', ['Sock Hut']],
      ['other_market', []],
      ['not_competitor', []],
      ['not_checked', ['Late Brand']],
    ],
  );
  assert.equal(isCompetitorReviewTask('Research Setup Competitors'), true);
  assert.equal(isCompetitorReviewTask('research_setup_keywords'), false);
});

test('property: every verdict falls in exactly one group', () => {
  for (const verdict of COMPETITOR_REVIEW_VERDICTS) {
    const model = readCompetitorReviewModel({
      questionPayload: {
        questionContext: { candidates: [{ name: 'A', verdict }] },
      },
    });
    assert.ok(model);
    const holding = groupCompetitorCandidates(model).filter((g) => g.candidates.length > 0);
    assert.equal(holding.length, 1, verdict);
  }
});

test('property: an answer is built exactly when it holds one or more listed candidates, none twice', () => {
  const model = readCompetitorReviewModel(task);
  assert.ok(model);
  const names = model.candidates.map((c) => c.name);
  let built = 0;
  let refused = 0;
  for (let seed = 0; seed < 256; seed += 1) {
    const choice = names.filter((_, i) => ((seed >> i) & 1) === 1);
    if (seed & 32) choice.push('An Invented Brand');
    if (seed & 64 && choice.length > 0) choice.push(choice[0].toUpperCase());
    const keys = choice.map(competitorKey);
    const valid =
      choice.length > 0 &&
      new Set(keys).size === keys.length &&
      keys.every((k) => names.some((n) => competitorKey(n) === k));
    const result = buildCompetitorReviewAnswer({ model, choice });
    assert.equal('answer' in result, valid, `seed ${seed}: ${JSON.stringify(choice)}`);
    if ('answer' in result) {
      built += 1;
      // The answer carries the list's own spelling.
      assert.ok(result.answer.competitors.every((n) => names.includes(n)));
    } else refused += 1;
  }
  assert.ok(built > 0 && refused > 0);
});

test('property: what was checked against reads in either spelling, and a missing one is none', () => {
  const values = [undefined, null, '', '  ', 'running shoes'] as const;
  const lists = [undefined, null, 'x', [], ['trail shoes', '', null, 'road shoes']] as const;
  for (const against of values) {
    for (const others of lists) {
      for (const camel of [true, false]) {
        const context = camel
          ? { checkedAgainst: against, otherCategories: others, candidates: [] }
          : { checked_against: against, other_categories: others, candidates: [] };
        const model = readCompetitorReviewModel({ questionPayload: { questionContext: context } });
        assert.ok(model);
        assert.equal(model.checkedAgainst, against === 'running shoes' ? 'running shoes' : null);
        assert.deepEqual(
          model.otherCategories,
          Array.isArray(others) && others.length > 0 ? ['trail shoes', 'road shoes'] : [],
        );
      }
    }
  }
});

test('property (step 11): fewer than the minimum is built only with notes; no minimum, any one or more; the minimum reads in either spelling', () => {
  for (const minimum of [undefined, null, 0, 1, 2, 3, 5]) {
    for (const spelling of ['minimumDirect', 'minimum_direct']) {
      const context = { ...task.questionPayload.questionContext, [spelling]: minimum };
      const model = readCompetitorReviewModel({ questionPayload: { questionContext: context } });
      assert.ok(model);
      const expected = typeof minimum === 'number' && minimum >= 1 ? minimum : null;
      assert.equal(model.minimumDirect, expected);
      const names = model.candidates.map((c) => c.name);
      for (let count = 1; count <= names.length; count += 1) {
        for (const notes of ['', '  ', 'Only a few sell this here.']) {
          const built = buildCompetitorReviewAnswer({ model, choice: names.slice(0, count), notes });
          const short = expected !== null && count < expected;
          const reasoned = notes.trim() !== '';
          assert.equal('answer' in built, !short || reasoned, `${minimum} ${count} "${notes}"`);
          if ('error' in built) assert.match(built.error, /fewer than the/);
        }
      }
    }
  }
});

// V3-369: an answered review shows the answer given, never the defaults.
test('property: an answered competitor review starts from its approved list, in the list\'s spelling where it is on it', () => {
  const model = readCompetitorReviewModel(task);
  assert.ok(model);
  const names = model.candidates.map((c) => c.name);
  for (let seed = 1; seed < 300; seed += 1) {
    const chosen = names.filter((_, i) => (seed >> i) % 2 === 1);
    const extra = seed % 5 === 0 ? ['A business the reviewer added'] : [];
    const sent = [...chosen.map((name) => (seed % 2 === 0 ? name.toUpperCase() : name)), ...extra];
    const read = readCompetitorReviewSubmitted({ competitors: sent, reviewerNotes: `n${seed}` }, model);
    if (sent.length === 0) {
      assert.equal(read, null, `seed ${seed}`);
      continue;
    }
    assert.ok(read, `seed ${seed}`);
    assert.deepEqual(read.choice, [...chosen, ...extra], `seed ${seed}`);
    assert.equal(read.notes, `n${seed}`);
  }
  assert.equal(readCompetitorReviewSubmitted(undefined, model), null);
});
