"""Render the AdCendy report: cover page (no running header) + body pages, then merge."""
from playwright.sync_api import sync_playwright
from pypdf import PdfWriter, PdfReader
import pathlib, re
here = pathlib.Path(__file__).parent.resolve()
logo = re.sub(r'\s+', ' ', (here / "logo.svg").read_text()).replace('<svg ', '<svg style="height:15pt;width:auto;color:#1F1F1F;display:block" ')
MONO = "font-family:'Geist Mono',ui-monospace,monospace;font-size:6.8pt;letter-spacing:.06em;text-transform:uppercase;color:#6E6C66;"
header = f"""<div style="-webkit-print-color-adjust:exact;width:100%;padding:0 20mm;display:flex;justify-content:space-between;align-items:center;{MONO}">
{logo}<span>Huel · GB · Marketing strategy</span></div>"""
footer = f"""<div style="width:100%;padding:0 20mm;display:flex;justify-content:space-between;{MONO}color:#A6A6A2;">
<span>Prepared for Huel · Oct 2026 · Confidential</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto((here / "cover.html").as_uri()); pg.wait_for_load_state("networkidle"); pg.evaluate("document.fonts.ready")
    pg.pdf(path=str(here / "_cover.pdf"), print_background=True, prefer_css_page_size=True)
    pg.goto((here / "sample-section.html").as_uri()); pg.wait_for_load_state("networkidle"); pg.evaluate("document.fonts.ready")
    pg.pdf(path=str(here / "_body.pdf"), print_background=True, prefer_css_page_size=True,
           display_header_footer=True, header_template=header, footer_template=footer)
    b.close()
w = PdfWriter()
for f in ("_cover.pdf", "_body.pdf"):
    for page in PdfReader(str(here / f)).pages: w.add_page(page)
w.write(str(here / "adcendy-strategy-sample.pdf"))
for f in ("_cover.pdf", "_body.pdf"): (here / f).unlink()
