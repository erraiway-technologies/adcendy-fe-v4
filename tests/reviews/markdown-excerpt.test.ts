import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownExcerpt } from '../../shared/markdown/markdown-excerpt.ts';

test('skips the heading and a bold-only lead label', () => {
  const excerpt = markdownExcerpt(
    '## Executive Summary\n\n**Winning Angle**\n\nAdults in south Bengaluru face **a consistent set** of doubts.',
  );
  assert.equal(excerpt, 'Adults in south Bengaluru face a consistent set of doubts.');
});

test('skips tables and lists before the first paragraph', () => {
  const excerpt = markdownExcerpt(
    '## Search Demand\n\n| Field | Detail |\n|---|---|\n| Market | India |\n\n- one\n- two\n\nDemand is concentrated in [implants](/x).',
  );
  assert.equal(excerpt, 'Demand is concentrated in implants.');
});

test('truncates long text and returns null when there is no prose', () => {
  assert.equal(markdownExcerpt('word '.repeat(100), 20)?.length, 20);
  assert.equal(markdownExcerpt('## Only a heading\n\n- a list'), null);
});
