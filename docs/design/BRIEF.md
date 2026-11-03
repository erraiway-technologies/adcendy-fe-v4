# Task: restyle the strategy-report PDF to the AdCendy v2 design

## Goal
Make every page of the generated strategy PDF use the v2 design in this folder. The design matches adcendy.com: warm paper background, near-black ink, Outfit + Geist Mono, one dark cover page. **Only presentation changes. Do not change any report wording, section order or pipeline logic.**

`adcendy-strategy-sample.pdf` is the visual target. Compare your output against it page by page.

## Files in this folder
| File | Purpose |
|---|---|
| `adcendy-report.css` | The stylesheet. Use as is; adjust only if something breaks. |
| `fonts/*.woff2` | Outfit 300–600, Geist Mono 400–500 (OFL, from npm `@fontsource/outfit`, `@fontsource/geist-mono`). |
| `logo.svg` | Wordmark, `fill="currentColor"` (cream on the cover, ink in the header). |
| `cover.html` | Cover page template. |
| `sample-section.html` | One section showing every component and its exact markup. |
| `render.py` | Reference render (Playwright, Python). Port the logic to our renderer; don't add Python to the backend. |
| `adcendy-strategy-sample.pdf` | Target output. |

## Steps
1. **Find our current PDF renderer** (HTML → PDF; likely Puppeteer/Playwright) and the HTML template(s) it renders. Tell me which files you changed.
2. **Replace the report stylesheet** with `adcendy-report.css`. Serve `fonts/` beside it, with URLs relative to the CSS. Wait for `document.fonts.ready` before printing.
3. **Install Outfit and Geist Mono as system fonts in the render container** (Dockerfile). The running header and footer templates can't load web fonts, so without this they fall back to a generic font.
4. **Cover page:** render `cover.html` (filled with client name, market, quarter and date) as its own PDF with zero margins and no header or footer. Render the body with `displayHeaderFooter: true` and the header and footer templates from `render.py`, with inline styles and `-webkit-print-color-adjust: exact`. Merge the cover first (pdf-lib in Node).
5. **Page settings:** A4, `printBackground: true`, `preferCSSPageSize: true`. The full-bleed paper colour comes from `@page { background: #F4F3EF }` in the CSS; don't remove it.
6. **Map the existing section markup to these classes:**
   - section wrapper `.section` (each starts a new page)
   - top line `.meta-row` (mono "SECTION 02 · NAME" left, "CLIENT · MARKET" right)
   - `h1`, then the section's one-line summary as `p.lead`
   - subheadings `h2` with `<span class="idx">2.1</span>`
   - body `p`, `ul`, `ol`
   - tables: plain `table` with `thead`; numeric columns `td.num`
   - statuses: `span.chip` plus `.good`, `.watch` or `.risk`
   - risk or note blocks: `.callout` (decision), `.callout.watch`, `.callout.risk`, each with a `.eyebrow` label
7. **Structured blocks** (`.kpis`, `.cards`, `.bars`, `.flow`) render only when the section data already contains structured values: numbers with labels, stages, query + volume. **Do not invent or derive data to fill them.** If a section has no such data, it renders as plain prose. List which sections currently have the data for each block.
8. **Pagination:** headings never end a page (`break-after: avoid` is in the CSS). Wrap each heading together with the block it introduces in `.keep`. Tables, cards, flows and callouts never split.

## Done when
- [ ] Every page has the paper background edge to edge, with no white margins.
- [ ] The cover is page 1 with no running header; body pages show the logo header and "Prepared for … · Confidential — n / N" footer.
- [ ] Outfit and Geist Mono render in the body, header and footer (check with `pdffonts output.pdf`).
- [ ] No heading sits alone at the bottom of a page; no table or card is split across pages.
- [ ] Report text is byte-for-byte unchanged from before (diff the extracted text).
- [ ] Regenerate the Huel GB report and attach page images of the cover, one prose-only section and one section with tables or cards.

## Do not
- Change prompts, pipeline stages or report wording.
- Add new colours. The only accents are clay `#B9785A` (watch), slate `#5F6B85` (second chart series), red `#B4473F` (risk) and green `#4F7A5A` (positive status).
- Load fonts from Google Fonts at render time (the server may have no outbound access).
