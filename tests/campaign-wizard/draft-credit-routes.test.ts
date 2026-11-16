import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMPAIGN_PLAN_ROUTE,
  campaignPlanRouteForDraft,
  safeReturnPath,
} from '../../shared/payments/campaign-entitlement.ts';

// V3-371 (2026-11-16): drafts are free; at submit without a credit the
// client goes to checkout and comes straight back to the draft. Checkout must
// never send anyone outside the app.

const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

test('the route to checkout carries the draft, and checkout reads it back to the same draft', () => {
  for (const id of ['cmw123', 'campaign-001', 'a_b-c']) {
    const route = campaignPlanRouteForDraft(id);
    assert.ok(route.startsWith(CAMPAIGN_PLAN_ROUTE));
    const returnTo = new URLSearchParams(route.split('?')[1]).get('returnTo');
    assert.equal(safeReturnPath(returnTo), `/app/campaigns?draftCampaignId=${id}&wizardStep=7`);
  }
  assert.equal(campaignPlanRouteForDraft(null), CAMPAIGN_PLAN_ROUTE);
  assert.equal(campaignPlanRouteForDraft(undefined), CAMPAIGN_PLAN_ROUTE);
});

test('property: checkout returns only to a path inside the app; anything else goes to the dashboard', () => {
  const fixed: Array<[string | null, string]> = [
    [null, '/app'],
    ['', '/app'],
    ['/app', '/app'],
    ['/app/campaigns?draftCampaignId=x&wizardStep=7', '/app/campaigns?draftCampaignId=x&wizardStep=7'],
    ['https://evil.example/app', '/app'],
    ['//evil.example/app', '/app'],
    ['/application', '/app'],
    ['/appx/../../evil', '/app'],
    ['/app\\..\\evil', '/app'],
    ['/app/\r\nset-cookie', '/app'],
    ['javascript:alert(1)', '/app'],
    ['/admin', '/app'],
  ];
  for (const [given, expected] of fixed) {
    assert.equal(safeReturnPath(given), expected, String(given));
  }
  const r = rng(371);
  const alphabet = ['/', 'a', 'p', '?', '&', '=', ':', '.', '\\', '\n', 'h', 't', 's', '@', '#', '%'];
  for (let run = 0; run < 20000; run += 1) {
    const length = Math.floor(r() * 14);
    let text = r() < 0.5 ? '/app' : '';
    for (let i = 0; i < length; i += 1) text += alphabet[Math.floor(r() * alphabet.length)];
    const out = safeReturnPath(text);
    assert.ok(out === '/app' || out === text, text);
    assert.ok(out === '/app' || out.startsWith('/app/') || out.startsWith('/app?'), text);
    assert.ok(!out.startsWith('//') && !out.includes('\\') && !/[\r\n]/.test(out), text);
  }
});
