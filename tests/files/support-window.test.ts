import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { supportWindow } from "../../shared/support/support-window.ts";

const delivered = "2026-10-01T10:00:00.000Z";
const day = (n: number) => new Date(Date.parse(delivered) + n * 24 * 60 * 60 * 1000);

test("no dated document means nothing was delivered", () => {
  assert.equal(supportWindow([]), null);
  assert.equal(supportWindow([{ availableAt: null }]), null);
});

test("a document not yet visible is not a delivery", () => {
  assert.equal(supportWindow([{ availableAt: delivered }], day(-1)), null);
});

test("delivery is the earliest visible document, and the windows run from it", () => {
  const window = supportWindow(
    [{ availableAt: day(2).toISOString() }, { availableAt: delivered }, { availableAt: null }],
    day(3),
  );
  assert.ok(window);
  assert.equal(window.deliveredAt.toISOString(), delivered);
  assert.equal(window.revisionRequestBy.toISOString(), day(14).toISOString());
  assert.equal(window.endsAt.toISOString(), day(30).toISOString());
  assert.equal(window.open, true);
  assert.equal(window.revisionOpen, true);
});

test("the revision closes at 14 days and the window at 30", () => {
  const docs = [{ availableAt: delivered }];
  assert.equal(supportWindow(docs, day(14))?.revisionOpen, false);
  assert.equal(supportWindow(docs, day(14))?.open, true);
  assert.equal(supportWindow(docs, day(30))?.open, false);
});

test("the numbers are the Terms of Service's", () => {
  const terms = readFileSync("shared/marketing/business-terms.ts", "utf8");
  const window = readFileSync("shared/support/support-window.ts", "utf8");
  assert.match(terms, /windowDays: 30,/);
  assert.match(terms, /revisionRequestDays: 14,/);
  assert.match(window, /SUPPORT_WINDOW_DAYS = 30;/);
  assert.match(window, /REVISION_REQUEST_DAYS = 14;/);
});
