import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSectionReviewWorkspaceDetail } from '../../shared/types/opsV2.ts';

// GET /api/v2/section-reviews/:runId/workspace groups its payload into tabs.
// The client Strategy and Overview tabs, and the reviewer run workspace, all
// read their sections from here, so an empty result shows "no strategy".

const workspacePayload = {
  pipelineRun: {
    pipelineRunId: 'run_v2_1',
    campaignId: 'camp_1',
    campaignTitle: 'Power Smiles new patients',
    campaignStatus: 'ACTIVE',
    status: 'COMPLETED',
    updatedAt: '2026-10-18T06:56:38.900Z',
  },
  permissions: { viewerRole: 'CLIENT', canApproveSections: false, canRequestSectionRevision: false },
  inputTab: { wizardIntakeSnapshot: { wizardIntakeSnapshotId: 'snap_1' }, intakeNormalization: null },
  sectionsTab: {
    selectedSectionCount: 2,
    approvedSectionCount: 2,
    allSelectedSectionsApproved: true,
    outputAssemblyBlocked: false,
    items: [
      {
        sectionId: 'section_01_executive_summary',
        sectionTitle: 'Executive Summary',
        marketId: null,
        sectionGenerationRecordId: 'gen_1',
        sectionReviewTaskId: 'task_1',
        sectionReviewStatus: 'APPROVED',
        revisionCount: 0,
        sectionContent: '## Executive Summary\n\n**Winning Angle**',
      },
      {
        sectionId: 'section_02_market_intent_analysis',
        sectionTitle: 'Market Intent Analysis',
        marketId: 'IN',
        sectionGenerationRecordId: 'gen_2',
        sectionReviewTaskId: 'task_2',
        sectionReviewStatus: 'PENDING',
        revisionCount: 1,
        sectionContent: '## Market Intent Analysis',
      },
    ],
  },
};

test('reads sections from sectionsTab.items', () => {
  const workspace = normalizeSectionReviewWorkspaceDetail(workspacePayload, 'fallback');

  assert.equal(workspace.sections.length, 2);
  assert.deepEqual(
    workspace.sections.map((section) => [section.sectionReviewTaskId, section.sectionTitle, section.marketId]),
    [
      ['task_1', 'Executive Summary', null],
      ['task_2', 'Market Intent Analysis', 'IN'],
    ],
  );
  assert.equal(workspace.sections[0].sectionContent, '## Executive Summary\n\n**Winning Angle**');
});

test('takes each section status from sectionReviewStatus', () => {
  const workspace = normalizeSectionReviewWorkspaceDetail(workspacePayload);

  assert.deepEqual(
    workspace.sections.map((section) => section.status),
    ['APPROVED', 'PENDING'],
  );
});

test('reads run and campaign fields from pipelineRun', () => {
  const workspace = normalizeSectionReviewWorkspaceDetail(workspacePayload, 'fallback');

  assert.equal(workspace.runId, 'run_v2_1');
  assert.equal(workspace.campaignId, 'camp_1');
  assert.equal(workspace.campaignTitle, 'Power Smiles new patients');
  assert.equal(workspace.campaignStatus, 'ACTIVE');
  assert.equal(workspace.updatedAt, '2026-10-18T06:56:38.900Z');
  assert.deepEqual(workspace.inputs, workspacePayload.inputTab);
});

test('still reads a flat sections list', () => {
  const workspace = normalizeSectionReviewWorkspaceDetail({
    runId: 'run_flat',
    sections: [{ sectionReviewTaskId: 'task_flat', status: 'PENDING', sectionContent: 'text' }],
  });

  assert.equal(workspace.runId, 'run_flat');
  assert.equal(workspace.sections.length, 1);
  assert.equal(workspace.sections[0].status, 'PENDING');
});
