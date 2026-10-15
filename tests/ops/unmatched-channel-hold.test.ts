import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildUnmatchedChannelHoldAnswer,
  isUnmatchedChannelHoldTask,
  readUnmatchedChannelHoldModel,
  readUnmatchedChannelRefusal,
} from '../../shared/components/ops/unmatchedChannelHold.ts';

// The unmatched-channel hold (backend V3-154): the task the backend raises at
// intake when a client names channels the channel list does not have.

const task = {
  failureMode: 'unmatched_channel_hold',
  questionPayload: {
    clientName: 'Ridgeline',
    questionContext: {
      unmatched: [
        { label: 'FB ads', status: 'active' },
        { label: 'Podcast swaps', status: 'active' },
      ],
      answerOptions: [
        { value: 'meta_ads', label: 'Meta Ads (Facebook + Instagram)' },
        { value: 'google_search_ads', label: 'Google Search Ads' },
        { value: 'google_shopping_ads', label: 'Google Shopping Ads' },
      ],
    },
  },
};

test('recognises the hold and reads its names and channel list', () => {
  assert.equal(isUnmatchedChannelHoldTask('Unmatched Channel Hold'), true);
  assert.equal(isUnmatchedChannelHoldTask('business_profile_hold'), false);
  const model = readUnmatchedChannelHoldModel(task);
  assert.ok(model);
  assert.equal(model.clientName, 'Ridgeline');
  assert.deepEqual(
    model.names.map((name) => name.label),
    ['FB ads', 'Podcast swaps'],
  );
  assert.equal(model.options.length, 3);
});

test('reads nothing from a task without names or a list', () => {
  assert.equal(readUnmatchedChannelHoldModel({ questionPayload: { questionContext: { unmatched: [] } } }), null);
  assert.equal(readUnmatchedChannelHoldModel({}), null);
});

test('builds the answer the template validates', () => {
  const model = readUnmatchedChannelHoldModel(task);
  assert.ok(model);
  const built = buildUnmatchedChannelHoldAnswer({
    model,
    decisions: {
      'FB ads': { kind: 'map', channelIds: ['meta_ads'] },
      'Podcast swaps': { kind: 'new_channel' },
    },
    notes: 'Podcast swaps: two shows trade ad reads.',
  });
  assert.deepEqual(built, {
    answer: {
      mappings: [
        { label: 'FB ads', decision: 'map', channel_ids: ['meta_ads'] },
        { label: 'Podcast swaps', decision: 'new_channel' },
      ],
      reviewer_notes: 'Podcast swaps: two shows trade ad reads.',
    },
  });
});

test('maps a name for two channels to both', () => {
  const model = readUnmatchedChannelHoldModel(task);
  assert.ok(model);
  const built = buildUnmatchedChannelHoldAnswer({
    model,
    decisions: {
      'FB ads': { kind: 'map', channelIds: ['google_search_ads', 'google_shopping_ads'] },
      'Podcast swaps': { kind: 'new_channel' },
    },
  });
  assert.ok('answer' in built);
  assert.deepEqual(built.answer.mappings[0].channel_ids, ['google_search_ads', 'google_shopping_ads']);
});

test('asks for a decision on every name, and a channel for a mapped one', () => {
  const model = readUnmatchedChannelHoldModel(task);
  assert.ok(model);
  assert.deepEqual(
    buildUnmatchedChannelHoldAnswer({ model, decisions: { 'FB ads': { kind: 'map', channelIds: ['meta_ads'] } } }),
    { error: 'Map "Podcast swaps" to a channel, or flag it as a new channel.' },
  );
  assert.deepEqual(
    buildUnmatchedChannelHoldAnswer({
      model,
      decisions: { 'FB ads': { kind: 'map', channelIds: [] }, 'Podcast swaps': { kind: 'new_channel' } },
    }),
    { error: 'Choose the channel "FB ads" is.' },
  );
});

test("reads the backend's refusal without its code", () => {
  assert.equal(
    readUnmatchedChannelRefusal(
      'UNMATCHED_CHANNEL_ANSWER_REJECTED_V2: "FB ads" is mapped to facebook_ads, which the catalogue does not have',
    ),
    '"FB ads" is mapped to facebook_ads, which the catalogue does not have',
  );
  assert.equal(readUnmatchedChannelRefusal('Network error'), null);
});
