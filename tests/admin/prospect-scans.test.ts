import assert from "node:assert/strict";
import test from "node:test";
import {
  OPERATOR_FACT_FIELDS,
  buildOperatorValues,
  describeFactFigures,
  normalizeProspectScanDetail,
  normalizeProspectScanList,
  normalizeProspectScanSummary,
  PROSPECT_CARRIED_COLUMNS,
  PROSPECT_COLUMNS,
  emptyProspectDraftRow,
  readProspectDraftRows,
  type ProspectDraftRow,
  type ProspectOperatorFactKind,
} from "../../shared/types/prospectScans.ts";
import { prospectScansMockAdapter } from "../../shared/api/mock/prospectScans.mock.ts";

const row = (cells: Partial<ProspectDraftRow>): ProspectDraftRow => ({ ...emptyProspectDraftRow(), ...cells });
const GOOD = { targetDomain: "a.com", competitorDomain: "b.com", country: "gb", businessType: "company", whyNow: "you're hiring" };

test("table rows: a filled row is read, an unstarted row is skipped, a bad row is reported by its row number", () => {
  const { rows, errors, invalidCells } = readProspectDraftRows([
    row({ ...GOOD, targetName: "Pip & Nut", whyNow: " you're hiring a Head of Growth " }),
    row({ country: "GB", businessType: "company" }),
    row({ ...GOOD, competitorDomain: "" }),
    row({ ...GOOD, country: "United Kingdom", businessType: "limited" }),
  ]);
  assert.deepEqual(rows, [
    { targetDomain: "a.com", competitorDomain: "b.com", country: "GB", businessType: "company", whyNow: "you're hiring a Head of Growth", targetName: "Pip & Nut" },
  ]);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^Row 3: Competitor website is empty/);
  assert.match(errors[1], /^Row 4: .*Country must be two letters.*Business type must be/);
  assert.deepEqual(
    invalidCells.map((problem) => `${problem.row}:${problem.column}`),
    ["2:competitorDomain", "3:country", "3:businessType"],
  );
});

test("the table header names every field a submission carries, required ones first-class", () => {
  const names = PROSPECT_COLUMNS.map((column) => column.name).sort();
  assert.deepEqual(names, Object.keys(emptyProspectDraftRow()).sort());
  const required = PROSPECT_COLUMNS.filter((column) => column.required).map((column) => column.name).sort();
  assert.deepEqual(required, ["businessType", "competitorDomain", "country", "targetDomain"]);
});

test("every row read carries all required fields, and every other non-empty row is reported, for any mix of rows", () => {
  const candidates = [
    row(GOOD),
    row({ ...GOOD, targetDomain: "" }),
    row({ ...GOOD, country: "GBR" }),
    row({ ...GOOD, businessType: "nonsense" }),
    row({}),
    row({ country: "GB", businessType: "company" }),
    row({ ...GOOD, businessType: "sole_trader", country: "ie" }),
    row({ ...GOOD, whyNow: "" }),
  ];
  for (let mask = 1; mask < 1 << candidates.length; mask += 1) {
    const chosen = candidates.filter((_, index) => mask & (1 << index));
    const started = chosen.filter((draft) =>
      Object.entries(draft).some(([name, value]) => !(PROSPECT_CARRIED_COLUMNS as readonly string[]).includes(name) && value.trim()),
    );
    const { rows, errors, invalidCells } = readProspectDraftRows(chosen);
    assert.equal(rows.length + errors.length, started.length);
    assert.equal(new Set(invalidCells.map((problem) => problem.row)).size, errors.length);
    for (const read of rows) {
      for (const column of PROSPECT_COLUMNS.filter((spec) => spec.required)) {
        assert.ok(read[column.name], `${column.name} present`);
      }
      assert.match(read.country, /^[A-Z]{2}$/);
      // An optional cell left empty is not sent at all, so "why now" is absent, never "".
      assert.ok(Object.values(read).every((value) => value !== ""), "no empty value sent");
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
