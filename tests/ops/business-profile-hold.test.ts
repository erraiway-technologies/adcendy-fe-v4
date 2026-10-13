import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerLabel,
  buildBusinessProfileHoldAnswer,
  isBusinessProfileHoldTask,
  readBusinessProfileHoldModel,
  readProfileHoldRefusal,
} from '../../shared/components/ops/businessProfileHold.ts';

// The business-profile hold (V3-94). The shape is the task the backend raises
// at intake normalization: the holds, the profile's answers and, since V3-94,
// the questions with the answers each allows. A clinic that books
// appointments holds on how the sale closes (no scoring row for a booking).

const answerOptions = [
  {
    question: 'close',
    label: 'How the sale closes',
    options: [
      { value: 'checkout', label: 'Buys at an online checkout' },
      { value: 'enquiry', label: 'Enquires first (a form, a call, a demo or a message)' },
      { value: 'booking', label: 'Books an appointment' },
    ],
  },
  {
    question: 'buyer',
    label: 'Who buys',
    options: [
      { value: 'consumer', label: 'Consumers' },
      { value: 'small_business', label: 'Small businesses' },
    ],
  },
  {
    question: 'offer',
    label: 'What is sold',
    options: [
      { value: 'service', label: 'A service' },
      { value: 'physical', label: 'Physical products' },
    ],
  },
];

const task = {
  failureMode: 'business_profile_hold',
  questionPayload: {
    client_name: 'Smile Dental',
    market_label: 'IN',
    question_context: {
      holds: [
        {
          code: 'no_config_key',
          questions: ['close'],
          diagnosis: 'The channel scoring has no row for a sale that closes by a booked appointment.',
        },
      ],
      answer_options: answerOptions,
      answers: { close: 'booking', buyer: 'consumer', offer: 'service' },
    },
  },
};

test('recognizes the business-profile hold by its failure mode', () => {
  assert.equal(isBusinessProfileHoldTask('business_profile_hold'), true);
  assert.equal(isBusinessProfileHoldTask('Business-Profile-Hold'), true);
  assert.equal(isBusinessProfileHoldTask('product_noun_low_confidence'), false);
  assert.equal(isBusinessProfileHoldTask(undefined), false);
});

test('reads the holds, the answers and the options, held questions first', () => {
  const model = readBusinessProfileHoldModel(task);

  assert.ok(model);
  assert.equal(model.clientName, 'Smile Dental');
  assert.equal(model.marketLabel, 'IN');
  assert.deepEqual(model.heldQuestions, ['close']);
  assert.equal(model.questions[0].question, 'close');
  assert.equal(model.questions[0].current, 'booking');
  assert.equal(answerLabel(model.questions[0], 'booking'), 'Books an appointment');
  assert.equal(answerLabel(model.questions[0], null), 'not known');
});

test('reads the camelCase task detail too', () => {
  const model = readBusinessProfileHoldModel({
    currentValuesToFix: {
      clientName: 'Smile Dental',
      holds: task.questionPayload.question_context.holds,
      answerOptions,
      answers: { close: 'booking' },
    },
  });

  assert.ok(model);
  assert.deepEqual(model.heldQuestions, ['close']);
  assert.equal(model.questions.length, 3);
});

test('has no form for a task without answer options (raised before V3-94)', () => {
  const context = { ...task.questionPayload.question_context, answer_options: undefined };
  assert.equal(
    readBusinessProfileHoldModel({ questionPayload: { question_context: context } }),
    null,
  );
});

test('needs every held question answered, each with a real reason', () => {
  const model = readBusinessProfileHoldModel(task);
  assert.ok(model);

  const unanswered = buildBusinessProfileHoldAnswer({
    model,
    edits: { buyer: { value: 'consumer', reason: 'Patients book for themselves.' } },
  });
  assert.ok('error' in unanswered);
  assert.match(unanswered.error, /How the sale closes/);

  const short = buildBusinessProfileHoldAnswer({
    model,
    edits: { close: { value: 'enquiry', reason: 'calls' } },
  });
  assert.ok('error' in short);
  assert.match(short.error, /at least 10 characters/);

  const foreign = buildBusinessProfileHoldAnswer({
    model,
    edits: { close: { value: 'visit', reason: 'Patients walk in to the clinic.' } },
  });
  assert.ok('error' in foreign);
});

test('sends only the answers the reviewer changed, with their reasons', () => {
  const model = readBusinessProfileHoldModel(task);
  assert.ok(model);

  const built = buildBusinessProfileHoldAnswer({
    model,
    edits: {
      close: { value: 'enquiry', reason: 'Patients call the front desk to book; the desk confirms by phone.' },
    },
    notes: '  Booking slots are not built yet.  ',
  });

  assert.ok('answer' in built);
  assert.deepEqual(built.answer, {
    answers: [
      {
        question: 'close',
        value: 'enquiry',
        reason: 'Patients call the front desk to book; the desk confirms by phone.',
      },
    ],
    reviewer_notes: 'Booking slots are not built yet.',
  });
});

test("reads the backend's refusal without its code", () => {
  assert.equal(
    readProfileHoldRefusal(
      'BUSINESS_PROFILE_OVERRIDE_REJECTED_V2: The profile still does not settle with these answers: A buying committee does not buy through a checkout.',
    ),
    'The profile still does not settle with these answers: A buying committee does not buy through a checkout.',
  );
  assert.equal(readProfileHoldRefusal('Network error'), null);
  assert.equal(readProfileHoldRefusal(null), null);
});
