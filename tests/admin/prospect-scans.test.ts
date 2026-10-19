import assert from "node:assert/strict";
import test from "node:test";
import {
  OPERATOR_FACT_FIELDS,
  buildOperatorValues,
  describeFactFigures,
  normalizeProspectScanDetail,
  normalizeProspectScanList,
  normalizeProspectScanSummary,
  parseProspectRows,
  type ProspectOperatorFactKind,
} from "../../shared/types/prospectScans.ts";
import { prospectScansMockAdapter } from "../../shared/api/mock/prospectScans.mock.ts";

const HEADER = "targetDomain\tcompetitorDomain\tcountry\tbusinessType\thiringSignal\ttargetName";

test("pasted rows: a valid row is read, every bad row is reported by line and never guessed at", () => {
  const { rows, errors } = parseProspectRows(
    [
      HEADER,
      "pipandnut.com\tmeridianfoods.co.uk\tgb\tcompany\tyou're hiring a Head of Growth\tPip & Nut",
      "bad.com\t\tGB\tcompany\tyou're hiring",
      "bad2.com\tx.com\tUnited Kingdom\tlimited\tyou're hiring",
    ].join("\n"),
  );
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    targetDomain: "pipandnut.com",
    competitorDomain: "meridianfoods.co.uk",
    country: "GB",
    businessType: "company",
    hiringSignal: "you're hiring a Head of Growth",
    targetName: "Pip & Nut",
  });
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^Line 3: competitorDomain is empty/);
  assert.match(errors[1], /^Line 4: .*country must be two letters.*businessType must be/);
});

test("pasted rows: comma-separated with quoted commas, and a header missing a required column", () => {
  const csv = parseProspectRows(
    'targetDomain,competitorDomain,country,businessType,hiringSignal\na.com,b.com,IE,Sole Trader,"you\'re hiring a writer, part-time"',
  );
  assert.equal(csv.errors.length, 0);
  assert.equal(csv.rows[0].businessType, "sole_trader");
  assert.equal(csv.rows[0].hiringSignal, "you're hiring a writer, part-time");
  const missing = parseProspectRows("targetDomain,country\na.com,GB");
  assert.equal(missing.rows.length, 0);
  assert.match(missing.errors[0], /missing: competitorDomain, businessType, hiringSignal/);
});

test("every row read carries all required fields, for any mix of good and bad lines", () => {
  const lines = [
    "a.com\tb.com\tGB\tcompany\tyou're hiring",
    "\tb.com\tGB\tcompany\tyou're hiring",
    "a.com\tb.com\tGBR\tcompany\tyou're hiring",
    "a.com\tb.com\tUS\tpartnership\tyou're hiring",
    "a.com\tb.com\tIN\tnonsense\tyou're hiring",
  ];
  for (let mask = 1; mask < 1 << lines.length; mask += 1) {
    const chosen = lines.filter((_, index) => mask & (1 << index));
    const { rows, errors } = parseProspectRows([HEADER, ...chosen].join("\n"));
    assert.equal(rows.length + errors.length, chosen.length);
    for (const row of rows) {
      for (const field of ["targetDomain", "competitorDomain", "country", "businessType", "hiringSignal"] as const) {
        assert.ok(row[field], `${field} present`);
      }
      assert.match(row.country, /^[A-Z]{2}$/);
    }
  }
});

test("hand readings: required fields are required, optional ones are sent as null, a yes/no shown as No is no", () => {
  for (const kind of Object.keys(OPERATOR_FACT_FIELDS) as ProspectOperatorFactKind[]) {
    const empty = buildOperatorValues(kind, {});
    const required = OPERATOR_FACT_FIELDS[kind].filter((field) => !field.nullable && field.type !== "boolean");
    assert.equal(empty.problems.length, required.length, `${kind}: one problem per required field`);
    assert.equal(empty.values, required.length ? null : empty.values);
  }
  const google = buildOperatorValues("google_ads", {
    competitorCount: "200",
    competitorCountApprox: "true",
    targetCount: "11",
  });
  assert.deepEqual(google.values, {
    competitorCount: 200,
    competitorCountApprox: true,
    targetCount: 11,
    targetCountApprox: false,
    targetEverAdvertised: null,
  });
  const search = buildOperatorValues("search_presence", { term: "dog treats", competitorPosition: "1" });
  assert.deepEqual(search.values, { term: "dog treats", competitorPosition: 1, targetPosition: null });
  assert.deepEqual(buildOperatorValues("search_presence", { term: "x", competitorPosition: "25" }).values, null);
  assert.deepEqual(buildOperatorValues("meta_ads", { competitorActive: "-1", targetActive: "2" }).values, null);
});

test("readers keep what they understand and drop what they do not", () => {
  assert.deepEqual(normalizeProspectScanList([null, { nope: 1 }, { id: "s1", status: "WEIRD" }]).map((s) => s.status), ["PENDING"]);
  const detail = normalizeProspectScanDetail({
    id: "s1",
    status: "READY",
    targetDomain: "a.com",
    competitorDomain: "b.com",
    facts: [{ id: "f1", kind: "google_ads", state: "gap", source: "operator", valuesJson: { kind: "google_ads", competitorCount: 200, competitorCountApprox: true, targetCount: 3, readFrom: "public_page" } }, { id: "f2", kind: "unknown_kind" }],
    inputsNeeded: [{ kind: "meta_ads", priority: "recommended", why: "w", howTo: "h" }, { kind: "bogus" }],
    outreachEmail: { status: "drafted", subject: "A vs B", body: "Hi", sendable: true },
    outreaches: [{ id: "o1", status: "SENT", subject: "A vs B", body: "Hi", sentAt: "2026-10-19T00:00:00Z" }],
  });
  assert.ok(detail);
  assert.equal(detail.competitorName, "b.com");
  assert.equal(detail.facts.length, 1);
  assert.equal(describeFactFigures(detail.facts[0]), "competitor ~200, prospect 3 (public page)");
  assert.equal(detail.inputsNeeded.length, 1);
  assert.equal(detail.outreaches[0].status, "SENT");
  assert.equal(normalizeProspectScanSummary({ factRate: 0.2, withFact: 4 }).factRate, 0.2);
});

test("a reading that saw nothing shows its reason, and a floor count shows +", () => {
  const detail = normalizeProspectScanDetail({
    id: "s1",
    facts: [
      { id: "f1", kind: "meta_ads", state: "unknown", reason: "meta_api_shows_no_commercial_ads_here_enter_by_hand", valuesJson: {} },
      { id: "f2", kind: "google_ads", state: "no_gap", reason: "x", valuesJson: { kind: "google_ads", competitorCount: 100, competitorCountExact: false, targetCount: 0, targetCountExact: true } },
    ],
  });
  assert.ok(detail);
  assert.equal(detail.facts[0].values, null);
  assert.equal(describeFactFigures(detail.facts[0]), "");
  assert.equal(describeFactFigures(detail.facts[1]), "competitor 100+, prospect 0");
});

test("mock: a second send is refused unless it is meant", async () => {
  const [first] = await prospectScansMockAdapter.list({});
  await prospectScansMockAdapter.markSent(first.id, { recipientEmail: "a@b.com" });
  await assert.rejects(() => prospectScansMockAdapter.markSent(first.id, {}), /ALREADY_SENT/);
  await prospectScansMockAdapter.markSent(first.id, { allowRepeat: true });
  const detail = await prospectScansMockAdapter.get(first.id);
  assert.equal(detail.outreaches.filter((outreach) => outreach.status === "SENT").length, 2);
});
