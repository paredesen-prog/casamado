---
name: remotion-promo-3d
description: Build a premium 3D promo / ad video in Remotion (React Three Fiber) for a store or B2B brand — a lit 3D diorama (office, shop, warehouse, kitchen…) where the brand's real product photos drop into place, a cinematic camera tour with labels, a count-up stat, a 3D delivery route, an end card, and a synthesized music + SFX soundtrack, rendered to MP4 even in a locked-down cloud container. Use this whenever the user asks for a product/brand video "with Remotion", a 3D promo or ad, a "better / more real / next level" version of a promo video, an Instagram/LinkedIn/Reels video for their store or catalog, or wants to rebuild an existing promo (e.g. a HyperFrames one) in Remotion — even if they don't say "3D" or "React Three Fiber".
---

# Remotion 3D promo

A recipe for a 30–35 s promo in which the brand's world is a lit 3D model and its real
catalog products are the heroes. Reference implementation (Casamado, office supplies,
Santiago): `videos/casamado-remotion/` in this repo — read its `src/` when you need a
concrete version of any step below; it's the fastest way to see how the pieces fit.

Output: a 1080×1080 (or 1080×1920) H.264 MP4 with AAC audio, plus the Remotion project
committed to git. The MP4 itself is not committed (`out/` is git-ignored) — deliver it with
the file-sending tool and tell the user to download it.

## Before you build: pin the story

Agree (briefly) on: the one message, the brand's real facts (product counts, delivery
terms, phone, URL — take them from the live site, not from old backups), format
(square for feed, 9:16 for Reels/TikTok), and the concept. The pattern that worked:

1. **Hook (0–4.5 s)** — a flat navy blueprint of the space draws on with a question
   ("¿Qué le falta a tu oficina?"); lights come on, walls and furniture rise into a lit
   3D model; "SIN PAPEL / SIN CAFÉ…" tags pin the pain on rooms.
2. **Brand (4.5–8.5 s)** — veil + logo spring + the promise line with an amber highlight.
3. **Tour (8.5–18.5 s)** — camera flies room to room; each room's products drop in with a
   bounce and a floating "LINE · count" chip; a 6-step progress bar fills.
4. **Proof (18.5–23 s)** — pull back to the stocked whole + count-up ("+1.100 productos").
5. **Delivery (23–29 s)** — 3D city map, route draws, van drives to "TU OFICINA".
6. **CTA (29–33 s)** — logo, URL with highlight, phone, terms footer.

Adapt rooms/zones to the business (shop aisles, restaurant stations, clinic rooms…).
Keep facts honest: schematic maps are labeled schematic, never invent products or prices.

## Build order

1. **Environment** — read `references/environment.md` first. In this container Remotion
   can't download its browser and the bundled Chromium can't decode H.264; both have
   one-flag fixes there. Skipping it costs a lot of confused debugging.
2. **Scaffold** — `npx --yes create-video@latest --yes --three <dir>`, delete the phone
   demo (Phone.tsx, RoundedBox.tsx, helpers, public/*.mp4), pin new deps to the exact
   Remotion version (`@remotion/fonts`, `@remotion/transitions`,
   `@react-three/postprocessing@3.0.4` + `postprocessing@6.37.6` for fiber 9.2).
3. **Assets** — product photos → transparent PNGs with `scripts/cutout.py` (see its
   docstring: raise `--threshold` for white products, `--crop` away ad banners,
   `--close` to fill textured whites). Check every cutout on a dark contact sheet
   (`scripts/contact-sheet.py`) before using it; swap a product that won't cut cleanly
   for a similar catalog item rather than shipping a mangled one. Copy logo + brand fonts
   (woff2) into `public/`.
4. **Scene** — follow `references/architecture.md`: constants (plan coords, rooms,
   products, stations, scene frame boundaries) → camera keyframes → procedural textures →
   walls/furniture/products → overlays → map scene → end card.
5. **Soundtrack** — copy `scripts/make-soundtrack.py` into the project, edit its event
   frames to mirror the new timeline, run it → `public/audio/soundtrack.wav`, mount with
   `<Audio>`. Ask whether the user has a licensed MP3 they'd rather use.
6. **Review loop** — render stills with `scripts/stills.mjs` (bundles once, ~5 s/frame),
   tile them, look hard, fix, repeat. Check one still per scene plus mid-move frames.
7. **Render** — full MP4 (~5 min without AO, ~15 min with N8AO at 1080²), then pull frames
   from the MP4 itself with `contact-sheet.py --video` and re-check: some bugs only show
   in sequential renders (see "mutated props" in architecture.md).
8. **Deliver + commit** — send the MP4, commit the project (source, public assets, script).

## What made it look good (and the failure modes we hit)

- **Products are the heroes**: stand them as camera-facing billboards with alpha-tested
  shadows, slightly larger than life, on real surfaces (coffee on the counter, keyboard
  on the IT desk). Products hidden behind furniture, chairs, partitions or the top text
  band was the most frequent defect — always verify each station still.
- **Cutaway walls**: back walls tall with windows, interior walls ~0.9 m, front walls
  0.2 m, white bodies with a navy top "cut" cap. Full-height walls hide everything.
- **Realism comes from materials + light, not geometry count**: per-room procedural floors
  (oak planks, tile, carpet, concrete), furniture with legs/monitors/chairs/plants/boxes,
  warm key light + cool fill, ACES tone mapping, N8AO ambient occlusion, and
  `toneMapped={false}` on product photos so brand colors stay true.
- **Camera**: one rig used both by the 3D camera and by the 2D overlay projection, so
  labels track exactly. Station framing: target ~0.55 m high, camera ~4 m up and ~3.7 m
  back, small yaw variation per station so it doesn't feel robotic.
- **Text layer**: headlines top-left on a soft paper gradient band; amber is the single
  highlight color; chips/tags are HTML overlays (crisp text), not 3D text.
- **Sound** sells the motion: whoosh on each camera move, thud on each product landing,
  ticks on the counter, chimes on arrival/end, beat drop when the lights come on.

## Alternative look: isometric "room diorama"

The client's favourite reference style (`src/diorama/` → composition `DioramaOficina`):
one cutaway room on a thick light slab, two dark walls with light caps, narrow-FOV
camera (fov 20, ~31° elevation, slow 12° orbit), warm low sun that enters **only through
the window** (sun from behind the window wall, so the open front never lets it in) and
paints a bright patch with plant shadows, procedural stone floor + teak slat wall, studio
IBL from `RoomEnvironment`, peach/orange background with a faint `MeshReflectorMaterial`
ground, N8AO + light bloom + vignette. Pitfall: a material `color` multiplies its `map` —
use white when a wood texture is applied, or the wood turns cherry red.

## Getting better next time

Ideas the user wanted but we didn't reach yet: people in the space, more props (lamps,
art, bins), a vertical 9:16 cut, licensed music, AI-generated B-roll via Higgsfield (needs
paid credits — quote the cost first, never spend without approval).
