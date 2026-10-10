import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const adapterSource = fs.readFileSync(
  path.resolve(process.cwd(), 'shared', 'api', 'real', 'wizard.real.ts'),
  'utf8',
);

const wizardModalSource = fs.readFileSync(
  path.resolve(process.cwd(), 'shared', 'components', 'campaigns', 'CampaignWizardModal.tsx'),
  'utf8',
);

function extract(source: string, pattern: RegExp, name: string) {
  const match = source.match(pattern)?.[0];
  assert.ok(match, `Expected to find ${name}`);
  return match;
}

const step5Builder = extract(adapterSource, /function buildStep5Payload[\s\S]*?\n}\n/, 'buildStep5Payload');
const step6Builder = extract(adapterSource, /function buildStep6Payload[\s\S]*?\n}\n/, 'buildStep6Payload');
const goalsStepPayload = extract(
  wizardModalSource,
  /const buildGoalsStepPayload = [\s\S]*?\n  };\n/,
  'buildGoalsStepPayload',
);
const economicsStepPayload = extract(
  wizardModalSource,
  /const buildEconomicsStepPayload = [\s\S]*?\n  }\);\n/,
  'buildEconomicsStepPayload',
);

test('wizard commit forwards every backend confirmation gate', () => {
  for (const field of [
    'confirmFocus',
    'confirmBusiness',
    'confirmAudience',
    'confirmGoals',
    'confirmEconomics',
    'readyToGenerate',
    'dataConsentOptIn',
  ]) {
    assert.match(
      adapterSource,
      new RegExp(`${field}: payload\\.${field}`),
      `Expected commit request to forward ${field}`,
    );
  }
});

// The monthly spend is the whole marketing budget. Copying it into a blank
// paid media budget made the backend read it as the paid-ads budget.
test('the paid media budget is sent as answered, never filled from monthly spend', () => {
  assert.match(step5Builder, /paidMediaBudgetRange: normalizeNullableString\(data\.paidMediaBudgetRange\),/);
  for (const [name, source] of [
    ['wizard.real.ts', adapterSource],
    ['CampaignWizardModal.tsx', wizardModalSource],
  ] as const) {
    assert.doesNotMatch(
      source,
      /paidMediaBudgetRange:[^,]*monthlyMarketingSpend/,
      `${name} must not fill paidMediaBudgetRange from monthlyMarketingSpend`,
    );
  }
});

test('the wizard v2.1 answers reach the backend under their contract names, uncoerced', () => {
  // No third argument: an unknown value is dropped, never turned into notSure.
  assert.match(
    step5Builder,
    /marketingHoursPerWeek: pickAllowedValue\(data\.marketingHoursPerWeek, MARKETING_HOURS_PER_WEEK_VALUES\),/,
  );
  assert.match(
    step5Builder,
    /deliveryDeadline: pickAllowedValue\(data\.deliveryDeadline, DELIVERY_DEADLINE_VALUES\),/,
  );
  assert.match(step5Builder, /normalizeCreativeCapabilities\(data\.creativeCapabilities\)/);
  assert.match(step5Builder, /creativeCapabilities: creativeCapabilities\.length \? creativeCapabilities : undefined,/);
  assert.match(
    step6Builder,
    /paybackWindow: pickAllowedValue\(data\.paybackWindow, PAYBACK_WINDOW_VALUES\),/,
  );

  for (const field of ['marketingHoursPerWeek', 'creativeCapabilities', 'deliveryDeadline']) {
    assert.match(goalsStepPayload, new RegExp(`\\b${field}:`), `Step 5 payload should send ${field}`);
  }
  assert.match(economicsStepPayload, /\bpaybackWindow:/, 'Step 6 payload should send paybackWindow');
});

test('a reopened goals step reads the goal and owner as saved', () => {
  // Mapped to the v1 values on read, they matched no option, so the form
  // replaced them with its first option and the next save overwrote them.
  const legacyStep5 = extract(
    adapterSource,
    /if \(stepKey === 'STEP_5'\) \{[\s\S]*?\n  \}\n/,
    'the step 5 read',
  );
  assert.match(legacyStep5, /primaryGoal: normalizeNullableString\(step5\.primaryGoal\)/);
  assert.match(legacyStep5, /marketingHandler: normalizeNullableString\(step5\.marketingHandler\)/);
  assert.doesNotMatch(adapterSource, /(PRIMARY_GOAL|MARKETING_HANDLER)_FROM_V2/);
});
