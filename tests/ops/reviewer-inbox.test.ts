import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterInboxGroups,
  formatInboxTime,
  groupInboxItems,
  inboxClientName,
  reviewerTaskHeadline,
} from '../../shared/components/ops/reviewerInbox.ts';

type Item = {
  id: string;
  campaignId?: string | null;
  pipelineRunId?: string | null;
  marketId?: string | null;
  updatedAt?: string | null;
  campaignBusinessName?: string | null;
};

test('property: every item lands in exactly one group, groups and items newest first', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    let s = seed;
    const rand = (n: number) => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s % n;
    };
    const items: Item[] = Array.from({ length: rand(12) }, (_, i) => ({
      id: `t${i}`,
      campaignId: rand(4) === 0 ? null : `c${rand(3)}`,
      pipelineRunId: rand(2) === 0 ? null : `r${rand(3)}`,
      marketId: rand(3) === 0 ? null : ['GB', 'IN'][rand(2)],
      updatedAt: rand(5) === 0 ? null : new Date(Date.UTC(2026, 10, 1 + rand(6), rand(24))).toISOString(),
      campaignBusinessName: rand(3) === 0 ? null : `Shop ${rand(3)}`,
    }));
    const groups = groupInboxItems(items, inboxClientName);
    const ids = groups.flatMap((g) => g.items.map((i) => i.id)).sort();
    assert.deepEqual(ids, items.map((i) => i.id).sort(), `seed ${seed}`);
    const time = (i: Item) => (i.updatedAt ? Date.parse(i.updatedAt) : 0);
    for (const g of groups) {
      assert.ok(g.items.every((item, k) => k === 0 || time(g.items[k - 1]) >= time(item)));
      assert.ok(g.items.every((item) => (item.marketId ?? null) === g.market));
      assert.ok(g.items.every((item) => inboxClientName(item) === g.client));
    }
    assert.equal(new Set(groups.map((g) => g.key)).size, groups.length, 'one group per client and market');
    assert.ok(groups.every((g, k) => k === 0 || groups[k - 1].latest >= g.latest));
  }
});

test('the client name never carries an id and falls back without one', () => {
  assert.equal(inboxClientName({ campaignBusinessName: 'CloudStride', campaignTitle: 'CloudStride GB (id: x1)' }), 'CloudStride');
  assert.equal(inboxClientName({ campaignTitle: 'CloudStride spring push' }), 'CloudStride spring push');
  assert.equal(inboxClientName({}), 'Unnamed client');
});

test('filter keeps groups whose client or market matches', () => {
  const groups = groupInboxItems(
    [
      { id: 'a', campaignId: 'c1', marketId: 'GB', campaignBusinessName: 'CloudStride' },
      { id: 'b', campaignId: 'c2', marketId: 'IN', campaignBusinessName: 'TrailPeak' },
    ],
    inboxClientName,
  );
  assert.deepEqual(filterInboxGroups(groups, 'cloud').map((g) => g.client), ['CloudStride']);
  assert.deepEqual(filterInboxGroups(groups, 'in').map((g) => g.client), ['TrailPeak']);
  assert.equal(filterInboxGroups(groups, '  ').length, 2);
});

test('headlines say what to do', () => {
  assert.equal(reviewerTaskHeadline({ failureMode: 'research_setup_keywords' }), 'Approve the keywords for each search');
  assert.equal(reviewerTaskHeadline({ failureMode: 'research_setup_competitors' }), 'Approve the direct competitors');
  assert.equal(reviewerTaskHeadline({ failureMode: 'Research Setup Core Searches' }), 'Choose the searches research starts from');
  assert.equal(reviewerTaskHeadline({ failureMode: 'required_output_hold' }), 'Required output hold');
  assert.equal(reviewerTaskHeadline({}), 'Reviewer input needed');
});

test('times are short and unknown is null', () => {
  const now = new Date(2026, 10, 7, 20, 0);
  assert.match(formatInboxTime(new Date(2026, 10, 7, 19, 13).toISOString(), now) ?? '', /^Today, 7:13 PM$/);
  assert.match(formatInboxTime(new Date(2026, 10, 6, 9, 2).toISOString(), now) ?? '', /^Yesterday, 9:02 AM$/);
  assert.match(formatInboxTime(new Date(2026, 10, 1, 11, 54).toISOString(), now) ?? '', /^1 Nov, 11:54 AM$/);
  assert.equal(formatInboxTime(null, now), null);
  assert.equal(formatInboxTime('not a date', now), null);
});
