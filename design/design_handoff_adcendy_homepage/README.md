# Handoff: AdCendy Homepage (v5)

## Overview
A redesigned marketing homepage for AdCendy (www.adcendy.com) — a service that delivers a human-reviewed, market-intelligence-based marketing strategy (one market = one country, one-time fee, delivered in 4 business days). The page is dark, calm and minimal: an animated "dusk ridges" hero, then a report reader, an FAQ-style question list, a 4-day timeline, pricing, and a closing CTA.

## About the Design Files
`AdCendy Home v5.dc.html` is a **design reference built in HTML** — a prototype showing intended look, copy and behavior. It is **not production code to copy**. Recreate it in the target codebase's existing stack (e.g. Next.js/React + Tailwind, or whatever adcendy.com uses), following its conventions. If no stack exists, Next.js (App Router) + Tailwind + Framer Motion is a good fit.

Open the file in a browser to see it running. The template is between `<x-dc>` tags; the behavior lives in the `class Component` script (renderVals = data, componentDidMount = animations).

## Fidelity
**High-fidelity.** Recreate colors, type, spacing, copy and motion as specified. All numbers inside the sample report pages (48k, +18%, Competitor A…, £2.10, etc.) are **placeholders** — build them as data so real report content can be swapped in later.

## Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| bg | `#232323` | Page background |
| surface | `#282828` | Pricing card |
| surface-2 | `#363636` | Secondary buttons |
| text | `#F5F5F4` / `#FFFFFF` | Primary text / headlines |
| text-2 | `#C4C4C0` | Body on dark |
| text-3 | `#A6A6A2` | Supporting copy |
| text-4 | `#7E7E7A` / `#8A8A86` | Labels, mono meta, inactive |
| hairline | `rgba(255,255,255,.08)` – `.14` | Dividers, borders |
| paper | `#ECEAE5` | Report page background |
| ink | `#1F1F1F` | Report text |
| ink-2 | `#6E6C66` / `#3E3D3A` | Report secondary text |
| button | `#FFFFFF` bg, `#1E1E1E` text; hover `#E9E9E6` | Primary CTA |
| hero gradient | `linear-gradient(180deg,#1A1D23 0%,#262B34 34%,#3F4250 54%,#5B5157 62%,#2C2828 72%,#232323 100%)` | Hero |
| hero glow | `radial-gradient(closest-side, rgba(232,172,132,.32), transparent)` 1600×520 ellipse centered at 62% height | Hero horizon warmth |

### Typography
- **Outfit** (Google Fonts, 300/400/500/600) — all UI and headings.
- **Geist Mono** (400/500) — small labels, numbers, page meta.
- H1: `clamp(44px, 5.6vw, 86px)`, weight 400, line-height 1.08, letter-spacing -0.02em, max-width 15ch, white, centered, `text-wrap: balance`.
- H2: `clamp(36px, 4vw, 56px)`, weight 500, lh 1.05, ls -0.025em.
- Closing H2: `clamp(40px, 5.2vw, 76px)`, weight 500, lh 1.04, ls -0.03em, max-width 14ch.
- Statement paragraph: `clamp(28px, 3.4vw, 46px)`, lh 1.25, ls -0.015em, max-width 30ch.
- Question rows: `clamp(22px, 2.6vw, 34px)`, ls -0.015em.
- Body: 16–19px, lh 1.5–1.6.
- Mono labels: 11–13px, uppercase where noted, ls .04–.06em.

### Radius / borders / shadows
- Buttons: 6px radius (not pills). Nav bar: 10px. Cards/pricing: 6px. Report paper: 4px.
- Report paper shadow: `0 40px 80px rgba(0,0,0,.35)`.
- Borders are 1px hairlines only.

### Spacing
- Content max-width 1280px, side padding 40px.
- Section top padding: 160–220px (very generous — keep it).
- Grain overlay: `grain.png` (256×256 noise, tiled) at opacity .55, `mix-blend-mode: overlay`, hero only.

## Screens / Sections (top to bottom)

### 1. Header (fixed)
- Fixed, top 12px, 16px side padding. Inner bar: max-width 1400px, padding `10px 10px 10px 20px`, radius 10px, transparent.
- Left: "AdCendy" wordmark (20px, 600). Center: links "Inside a strategy", "How it works", "Pricing", "Sign in" (15px, `#E4E4E1`, gap 28px). Right: white button "Get your strategy →".
- **On scroll** (once hero top < -40px): max-width animates to 980px, background `rgba(40,40,40,.82)`, border `rgba(255,255,255,.08)`, `backdrop-filter: blur(16px)`. Transition: max-width .8s `cubic-bezier(.2,.7,.2,1)`, bg/border .5s.

### 2. Hero (100vh, min 640px)
- Layers: gradient → horizon glow → **canvas animation** → grain → bottom fade to `#232323` (22% height).
- Centered content (padding-bottom 16vh): H1 "Market intelligence your team can act on" + white button "Get your strategy →" (optional; prop `showHeroButton`).
- Scroll cue: 1px × 72px line at bottom center (`rgba(255,255,255,.14)`), with a 28px white gradient segment sliding down on loop (2.2s ease-in-out).
- Intro: H1 and button fade up from `translateY(16px)` + `blur(8px)`, 1.4s, staggered 200ms / 420ms.
- On scroll: hero text moves up at 0.28× scroll and fades out over 60% of viewport height.

**Canvas animation ("dusk ridges")** — see `startCanvas()` in the file for exact math:
- 6 ridge layers, back→front. Layer k (0..1): baseline at `h*(0.6 + k*0.3)`, amplitude `h*(0.06 + k*0.035)`.
- Each ridge y = base − amp × (0.55·sin(nx·2.1π + i·1.7 + t·0.00005·(1+k)) + 0.3·sin(nx·4.7π + i·2.3 − t·0.00007) + 0.15·sin(nx·10.3π + i·0.9 + t·0.0001)), sampled every 6px.
- Fill each ridge solid, interpolating rgb(74,68,76) (back) → rgb(35,35,35) (front). Stroke the ridge top 1px `rgba(255,226,204, 0.2 − k*0.12)`.
- Mouse parallax: horizontal offset `mx*(10 + k*40)` px, eased (lerp .04).
- 36 tiny particles (r 1.1px, `rgba(255,232,214, ≤.45)`) rise slowly from the ridges and twinkle; respawn at 90% height when they reach 25%.
- Pause drawing when hero is off-screen. Respect `prefers-reduced-motion` (draw a single static frame).
- In React: a `<canvas>` in a client component with a `requestAnimationFrame` loop, DPR-capped at 2.

### 3. Statement
Single paragraph, max 30ch: "Most teams can execute. What they're missing is someone to tell them what to aim at." (white) + " We're not an agency, and it isn't AI-generated. A person reads every strategy, end to end, before it reaches you." (`#7E7E7A`).

### 4. Inside a strategy (id `inside`) — report reader
- Header row: H2 "Inside a strategy" left; right copy "Sample pages from a 30–50 page strategy. Yours covers one market, end to end."
- Grid: left chapter list (max 380px) + right paper page (spans 2 columns, min-height 560px). Collapses to stacked on narrow screens.
- **Chapters** (01–05): Market snapshot / Competitor landscape / Positioning / Channel direction / The first 30 days, each with a one-line subtitle. Active = white, inactive = `#8A8A86`. Under each, a 1px progress bar; the active one fills left→right over 6s (linear).
- **Autoplay**: advances every 6s. Clicking a chapter selects it and **stops autoplay** (bar shows full).
- **Pages**: stacked absolutely, crossfade (opacity .5s ease) + slide (translateY ±12px, .7s `cubic-bezier(.2,.7,.2,1)`). Each page: paper `#ECEAE5`, padding 36px 40px, mono header "Sample Co. · United Kingdom" + "0X · p. N", 34px title, then content:
  1. Market snapshot — 3 stats (48k / +18% / 23) + 12-bar demand chart + left-ruled insight.
  2. Competitor landscape — 4-row table (Competitor, Leads on, Main channel, Ad activity as 3 dots) + insight "Three of four competitors lead on price. No one leads on speed."
  3. Positioning — label + "Lead on speed." (48–72px) + 3 proof points with top rules.
  4. Channel direction — 4 horizontal bars with % and rationale.
  5. The first 30 days — 4 week rows: task + target metric.
- **Build these pages from a data model** so real report excerpts can replace the placeholders.

### 5. Questions your strategy answers
- H2 left. 5 accordion rows, 1px top borders. Row: mono number (48px column) · question (22–34px) · "+" (rotates 45° when open, .45s).
- Open row expands with `grid-template-rows: 0fr → 1fr` (.55s), showing an answer (18px, `#C4C4C0`) and mono "Chapter 0X · …" reference. One open at a time; all closed initially. Hover: text → white.
- Copy is in `qData` in the file.

### 6. Four days, in writing (id `how`) — timeline
- H2 + right copy "No calls required. One revision round and 30 days of written support included."
- A 1px track line across the top; a white fill line scales X from 0→1 as the section scrolls through (progress = (0.7·vh − top) / (0.75·height)). 4 nodes (11px circles) turn white as the fill passes them.
- Steps: Day 0 "A 15-minute intake" · Days 1–2 "We map your market" · Day 3 "A strategist reviews it" · Day 4 "Your strategy lands" (+ one-line bodies).

### 7. Pricing (id `pricing`)
- Card: `#282828`, 1px border, radius 6px, two columns. Left: mono "PRICING", H2 "One market. One strategy. One fee.", copy, buttons "Get your strategy →" (white) and "Book a 20-min call" (outline). Right: 5 ✓ rows of inclusions.

### 8. Closing
- H2 "Your team has the hands. We bring direction." (left-aligned).
- Full-width SVG line (180px tall): flat, then curving upward to the top-right, ending in a 12px glowing white dot. Mono label "Today" under the flat start. Line **draws in** (stroke-dashoffset 1→0, 2.4s, `cubic-bezier(.6,0,.2,1)`) when scrolled into view.
- Button "Get your strategy →".

### 9. Footer
One row above a hairline: wordmark · links (Inside a strategy, How it works, Pricing, Contact) · "© 2026 Erraiway Technologies LLP".

## Interactions & Behavior (summary)
- Scroll reveal on most blocks: fade + translateY(22px) → 0, 1.2s, `cubic-bezier(.2,.7,.2,1)`, optional stagger delay (100–120ms). Trigger once at 94% of viewport.
- All motion should be disabled under `prefers-reduced-motion` (prototype prop `motion=false`).
- Links: signup `https://www.adcendy.com/auth/signup`, login `https://www.adcendy.com/auth/login`, call `https://adcendy1.zohobookings.in/488505000000030046`, contact `https://www.adcendy.com/contact`.
- Responsive: everything reflows via grid `auto-fit`/`minmax`; type uses `clamp()`. On mobile, nav links should collapse into a menu (not in prototype — implement per codebase).

## State
- `chapter` (0–4), `autoplay` (bool, false after user click), `openQuestion` (index or -1).
- Scroll-derived (no React state needed): nav compact flag, hero text parallax, timeline progress, reveal triggers, line draw.

## Assets
- `grain.png` — 256×256 random monochrome noise, alpha ~15%. Tile as a background.
- Fonts: Outfit, Geist Mono (Google Fonts).
- No images or icons; arrows are text glyphs (→ › + ✓).

## Files
- `AdCendy Home v5.dc.html` — the full prototype (template + logic class).
- `grain.png` — texture.
