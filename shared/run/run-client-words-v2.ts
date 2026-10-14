import type { PipelineRunRequiredActionV2 } from '../types/runsV2.ts';

/**
 * What a client reads about a run while it works (V3-112).
 *
 * The run page printed the run's internal state: "BLOCKED AWAITING
 * REVIEW", "Phase: intake_normalization_v2", "Action: REVIEW REQUIRED". Every
 * phase the pipeline can report has a plain description here; one this table
 * does not know shows no phase line rather than its key. The test holds the
 * backend's phase list against it.
 */
export const RUN_PHASE_CLIENT_WORDS_V2: Record<string, string> = {
  intake_normalization_v2: 'Checking your answers',
  client_context_assembly_v2: 'Reading your business',
  discovery_sprint_v2: 'Researching what your customers search for',
  serp_competitor_identification_v2: 'Finding your competitors',
  competitive_grounding_v2: 'Studying your competitors',
  competitive_discovery_v2: 'Studying your competitors',
  competitive_candidate_verification_v2: 'Checking each competitor',
  competitor_pre_scoring_v2: 'Ranking your competitors',
  competitive_tier_review_v2: 'Ranking your competitors',
  competitive_evidence_collection_v2: 'Gathering evidence on your competitors',
  competitive_matrix_v2: 'Comparing your competitors',
  gap_analysis_v2: 'Finding the openings in your market',
  diagnostic_checkpoint_v2: 'Checking the research',
  channel_selection_v2: 'Choosing your channels',
  intelligence_manifest_v2: 'Bringing the research together',
  narrative_agent_stage0_v2: "Shaping the plan's argument",
  section_selection_v2: 'Planning your strategy document',
  section_generation_v2: 'Writing your strategy',
  section_review_v2: 'Reviewing your strategy',
  layer2_formatter_v2: 'Polishing the writing',
  output_assembly_v2: 'Building your documents',
  deliverable_kit_assembly_v2: 'Preparing your files',
};

/** The phase in the client's words, or null for one the table does not know. */
export function describeRunPhaseV2(phase: string | null | undefined) {
  return phase ? (RUN_PHASE_CLIENT_WORDS_V2[phase] ?? null) : null;
}

/** What the client needs to do, if anything; null when nothing is asked. */
export const RUN_ACTION_CLIENT_WORDS_V2: Record<
  PipelineRunRequiredActionV2,
  string | null
> = {
  WAIT: 'Nothing is needed from you; this page updates as it works.',
  REVIEW_REQUIRED:
    'Paused for a review. We will let you know if anything is needed from you.',
  RETRY_AVAILABLE: 'It stopped part-way; you can restart it from where it stopped.',
  CONTACT_SUPPORT: 'It could not finish. Please contact support.',
  NONE: null,
};
