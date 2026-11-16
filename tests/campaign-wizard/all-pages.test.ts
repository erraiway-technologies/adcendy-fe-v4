import assert from 'node:assert/strict';
import test from 'node:test';
import { readAllPages } from '../../shared/api/real/allPages.ts';

// V3-371: the campaign list showed only its first page of 20, hiding older
// drafts that count against the open-draft cap. Every page is read.

const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

test('property: every item on every page is read once, in order, and reading stops at the last page', async () => {
  const r = rng(371);
  for (let run = 0; run < 500; run += 1) {
    const pageSize = 1 + Math.floor(r() * 100);
    // Within the 50-page limit (the next test covers the limit itself).
    const total = Math.min(Math.floor(r() * 450), 50 * pageSize);
    const items = Array.from({ length: total }, (_, index) => index);
    let calls = 0;
    const read = await readAllPages(async (page) => {
      calls += 1;
      const start = (page - 1) * pageSize;
      return { items: items.slice(start, start + pageSize), hasNext: page * pageSize < total };
    });
    assert.deepEqual(read, items);
    assert.equal(calls, Math.max(1, Math.ceil(total / pageSize)));
  }
});

test('a server that always says there is more never loops forever', async () => {
  let calls = 0;
  const read = await readAllPages(async () => {
    calls += 1;
    return { items: [calls], hasNext: true };
  }, 5);
  assert.equal(calls, 5);
  assert.deepEqual(read, [1, 2, 3, 4, 5]);
});
