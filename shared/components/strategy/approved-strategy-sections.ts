export interface StrategySectionLike {
  sectionReviewTaskId: string;
  callType: string;
  marketId: string | null;
  title: string;
  content: unknown;
  status: string;
}

export type ApprovedStrategySection<T extends StrategySectionLike> = T & { content: string };

// What a client is shown of a strategy: the approved sections that have text.
export function approvedStrategySections<T extends StrategySectionLike>(
  sections: T[] | null | undefined,
): ApprovedStrategySection<T>[] {
  return (sections ?? []).filter(
    (section): section is ApprovedStrategySection<T> =>
      section.status === 'APPROVED' &&
      typeof section.content === 'string' &&
      section.content.trim().length > 0,
  );
}

// The sections built from market research, by the section ids the pipeline
// gives them (section_02_market_intent_analysis, ...), in strategy order.
const INTELLIGENCE_SECTION_KEYS = ['market_intent_analysis', 'search_demand_landscape', 'competitive_landscape'];

export function isIntelligenceSection(section: { callType: string }) {
  return INTELLIGENCE_SECTION_KEYS.some((key) => section.callType.endsWith(key));
}
