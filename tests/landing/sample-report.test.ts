import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_REPORT, chapterNumber } from "../../features/landing/content/sample-report.ts";

// The reader draws bars and dots straight from these numbers; content swapped
// in later must stay inside the ranges the layouts can show.

test("the sample report has a chapter for every question that cites one", () => {
  assert.equal(SAMPLE_REPORT.chapters.length, 5);
  assert.deepEqual(
    SAMPLE_REPORT.chapters.map((_, i) => chapterNumber(i)),
    ["01", "02", "03", "04", "05"],
  );
});

test("page numbers run forward through the document", () => {
  const pages = SAMPLE_REPORT.chapters.map((chapter) => chapter.pageNumber);
  assert.deepEqual([...pages].sort((a, b) => a - b), pages);
});

test("every drawn value is within what its layout can show", () => {
  const problems: string[] = [];
  for (const { title, page } of SAMPLE_REPORT.chapters) {
    switch (page.kind) {
      case "snapshot":
        if (page.demandTrend.some((v) => v < 0 || v > 100)) problems.push(`${title}: trend outside 0–100`);
        break;
      case "competitors":
        if (page.competitors.some((c) => c.adActivity < 0 || c.adActivity > 3)) problems.push(`${title}: activity outside 0–3`);
        break;
      case "channels": {
        if (page.channels.some((c) => c.share < 0 || c.share > 100)) problems.push(`${title}: share outside 0–100`);
        const total = page.channels.reduce((sum, c) => sum + c.share, 0);
        if (total !== 100) problems.push(`${title}: shares add up to ${total}%`);
        break;
      }
      default:
        break;
    }
  }
  assert.deepEqual(problems, []);
});
