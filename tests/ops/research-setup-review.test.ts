import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildResearchSetupAnswer,
  describeResearchSetupJudged,
  isResearchSetupReviewItem,
  isResearchSetupTask,
  readResearchSetupModel,
  readResearchSetupSubmitted,
  researchSetupKey,
} from '../../shared/components/ops/researchSetupReview.ts';

// The Research Setup Review (backend V3-329). The list endpoint camelCases the
// question payload; the shape here is a running-shoe shop, outside the test
// businesses.

const task = {
  failureMode: 'research_setup_core_searches',
  questionPayload: {
    category: 'research_setup_review',
    questionContext: {
      businessName: 'CloudStride',
      market: 'GB',
      leadOffering: 'Running shoes',
      products: ['Road running shoe', 'Trail running shoe', 'Running socks'],
      flags: ['"cheap running shoes" was picked as core in fewer than half the asks'],
      recommended: [
        {
          search: 'running shoes',
          volume: 40500,
          coreAsks: 3,
          alternateAsks: 0,
          asks: 3,
          products: [1, 2],
          reasons: ['The main thing it sells.'],
          merged: ['running shoe'],
          judged: 'relevant',
          evidence: ['Best running shoes 2026', 'Running shoes | Shop'],
          why: 'majority',
        },
        {
          search: 'cheap running shoes',
          volume: 880,
          coreAsks: 1,
          alternateAsks: 1,
          asks: 3,
          products: [1],
          reasons: ['Price buyers.'],
          merged: [],
          judged: 'unknown',
          evidence: [],
          why: 'filled',
        },
      ],
      alternates: [
        { search: 'trail running shoes', volume: 9900, coreAsks: 0, alternateAsks: 2, asks: 3, products: [2] },
      ],
      fullList: [
        { search: 'cheap running shoes', volume: 880, picked: true },
        { search: 'running shoes', volume: 40500, picked: true },
        { search: 'trail running shoes', volume: 9900, picked: true },
        { search: 'running socks', volume: 2400, picked: false },
        { search: 'road running shoes', volume: 2400, picked: false },
        { search: 'waterproof running shoes', volume: 1300, picked: false },
      ],
    },
  },
};

test('reads the review from the task: recommendations with products by name, the whole list by volume', () => {
  const model = readResearchSetupModel(task);
  assert.ok(model);
  assert.equal(model.businessName, 'CloudStride');
  assert.deepEqual(
    model.recommended.map((pick) => [pick.search, pick.coreAsks, pick.filled, pick.judged]),
    [
      ['running shoes', 3, false, 'relevant'],
      ['cheap running shoes', 1, true, 'unknown'],
    ],
  );
  assert.deepEqual(model.recommended[0].products, ['Road running shoe', 'Trail running shoe']);
  assert.deepEqual(model.recommended[0].merged, ['running shoe']);
  assert.equal(model.alternates[0].judged, 'unjudged');
  assert.deepEqual(
    model.fullList.map((entry) => entry.search),
    ['running shoes', 'trail running shoes', 'road running shoes', 'running socks', 'waterproof running shoes', 'cheap running shoes'],
  );
});

test('reads the same review sent in snake_case', () => {
  const model = readResearchSetupModel({
    questionPayload: {
      question_context: {
        business_name: 'CloudStride',
        full_list: [{ search: 'running shoes', volume: 40500, picked: true }],
        recommended: [{ search: 'running shoes', volume: 40500, core_asks: 2, alternate_asks: 1, asks: 3 }],
      },
    },
  });
  assert.ok(model);
  assert.equal(model.recommended[0].coreAsks, 2);
  assert.equal(model.fullList.length, 1);
});

test('no question context, no model', () => {
  assert.equal(readResearchSetupModel({ questionPayload: {} }), null);
});

test('property: an answer is built exactly when it is 1-5 distinct searches on the list, in the list\'s own wording', () => {
  const model = readResearchSetupModel(task);
  assert.ok(model);
  const listed = model.fullList.map((entry) => entry.search);
  for (let seed = 0; seed < 200; seed += 1) {
    const chosen = listed.filter((_, i) => (seed >> i) % 2 === 1);
    if (seed % 5 === 0) chosen.push('running tights');
    if (seed % 7 === 0 && chosen.length > 0) chosen.push(chosen[0].toUpperCase());
    const keys = chosen.map(researchSetupKey);
    const valid =
      chosen.length >= 1 &&
      chosen.length <= 5 &&
      new Set(keys).size === keys.length &&
      keys.every((key) => listed.some((search) => researchSetupKey(search) === key));
    const built = buildResearchSetupAnswer({ model, searches: chosen });
    assert.equal('answer' in built, valid, `seed ${seed}: ${chosen.join(' | ')}`);
    if ('answer' in built) {
      assert.ok(built.answer.core_searches.every((search) => listed.includes(search)));
    } else {
      assert.ok(built.error.length > 0);
    }
  }
});

test('the inbox tells a research-setup review from a blocker by its category or its kind', () => {
  assert.equal(isResearchSetupReviewItem({ category: 'research_setup_review' }), true);
  assert.equal(isResearchSetupReviewItem({ failureMode: 'research_setup_core_searches' }), true);
  assert.equal(isResearchSetupReviewItem({ category: 'intelligence_blocker', failureMode: 'mode_2' }), false);
  assert.equal(isResearchSetupReviewItem({}), false);
  assert.equal(isResearchSetupTask('Research Setup Core Searches'), true);
  assert.equal(describeResearchSetupJudged('not_relevant'), 'Its results are about something else');
});

// V3-359: a review that asks for the lead search carries it (null when
// untagged); one that does not ask never does.
test('reads whether the review asks for the lead search, and the client\'s answer', () => {
  const asked = readResearchSetupModel({
    questionPayload: {
      questionContext: {
        ...task.questionPayload.questionContext,
        asksLeadSearch: true,
        priorityOffering: 'Trail running shoes',
      },
    },
  });
  assert.ok(asked);
  assert.equal(asked.asksLeadSearch, true);
  assert.equal(asked.priorityOffering, 'Trail running shoes');
  const snake = readResearchSetupModel({
    questionPayload: { question_context: { asks_lead_search: true, priority_offering: '  ' } },
  });
  assert.ok(snake);
  assert.equal(snake.asksLeadSearch, true);
  assert.equal(snake.priorityOffering, null);
  const older = readResearchSetupModel(task);
  assert.ok(older);
  assert.equal(older.asksLeadSearch, false);
});

test('property: the lead search is sent exactly when asked, is one of the chosen searches in the list\'s wording, and null when untagged', () => {
  const base = readResearchSetupModel(task);
  assert.ok(base);
  const listed = base.fullList.map((entry) => entry.search);
  for (let seed = 0; seed < 400; seed += 1) {
    const asks = seed % 2 === 0;
    const model = { ...base, asksLeadSearch: asks };
    const chosen = listed.filter((_, i) => ((seed >> 1) >> i) % 2 === 1).slice(0, 5);
    if (chosen.length === 0) continue;
    const notChosen = listed.filter((search) => !chosen.includes(search));
    const kind = seed % 4;
    const lead =
      kind === 0
        ? null
        : kind === 1
          ? chosen[seed % chosen.length].toUpperCase()
          : kind === 2 && notChosen.length > 0
            ? notChosen[0]
            : chosen[0];
    const built = buildResearchSetupAnswer({ model, searches: chosen, leadSearch: lead });
    const leadIsChosen = lead === null || chosen.some((search) => researchSetupKey(search) === researchSetupKey(lead));
    if (asks && !leadIsChosen) {
      assert.ok('error' in built, `seed ${seed}: a lead search outside the choice is refused`);
      continue;
    }
    assert.ok('answer' in built, `seed ${seed}`);
    if (!asks) {
      assert.equal('lead_search' in built.answer, false, `seed ${seed}: not asked, not sent`);
      continue;
    }
    if (lead === null) {
      assert.equal(built.answer.lead_search, null, `seed ${seed}`);
    } else {
      assert.ok(built.answer.core_searches.includes(built.answer.lead_search as string), `seed ${seed}`);
      assert.equal(researchSetupKey(built.answer.lead_search as string), researchSetupKey(lead));
    }
  }
});

// V3-369: an answered review shows the answer given, never the defaults.
test('property: an answered core-searches review starts from its answer, in either case style; no answer, no start', () => {
  const base = readResearchSetupModel(task);
  assert.ok(base);
  const listed = base.fullList.map((entry) => entry.search);
  for (let seed = 1; seed < 300; seed += 1) {
    const chosen = listed.filter((_, i) => (seed >> i) % 2 === 1).slice(0, 5);
    const lead = seed % 3 === 0 ? null : (chosen[seed % Math.max(chosen.length, 1)] ?? null);
    const notes = seed % 2 === 0 ? `note ${seed}` : '';
    const snake = seed % 4 < 2;
    const answer = snake
      ? { core_searches: chosen, lead_search: lead, reviewer_notes: notes }
      : { coreSearches: chosen, leadSearch: lead, reviewerNotes: notes };
    const read = readResearchSetupSubmitted(answer);
    if (chosen.length === 0) {
      assert.equal(read, null, `seed ${seed}`);
      continue;
    }
    assert.deepEqual(read, { searches: chosen, leadSearch: lead, notes }, `seed ${seed}`);
  }
  for (const nothing of [null, undefined, {}, [], 'x', { core_searches: [] }]) {
    assert.equal(readResearchSetupSubmitted(nothing), null);
  }
});
