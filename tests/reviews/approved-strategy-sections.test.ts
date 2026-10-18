import assert from 'node:assert/strict';
import test from 'node:test';
import {
  approvedStrategySections,
  isIntelligenceSection,
} from '../../shared/components/strategy/approved-strategy-sections.ts';

const section = (callType: string, status: string, content: unknown) => ({
  sectionReviewTaskId: `task_${callType}`,
  callType,
  marketId: 'IN',
  title: callType,
  content,
  status,
});

test('keeps only approved sections that have text', () => {
  const sections = approvedStrategySections([
    section('section_01_executive_summary', 'APPROVED', '## Executive Summary'),
    section('section_02_market_intent_analysis', 'PENDING_REVIEW', '## Market Intent'),
    section('section_03_positioning', 'APPROVED', '   '),
    section('section_04_search_demand_landscape', 'APPROVED', { title: 'not markdown' }),
  ]);

  assert.deepEqual(
    sections.map((item) => item.callType),
    ['section_01_executive_summary'],
  );
  assert.deepEqual(approvedStrategySections(null), []);
});

test('picks the research sections by section id', () => {
  assert.deepEqual(
    [
      'section_01_executive_summary',
      'section_02_market_intent_analysis',
      'section_04_search_demand_landscape',
      'section_05_competitive_landscape',
      'section_06_opportunity_prioritization',
    ].filter((callType) => isIntelligenceSection({ callType })),
    ['section_02_market_intent_analysis', 'section_04_search_demand_landscape', 'section_05_competitive_landscape'],
  );
});
