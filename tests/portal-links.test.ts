import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// The Backend's emails link to these portal pages (adcendy-be-v4
// src/shared/portal-links-v2.ts, EMAILED_PORTAL_ROUTES_V2). Each must be a
// page this app serves, so no email points at a 404. Keep the two lists the
// same: a route added there is added here.
const EMAILED_PORTAL_ROUTES = [
  '/app/campaigns/[campaignId]/files',
  '/app/campaigns/[campaignId]/strategy',
  '/app/account/profile',
  // The payment link page (payment-links-v2.service.ts).
  '/pay/[key]',
];

/** The page file for a route, looking through route groups such as (app). */
function pageFileFor(route: string): string | null {
  for (const group of ['(app)', '(public)', '']) {
    const file = ['app', group, ...route.split('/').filter(Boolean), 'page.tsx'].filter(Boolean).join('/');
    if (existsSync(file)) return file;
  }
  return null;
}

test('every portal page the Backend emails a link to is a page this app serves', () => {
  for (const route of EMAILED_PORTAL_ROUTES) {
    assert.ok(pageFileFor(route), `no page for ${route}`);
  }
});

test('the check itself finds nothing for the address that used to 404', () => {
  assert.equal(pageFileFor('/campaigns/[campaignId]/documents'), null);
});
