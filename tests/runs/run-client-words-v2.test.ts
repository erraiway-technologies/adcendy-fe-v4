import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeRunPhaseV2,
  RUN_ACTION_CLIENT_WORDS_V2,
  RUN_PHASE_CLIENT_WORDS_V2,
} from '../../shared/run/run-client-words-v2.ts';

/**
 * V3-112: every phase the backend can report as a run's current phase
 * (adcendy-be-v4: `PIPELINE_PHASE_ORDER_V2`, the competitive grounding
 * sub-phases, intake, section review and the kit). A phase the backend adds
 * must be added here and to the table, or the client sees no phase line.
 */
const BACKEND_RUN_PHASES_V2 = [
  'intake_normalization_v2',
  'client_context_assembly_v2',
  'discovery_sprint_v2',
  'serp_competitor_identification_v2',
  'competitive_grounding_v2',
  'competitive_discovery_v2',
  'competitive_candidate_verification_v2',
  'competitor_pre_scoring_v2',
  'competitive_tier_review_v2',
  'competitive_evidence_collection_v2',
  'competitive_matrix_v2',
  'gap_analysis_v2',
  'diagnostic_checkpoint_v2',
  'channel_selection_v2',
  'intelligence_manifest_v2',
  'narrative_agent_stage0_v2',
  'section_selection_v2',
  'section_generation_v2',
  'section_review_v2',
  'layer2_formatter_v2',
  'output_assembly_v2',
  'deliverable_kit_assembly_v2',
];

test('every phase a run can report has words a client reads', () => {
  assert.deepEqual(
    Object.keys(RUN_PHASE_CLIENT_WORDS_V2).sort(),
    [...BACKEND_RUN_PHASES_V2].sort(),
  );
  for (const phase of BACKEND_RUN_PHASES_V2) {
    const words = describeRunPhaseV2(phase);
    assert.ok(words, phase);
    assert.doesNotMatch(words, /_|v2|\b[A-Z]{2,}\b/, phase);
  }
});

test('a phase it does not know shows nothing, never its key', () => {
  assert.equal(describeRunPhaseV2('some_new_phase_v2'), null);
  assert.equal(describeRunPhaseV2(null), null);
});

test('every required action is said in plain words, or not at all', () => {
  assert.deepEqual(Object.keys(RUN_ACTION_CLIENT_WORDS_V2).sort(), [
    'CONTACT_SUPPORT',
    'NONE',
    'RETRY_AVAILABLE',
    'REVIEW_REQUIRED',
    'WAIT',
  ]);
  for (const words of Object.values(RUN_ACTION_CLIENT_WORDS_V2)) {
    if (words !== null) {
      assert.doesNotMatch(words, /_|\b[A-Z]{2,}\b/);
    }
  }
  assert.equal(RUN_ACTION_CLIENT_WORDS_V2.NONE, null);
});
