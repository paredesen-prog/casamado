---
version: alpha
name: Cobalt Grid — Frame (video / frame layer)
description: >
  Video-first companion to Cobalt Grid's design.md. The unit is the frame (1920×1080). Atoms
  are identical and sacred — warm cream paper, electric cobalt ink (the only ink), the permanent
  graph-paper grid, Rubik serif 400 + Rubik + DM Mono, the top/bottom cobalt
  hairlines, and the pixel-glitch + QR-block signatures. Composition, frame scale, and
  aspect-ratio behavior are rewritten for the frame. Motion is out of scope.
unit: the frame — 1920×1080 primary; 9:16 and 1:1 documented
principle: atoms are sacred · composition is free · numbers come from the script

colors:
  paper: "#F3F5F7"
  paper-2: "#E3E9EF"
  ink: "#1A3A5C"
  ink-soft: "#5E849E"
  grid: "rgba(26, 58, 92, 0.10)"
  ink-faint: "rgba(26, 58, 92, 0.18)"
  signal: "#F5A623"

typography:
  # — reading ramp —
  body:        { fontFamily: "Rubik", cqw: 0.83, weight: 400, lineHeight: 1.5 }
  body-lede:   { fontFamily: "Rubik", cqw: 0.95, weight: 400, lineHeight: 1.5 }
  micro:       { fontFamily: "Rubik", px: 13, weight: 600, tracking: "0.16em", upper: true }
  micro-strong:{ fontFamily: "Rubik", px: 16, weight: 600, tracking: "0.18em", upper: true }
  mono-tag:    { fontFamily: "DM Mono", cqw: 0.78, weight: 400, tracking: "0.05em" }
  mono-chrome: { fontFamily: "DM Mono", px: 13, weight: 400, tracking: "0.06em" }
  # — display / hero ramp (Rubik 400, negative tracking) —
  table-name:  { fontFamily: "Rubik", cqw: 1.5, weight: 600, lineHeight: 1.15 }
  row-headline:{ fontFamily: "Rubik", cqw: 2.1, weight: 600, lineHeight: 1.05 }
  ed-callout:  { fontFamily: "Rubik", cqw: 2.6, weight: 400, lineHeight: 1.1, italic: true }
  headline:    { fontFamily: "Rubik", cqw: 4.6, weight: 600, lineHeight: 0.95 }
  headline-index:{ fontFamily: "Rubik", cqw: 5.0, weight: 600, lineHeight: 0.95 }
  display-quote:{ fontFamily: "Rubik", cqw: 5.7, weight: 600, lineHeight: 1.05, tracking: "-0.005em" }
  display-chapter:{ fontFamily: "Rubik", cqw: 6.8, weight: 600, lineHeight: 1.0, tracking: "-0.005em" }
  display-closing:{ fontFamily: "Rubik", cqw: 9.4, weight: 600, lineHeight: 0.96, tracking: "-0.005em" }
  display-hero:{ fontFamily: "Rubik", cqw: 10.4, weight: 600, lineHeight: 0.9, tracking: "-0.008em" }
  vbig-numeral:{ fontFamily: "Rubik", cqw: 12.5, weight: 600, lineHeight: 0.9, tracking: "-0.015em" }

spacing:
  edge: "4cqw"          # standard frame edge inset (~80px@1920)
  pad-top: "7cqw"
  pad-bottom: "6cqw"
  gap-md: "2cqw"

components:
  graph-grid:
    backgroundImage: "linear-gradient grid, ~2cqw cells, 10% {colors.ink} ({colors.grid})"
    placement: "behind EVERY frame on the ground"
    description: "Permanent graph-paper grid — never disabled; the canvas tone."
  hairlines:
    rule: "0.12cqw solid {colors.ink}"
    placement: "≈3cqw from top + bottom, inset {spacing.edge}"
    description: "Two persistent cobalt rules framing every composition."
  page-chrome:
    typography: "{typography.pagenum}"
    color: "{colors.ink}"
    placement: "page number bottom-right, nav/meta hint bottom-left, above the bottom hairline"
    description: "The only persistent chrome."
  pixel-glitch:
    backgroundColor: "{colors.paper}"
    fill: "repeating-linear-gradient(90deg, {colors.ink} 0 2px, transparent 2px 8px)"
    size: "14–30cqw wide, full height, stair-stepped"
    placement: "right on cover/data, left on chapter/colophon; z above grid, below headline"
    description: "Stair-stepped scanline column. Decorative."
  qr-block:
    backgroundColor: "{colors.paper}"
    cells: "8×8, {colors.ink} on / {colors.grid} off"
    size: "3–9cqw square"
    shadow: "0 0 0 0.12cqw {colors.paper} (anti-shadow for readability, not elevation)"
    description: "QR mosaic patch — corner punctuation."
  topbar-rule:
    typography: "{typography.headline-index} + {typography.mono-tag}"
    borderBottom: "0.12cqw solid {colors.ink}"
    description: "Section header on index/data/table frames."
  ledger-row:
    layout: "grid: mono num · Rubik name · Hanken desc · mono delta"
    borderBottom: "0.06cqw solid {colors.ink-faint} (header 0.12cqw solid {colors.ink})"
    typography: "{typography.mono-tag} + {typography.table-name} + {typography.body}"
    description: "Dense matrix row with ↑/↓/— delta."
  pixel-stack-bar:
    cells: "column-reverse, {colors.grid} off / {colors.ink} on"
    baseline: "0.12cqw solid {colors.ink} + {typography.mono-tick} ticks"
    description: "Data as grid-unit cells; echoes the glitch."
  vstack-label:
    typography: "{typography.mono-tick}"
    transform: "writing-mode: vertical-rl"
    description: "Catalogue chrome along a frame edge."
---

# Cobalt Grid — Frame (video / frame layer)

## Brand adaptation (READ FIRST — the frontmatter is the source of truth)

- **Casamado override (hand-patched)** — ink is Casamado navy `#1A3A5C` on a cool paper `#F3F5F7`; `ink-soft` steel `#5E849E`. Display ramp is Rubik **600** (the brand site sets headings bold). ONE extra accent, `{colors.signal}` amber `#F5A623` (the site's top-bar color), reserved for the "despacho gratis" / count highlights — use at most one signal element per frame. Product photography and the real logo (gradient chevrons) are the only other color on screen.

This is the **cobalt-grid** preset remixed onto the captured brand. The YAML frontmatter above (colors · typography · components) is **normative and already correct — use it verbatim.** The prose below is the ORIGINAL preset's intent; read it THROUGH the frontmatter:

- **Fonts** — already set to **Rubik** (display) / **Poppins** (body); ignore any preset font name lingering in prose.
- **Weights** — the brand font ships `{400, 500, 600, 700}` only; every weight is clamped to these — ignore higher preset weights (e.g. 600/700) in prose.
- **Colors** — use the frontmatter hex; preset color NAMES in prose (e.g. "cobalt", "cream") mean the remapped brand values.


## Overview

Cobalt Grid at frame scale is a **two-color risograph trend-report** — warm cream paper, electric
cobalt ink, and a **permanent graph-paper grid** behind every frame. Cobalt is the _only_ ink:
headlines, body, rules, the grid, the pixel-glitch decoration, the QR patches. There is no accent
color and no second surface.

The voice is a three-face conversation: **Rubik** serif at weight 400 (size, not weight,
makes hierarchy) carries every display and headline; **Rubik** carries body and
uppercase tracked labels; **DM Mono** carries all chrome — page numbers, tags, ticks, vertical
stacks. Every frame is framed by top + bottom cobalt hairlines; declarative frames carry the
**pixel-glitch column** and a **QR-block** patch.

**Key characteristics at frame scale:**

- **Strictly two-color** — cream paper + cobalt ink; no accent, no second surface.
- **Permanent ~2cqw graph-paper grid** (10% cobalt) behind every frame; cannot be disabled.
- **Top + bottom 1.5px cobalt hairlines** frame every composition, inset by `edge`.
- **Rubik 400** for all display (negative tracking); **Hanken 600** uppercase 0.16em labels; **DM Mono** chrome.
- **Pixel-glitch column + QR-block** as the signature decorative patches on declarative frames.
- **Pixel-stack bars** render data as grid-unit cells (cobalt on / 10% off).

## The Frame

### Frame Craft Bar

Three eyeball tests gate every frame before any structural check:

- **Squint** — one Rubik element dominates at **3–6× its nearest neighbor** (`display-hero`/`vbig-numeral`); hierarchy is size, never weight.
- **Silence** — declarative frames (cover, chapter, quote, colophon) read **45–60% empty** with the grid showing; the **index ledger and data frame are the one dense exception** (density via quiet repetition, not richness).
- **Restraint** — **two-color only** (cream + cobalt, never a second hue); one pixel-glitch column and at most one QR-block per declarative frame.
- **Reference** — aim at a **WIRED Japan / Shift two-color risograph monograph**; failure looks like a **colorful dashboard with a second accent hue**.

- **Primary:** 1920×1080 (16:9). Display authored in **`cqw`** (`px ÷ 1920 × 100 = cqw`).
- **Vertical:** 1080×1920 (9:16). **Square:** 1080×1080 (1:1).
- **Safe area:** `edge` (4cqw) inset; hairlines + page chrome live on the safe line.

**The container law (load-bearing).** Every frame ground sets `container-type: size` AND carries
the graph-paper `background-image`; ALL frame-relative units are `cqw`/`cqh` against it — never
`vw`. The grid `background-size` is `~2cqw 2cqw` so cell density holds at any render size.

## Colors

Tokens identical to the source. `{colors.paper}` is the ground; `{colors.ink}` cobalt is the only
ink (type, rules, grid lines, glitch, QR). `{colors.ink-soft}` is a secondary cobalt for editorial
subtitles only; `{colors.grid}` (10%) is the permanent grid + chart "off" cells; `{colors.ink-faint}`
(18%) is faint row dividers. **Never a second hue** — emphasis comes from size, from switching
Hanken→Rubik, from a mono delta arrow, or from opacity, never from color.

## Typography

Two ramps. The **reading ramp** (Hanken body 0.83cqw, mono chrome in px) carries copy + labels;
the **display/hero ramp** (Rubik `headline` 4.6cqw → `vbig-numeral` 12.5cqw) carries every
statement and figure.

- **Legibility floor:** any load-bearing line ≥ **1.4cqw**; mono chrome (px) is colophon only.
- **Fit-to-measure:** size the headline to its line length. Cap the block at **≤ 78cqw**; ≤3 words → `display-hero`/`vbig-numeral`; 4–6 → `display-chapter`; 7+ → `headline`.
- **Rubik at 400 only**, in cobalt, with negative tracking (hero −0.008em, numeral −0.015em). **Hanken labels uppercase, 0.16–0.18em.** **DM Mono 0.04–0.08em.** No bold serif.

## Depth & Surface

Flat. Depth is structural only:

- **1.5px cobalt rules** — slide hairlines, topbar rule, chart baseline.
- **1px ink-faint dividers** — dense list / ledger rows.
- **The graph-paper grid** — measured-plane tone behind everything.
- **Pixel-glitch + QR** — texture and graphic punctuation, no z-axis.

**Ceiling:** no drop shadow (the QR's 1.5px paper outset is an anti-shadow for readability, not elevation), no gradient, no rounded corner, no second color.

## Shapes

- **0 radius everywhere** — frames, ledger rows, QR cells, glitch blocks, charts. Zero circular elements; this squareness is part of the identity.

## Components

- **graph-grid / hairlines / page-chrome** — the permanent frame furniture, inherited by every composition.
- **pixel-glitch** (edge column) + **qr-block** (corner patch) — the signature decoration on declarative frames.
- **topbar-rule** — the index/data/table section header. **ledger-row** — dense matrix row with delta arrows.
- **pixel-stack-bar** — data as grid-unit cells. **vstack-label** — vertical mono catalogue chrome.

## Frame Treatments

> Recipe: ground · container · composes · focal · chrome · accent · silence · Fixed/Free · density.
> The grid + hairlines are present on every frame. Choose density by type: declarative = sparse, index/data = dense.

### 1 · Hero Cover (identity · move: serif + glitch · left)

**Ground** paper + grid, hairlines. **Composes** pixel-glitch (right, ~26cqw), qr-block (top-right), display-hero, ed-callout. **Focal** a 1–2 line `display-hero` Rubik headline in cobalt, left-anchored, with an italic `ed-callout` subtitle in `{colors.ink-soft}`. **Chrome** Hanken kicker; mono meta top + page number. **Accent** none (cobalt is the only ink). **Silence** ~45% paper. **Fixed** Rubik 400, glitch + QR present, grid + hairlines. **Free** title, glitch step pattern, QR placement. **Density** sparse.

### 2 · Index Ledger (catalog · move: dense matrix · left — the dense frame)

**Ground** paper + grid, hairlines, `pad-top`/`pad-bottom`. **Composes** topbar-rule, ledger-rows. **Focal** a topbar (`headline-index` + mono lab-tag, 1.5px rule) over 4–6 ledger rows (mono num · Rubik name · Hanken desc), ink-faint dividers. **Chrome** page number. **Accent** mono delta arrows. **Silence** tight — the density exception (the grid wants filling). **Fixed** 1.5px topbar rule, 1px ink-faint dividers, Rubik names. **Free** rows, lab-tag, deltas. **Density** dense-exception.

### 3 · Chapter Opener (section · move: scale · sparse · left)

**Ground** paper + grid, hairlines. **Composes** pixel-glitch (left, ~14cqw, low opacity), mono index, display-chapter, body-lede. **Focal** a `display-chapter` Rubik title, with a small mono `CHAPTER NN` index above and an optional Hanken lede ≤42cqw. **Accent** none. **Silence** ~60% — let the grid breathe. **Fixed** Rubik 400, glitch low-opacity, grid showing. **Free** title, lede, glitch side. **Density** sparse.

### 4 · Data Frame (chart · move: pixel-stack · left)

**Ground** paper + grid, hairlines, `pad-top`. **Composes** topbar-rule, pixel-stack-bar row. **Focal** a row of 6–8 pixel-stack bars (cobalt on / 10% off) over a 1.5px cobalt baseline with mono ticks. **Chrome** topbar headline + mono fig-tag; page number. **Accent** none — data is cobalt cells. **Silence** moderate. **Fixed** grid-unit cells, cobalt baseline, mono ticks. **Free** bar values (from script), tick labels. **Density** standard/dense.

### 5 · Manifesto / Quote (quote · move: centered statement · sparse)

**Ground** paper + grid, hairlines. **Composes** display-quote (or display-manifesto), attribution rule, optional compact glitch. **Focal** a 2–3 line Rubik pull in cobalt, with a Hanken kicker above and a 1px cobalt attribution rule + mono byline beneath. **Accent** none. **Silence** ~55% — deliberately open. **Fixed** Rubik 400, attribution rule, grid showing. **Free** quote, byline. **Density** sparse.

### 6 · Colophon (closer · move: right-aligned close · sparse)

**Ground** paper + grid, hairlines. **Composes** pixel-glitch (left edge, mirroring the cover), display-closing, mono credit columns. **Focal** a right-aligned `display-closing` Rubik title with a Hanken kicker above. **Chrome** 3–4 column mono credit grid at the foot; page number. **Accent** none. **Silence** ~50%. **Fixed** glitch on left, Rubik 400. **Free** closing line, credits. **Density** sparse.

## Composition Rules

### Do

- Keep the **graph-paper grid + top/bottom hairlines** on every frame — they are the system.
- Set **Rubik at 400 in cobalt**; make hierarchy with size, not weight; negative-track display.
- Track **Hanken labels uppercase 0.16em**; **DM Mono chrome 0.04–0.08em**.
- Render data as **pixel-stack cells** (cobalt on / 10% off); echo the glitch language.
- Use the **pixel-glitch column + QR patch** on declarative frames (cover, chapter, quote, colophon).
- Lean: declarative frames sparse and breathing; index/data dense. Vary anchor (left for index/chapter, centered for quote/closer).

### Don't

- Don't introduce a second ink color — cream + cobalt only.
- Don't bold Rubik, round any corner, or add a drop shadow (QR outset is an anti-shadow only).
- Don't disable the grid or suppress the hairlines.
- Don't crowd chapter / quote / colophon — those let the grid show.
- Don't blow a serif headline edge-to-edge — fit to measure.

## Aspect-Ratio Behavior

| Treatment         | 16:9                        | 9:16                                 | 1:1                          |
| ----------------- | --------------------------- | ------------------------------------ | ---------------------------- |
| Hero Cover        | headline left, glitch right | headline top, glitch full-width band | headline upper, glitch lower |
| Index Ledger      | topbar + rows               | topbar + fewer rows                  | 2-col compresses to 1        |
| Chapter Opener    | title left, glitch left     | title top, glitch side               | centered title               |
| Data Frame        | 6–8 bars                    | 4–5 bars taller                      | square chart                 |
| Manifesto / Quote | centered pull               | centered, taller                     | centered                     |
| Colophon          | right-aligned, glitch left  | stacked, glitch top                  | centered close               |

Grid + hairlines hold on the short edge for every ratio; re-step display so no load-bearing line
drops below 1.4cqw. Mono chrome stays Latin/digit-only.

## Approved Entities

No real customers, logos, or vendors are defined in the source — render any such mark as a
placeholder. Trend names, signals, and figures are content; the system supplies the grid and chrome.

## Numerals & Claims (hard rule)

Never invent figures, deltas, dates, or signal counts at frame scale. Render slots as `— figure —`,
`{metric}`, `↑ —`. Pixel-stack bar heights and ledger deltas especially carry placeholders until the
script supplies values. Mono catalogue ordinals (001, 002…) are decorative and may be sequential.

## Pre-Render Self-Audit

- **Squint** — one Rubik element dominates at 3–5× its neighbor.
- **Silence** — declarative frames 45–60% empty; only index/data run dense.
- **Two-color** — cream + cobalt only; no second hue anywhere.
- **Furniture** — grid present, top/bottom hairlines present, page chrome above the hairline.
- **Type** — Rubik 400 negative-tracked, fit-to-measure; Hanken labels 0.16em; ≥1.4cqw floor.
- **Depth** — 0 shadow (QR outset excepted), 0 rounded corner.
- **Anchor** — left on index/chapter/cover, centered on quote/closer; no 3 consecutive frames share an anchor.
- **Fabrication** — every numeral/delta traces to the script, else placeholder.

## Known Gaps

- **Motion intentionally out of scope.** frame.md specifies composition only; the 280ms cross-fade in the source is a deck mechanic.
- **Pixel-glitch is rendered in CSS here** (stacked scanline blocks) rather than the source's inline SVG, to keep the showcase SVG-free; fidelity is preserved.
- **Three Google Fonts** (Rubik, Rubik, DM Mono); CJK pairing (Noto Serif SC 700/400) carries over from the source.
- **9:16 / 1:1 are guidance**; verify the legibility floor and grid density per ratio.
- The QR mosaic and glitch step patterns are hand-authored; there is no generative layer.


## Font loading (auto-generated)

The brand font ships as local files in `assets/fonts/` — do NOT link Google Fonts for it. Paste this `<style>` into every frame's `<head>`/`<template>` (captions use the same files) so `font-family` resolves in preview, snapshot, and render alike:

```html
<style>
@font-face{
  font-family: 'DM Mono';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url('assets/fonts/dmmono-400-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'DM Mono';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url('assets/fonts/dmmono-400-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face{
  font-family: 'DM Mono';
  font-style: normal;
  font-weight: 500;
  font-display: block;
  src: url('assets/fonts/dmmono-500-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'DM Mono';
  font-style: normal;
  font-weight: 500;
  font-display: block;
  src: url('assets/fonts/dmmono-500-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nErXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nMrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nFrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nDrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nPrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nBrXyw023e.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nErXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nMrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nFrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nDrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nPrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nBrXyw023e.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nErXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nMrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nFrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nDrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nPrXyw023e1Ik.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'Rubik';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-iJWKBXyIfDnIV7nBrXyw023e.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face{
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-pxiByp8kv8JHgFVrLEj6Z11lFd2JQEl8qw.woff2") format('woff2');
  unicode-range: U+0900-097F, U+1CD0-1CF4, U+1CF7-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B0A;
}
@font-face{
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-pxiByp8kv8JHgFVrLEj6Z1JlFd2JQEl8qw.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("assets/fonts/captured-pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face{
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("assets/fonts/captured-pxiByp8kv8JHgFVrLCz7Z11lFd2JQEl8qw.woff2") format('woff2');
  unicode-range: U+0900-097F, U+1CD0-1CF4, U+1CF7-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B0A;
}
@font-face{
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("assets/fonts/captured-pxiByp8kv8JHgFVrLCz7Z1JlFd2JQEl8qw.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face{
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("assets/fonts/captured-pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
</style>
```
