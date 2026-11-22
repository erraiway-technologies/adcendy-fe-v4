import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const realAdapterSource = fs.readFileSync(
  path.resolve(process.cwd(), 'shared', 'api', 'real', 'opsV2.real.ts'),
  'utf8',
);
const repositorySource = fs.readFileSync(
  path.resolve(process.cwd(), 'shared', 'api', 'repositories', 'opsV2.repo.ts'),
  'utf8',
);
const adminCampaignSource = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'app',
    '(app)',
    'app',
    'admin',
    'campaigns',
    '[campaignId]',
    'page.tsx',
  ),
  'utf8',
);

test('complete-kit action posts the generated request contract to the run-scoped admin route', () => {
  assert.match(
    realAdapterSource,
    /`\/api\/v2\/admin\/runs\/\$\{runId\}\/deliverable-kits`/,
  );
  assert.match(realAdapterSource, /body: payload/);
  assert.match(repositorySource, /generateAdminDeliverableKit/);
  assert.match(repositorySource, /GenerateDeliverableKitV2Payload/);
  assert.match(repositorySource, /QueuedDeliverableKitV2/);
});

test('admin UI exposes approval-gated kit generation and explicit owner notification control', () => {
  assert.match(adminCampaignSource, /label="Generate Complete Kit"/);
  assert.match(adminCampaignSource, /badge="5 documents"/);
  assert.match(adminCampaignSource, /Notify the campaign owner\?/);
  assert.match(adminCampaignSource, /handleGenerateDeliverableKit\(true\)/);
  assert.match(adminCampaignSource, /handleGenerateDeliverableKit\(false\)/);
  assert.match(adminCampaignSource, /Generate and notify owner/);
  assert.match(adminCampaignSource, /Generate without email/);
});

// V3-285 (operator decision 2026-11-05): an assembled kit waits for release;
// the admin reads its findings sheet, then releases it.
const releasePanelSource = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'shared',
    'components',
    'ops',
    'DeliverableKitReleasePanel.tsx',
  ),
  'utf8',
);

test('the release gate reads the kit review and posts the kit read on the sheet', () => {
  assert.match(
    realAdapterSource,
    /`\/api\/v2\/admin\/runs\/\$\{runId\}\/deliverable-kit\/review`/,
  );
  assert.match(
    realAdapterSource,
    /`\/api\/v2\/admin\/runs\/\$\{runId\}\/deliverable-kit\/release`/,
  );
  assert.match(repositorySource, /getAdminDeliverableKitReview/);
  assert.match(repositorySource, /releaseAdminDeliverableKit/);
  assert.match(repositorySource, /DeliverableKitReleaseReviewV2/);
  assert.match(repositorySource, /ReleaseDeliverableKitV2Payload/);
});

test('the admin page shows the findings sheet before the release button', () => {
  assert.match(adminCampaignSource, /<DeliverableKitReleasePanel runId=\{latestRunId\} \/>/);
  const sheetAt = releasePanelSource.indexOf('review.sheetMarkdown');
  const buttonAt = releasePanelSource.indexOf('Release to client');
  assert.ok(sheetAt > 0 && buttonAt > sheetAt);
  assert.match(releasePanelSource, /Release this kit to the client\?/);
  assert.match(releasePanelSource, /review\?\.kitGenerationId/);
});

// V3-448: the admin downloads the kit's files - each format of each document,
// or all of them as one archive - released or not.
test('kit downloads use the run-scoped download and archive routes', () => {
  assert.match(
    realAdapterSource,
    /`\/api\/v2\/admin\/runs\/\$\{runId\}\/deliverable-kit\/download`/,
  );
  assert.match(
    realAdapterSource,
    /`\/api\/v2\/admin\/runs\/\$\{runId\}\/deliverable-kit\/archive`/,
  );
  assert.match(repositorySource, /getAdminDeliverableKitFileDownload/);
  assert.match(repositorySource, /downloadAdminDeliverableKitArchive/);
});

test('the release panel offers every stored format and a download of the whole kit', () => {
  for (const label of ["pdf: 'PDF'", "markdown: 'Markdown'", "notion: 'Notion'", "csv: 'CSV'"]) {
    assert.ok(releasePanelSource.includes(label), label);
  }
  assert.match(releasePanelSource, /document\.files\.map/);
  assert.match(releasePanelSource, /Download all \(\.zip\)/);
  // Downloads do not wait for release: they sit outside the release-only branch.
  const downloadsAt = releasePanelSource.indexOf('Download all (.zip)');
  const releaseOnlyAt = releasePanelSource.indexOf("review.state === 'awaiting_release' ?");
  assert.ok(downloadsAt > 0 && releaseOnlyAt > downloadsAt);
});
