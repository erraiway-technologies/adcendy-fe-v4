import type {
  MarkOutreachSentPayload,
  ProspectInputsPatch,
  ProspectOperatorFactPayload,
  ProspectScanDetail,
  ProspectScanListItem,
  ProspectScanSpend,
  ProspectScanSummary,
  ProspectSubmission,
  ProspectSubmitResult,
} from '../../types/prospectScans.ts';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NEUTRAL_LINE = 'I compared you with Grind on search and ads this week; happy to send what I found.';

// Local fixtures shaped like the Backend's prospect scan responses.
const scans: ProspectScanDetail[] = [
  {
    id: 'scan-mock-1',
    batchId: 'batch-mock',
    targetDomain: 'kissthehippo.com',
    competitorDomain: 'grind.co.uk',
    country: 'GB',
    status: 'READY',
    holdReason: null,
    observationLine: NEUTRAL_LINE,
    isFallback: true,
    scannedAt: '2026-10-19T12:00:00.000Z',
    targetName: 'Kiss the Hippo',
    competitorName: 'Grind',
    contactFirstName: null,
    businessType: 'company',
    whyNow: "you're hiring a marketing lead",
    whyNowUrl: null,
    categoryTerm: 'coffee beans | coffee subscription',
    operatorCategoryTerm: null,
    secondaryLine: null,
    costUsd: 0.21,
    facts: [
      {
        id: 'fact-mock-ads',
        kind: 'google_ads',
        state: 'unknown',
        source: 'api',
        reason: 'ad_count_not_the_public_figure',
        verifyUrl: 'https://adstransparency.google.com/?region=GB&domain=grind.co.uk&preset-date=Last+30+days',
        capturedAt: '2026-10-19T12:00:00.000Z',
        values: { kind: 'google_ads', competitorCount: 81, targetCount: 17, competitorLookedUpAs: 'grind.co.uk' },
      },
      {
        id: 'fact-mock-search',
        kind: 'search_presence',
        state: 'no_gap',
        source: 'api',
        reason: 'competitor_not_in_top_5',
        verifyUrl: 'https://www.google.com/search?q=coffee%20beans&gl=gb&num=20&pws=0',
        capturedAt: '2026-10-19T12:00:00.000Z',
        values: { kind: 'search_presence', term: 'coffee beans', competitorPosition: null, targetPosition: null },
      },
    ],
    inputsNeeded: [
      {
        kind: 'google_ads',
        priority: 'recommended',
        why: 'Grind looks ahead on Google ads, but the count we read is not the figure Google\'s public page shows, so it is not printed.',
        howTo: 'Open the link, read the ads figure shown for Grind (keep the "~" if the page shows one), then search the prospect on the same page and read theirs.',
        checkLink: 'https://adstransparency.google.com/?region=GB&domain=grind.co.uk&preset-date=Last+30+days',
      },
      {
        kind: 'pricing',
        priority: 'optional',
        why: 'Prices are never compared automatically: bundles must match exactly.',
        howTo: 'If the prospect and Grind sell the same bundle, enter both prices, units and currency.',
        checkLink: null,
      },
    ],
    outreachEmail: {
      status: 'drafted',
      subject: 'Kiss the Hippo vs Grind',
      body: `Hi there — saw you're hiring a marketing lead, so I compared Kiss the Hippo with Grind on search and ads in the UK this week; happy to send what I found.\n\nI build AdCendy; we turn research like this into a 90-day strategy in four days. No call, no charge.\n\nMridul`,
      sendable: true,
      notSendableReason: null,
      wordsAboveSignature: 46,
      isFallback: true,
      basedOn: null,
    },
    outreaches: [],
  },
];

const summaryOf = (items: ProspectScanDetail[]): ProspectScanSummary => {
  const byStatus: Record<string, number> = {};
  for (const scan of items) byStatus[scan.status] = (byStatus[scan.status] ?? 0) + 1;
  const ready = items.filter((scan) => scan.status === 'READY');
  const withFact = ready.filter((scan) => !scan.isFallback).length;
  return {
    total: items.length,
    byStatus,
    holdReasons: {},
    emailsDrafted: ready.length,
    withFact,
    neutral: ready.length - withFact,
    factRate: items.length ? withFact / items.length : null,
  };
};

const listItem = (scan: ProspectScanDetail): ProspectScanListItem => ({
  id: scan.id,
  batchId: scan.batchId,
  targetDomain: scan.targetDomain,
  competitorDomain: scan.competitorDomain,
  country: scan.country,
  status: scan.status,
  holdReason: scan.holdReason,
  observationLine: scan.observationLine,
  isFallback: scan.isFallback,
  scannedAt: scan.scannedAt,
});

function find(scanId: string): ProspectScanDetail {
  const scan = scans.find((candidate) => candidate.id === scanId);
  if (!scan) throw new Error('PROSPECT_SCAN_NOT_FOUND_V2');
  return scan;
}

export const prospectScansMockAdapter = {
  async list(query: { batchId?: string; status?: string }): Promise<ProspectScanListItem[]> {
    await delay(80);
    return scans
      .filter((scan) => !query.batchId || scan.batchId === query.batchId)
      .filter((scan) => !query.status || scan.status === query.status)
      .map(listItem);
  },

  async summary(batchId?: string): Promise<ProspectScanSummary> {
    await delay(60);
    return summaryOf(scans.filter((scan) => !batchId || scan.batchId === batchId));
  },

  async spend(): Promise<ProspectScanSpend> {
    await delay(40);
    return { spentUsd: scans.reduce((sum, scan) => sum + scan.costUsd, 0), capUsd: 20 };
  },

  async get(scanId: string): Promise<ProspectScanDetail> {
    await delay(60);
    return structuredClone(find(scanId));
  },

  async submit(prospects: ProspectSubmission[]): Promise<ProspectSubmitResult> {
    await delay(120);
    const batchId = `batch-mock-${scans.length + 1}`;
    const created: string[] = [];
    for (const prospect of prospects) {
      const id = `scan-mock-${scans.length + 1}`;
      scans.push({
        ...structuredClone(scans[0]),
        id,
        batchId,
        targetDomain: prospect.targetDomain,
        competitorDomain: prospect.competitorDomain,
        competitorName: prospect.competitorName ?? prospect.competitorDomain,
        targetName: prospect.targetName ?? null,
        country: prospect.country,
        businessType: prospect.businessType,
        whyNow: prospect.whyNow ?? null,
        status: 'PENDING',
        observationLine: null,
        outreaches: [],
      });
      created.push(id);
    }
    return { batchId, created, existing: [] };
  },

  async addFact(scanId: string, payload: ProspectOperatorFactPayload): Promise<ProspectScanDetail> {
    await delay(80);
    const scan = find(scanId);
    scan.facts = scan.facts.filter((fact) => !(fact.kind === payload.kind && fact.source === 'operator'));
    scan.facts.push({
      id: `fact-mock-${scan.facts.length + 1}`,
      kind: payload.kind,
      state: 'gap',
      source: 'operator',
      reason: 'entered_by_hand',
      verifyUrl: payload.verifyUrl,
      capturedAt: new Date().toISOString(),
      values: { kind: payload.kind, ...payload.values },
    });
    scan.inputsNeeded = scan.inputsNeeded.filter((need) => need.kind !== payload.kind);
    return structuredClone(scan);
  },

  async updateInputs(
    scanId: string,
    patch: ProspectInputsPatch,
  ): Promise<ProspectScanDetail & { rescanNeeded: boolean }> {
    await delay(80);
    const scan = find(scanId);
    const rescanNeeded = patch.categoryTerm !== undefined && patch.categoryTerm !== scan.operatorCategoryTerm;
    Object.assign(scan, {
      ...(patch.targetName !== undefined ? { targetName: patch.targetName || null } : {}),
      ...(patch.competitorName ? { competitorName: patch.competitorName } : {}),
      ...(patch.contactFirstName !== undefined ? { contactFirstName: patch.contactFirstName || null } : {}),
      ...(patch.whyNow !== undefined ? { whyNow: patch.whyNow || null } : {}),
      ...(patch.businessType ? { businessType: patch.businessType } : {}),
      ...(patch.categoryTerm !== undefined ? { operatorCategoryTerm: patch.categoryTerm || null } : {}),
    });
    return { ...structuredClone(scan), rescanNeeded };
  },

  async rescan(scanId: string): Promise<void> {
    await delay(60);
    find(scanId).status = 'PENDING';
  },

  async recheck(scanId: string): Promise<void> {
    await delay(60);
    find(scanId).status = 'RECHECK_PENDING';
  },

  async markSent(scanId: string, payload: MarkOutreachSentPayload): Promise<void> {
    await delay(80);
    const scan = find(scanId);
    if (scan.outreaches.some((outreach) => outreach.status === 'SENT') && !payload.allowRepeat) {
      throw new Error('PROSPECT_OUTREACH_ALREADY_SENT_V2');
    }
    scan.outreaches.unshift({
      id: `outreach-mock-${scan.outreaches.length + 1}`,
      subject: scan.outreachEmail?.subject ?? '',
      body: scan.outreachEmail?.body ?? '',
      isFallback: scan.isFallback,
      status: 'SENT',
      recipientEmail: payload.recipientEmail ?? null,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },

  async exportCsv(): Promise<string> {
    await delay(60);
    return 'scanId,targetDomain,emailSubject\nscan-mock-1,kissthehippo.com,Kiss the Hippo vs Grind';
  },
};
