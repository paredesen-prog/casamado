---
format: 1080x1080
duration: 30s
message: "Casamado abastece toda tu oficina en un solo pedido, con despacho gratis sobre $70.000 en la RM"
arc: BAB — before (oficina vacía) → bridge (Casamado) → after (cada sala llena) → proof (+1.100) → despacho → CTA
audience: Encargados de compras y administración de empresas en Santiago
mode: autonomous
music: none
---

## Video direction

**Canvas & world.** 1080×1080, silent (no narration, no music, no SFX — `music: none`). All copy is on-screen text in Spanish (Chile). The whole film lives on ONE drawing: the floor plan `assets/plano-oficina.svg` (viewBox 1000×800) laid on the cobalt-grid paper.

**Plan home position (shared by frames 1–4 — exact numbers, do not improvise).** Inline the SVG (so `#walls` paths can draw on) at width 880 × height 704, top-left at canvas (100, 180). Canvas point = (100 + 0.88·vx, 180 + 0.88·vy). Room centers on canvas: BAÑO (214, 312) · COCINA (848, 312) · ESCRITORIOS (522, 409) · SALA TI (848, 550) · BODEGA DE ASEO (522, 761) · MANTENCIÓN (848, 770) · RECEPCIÓN (214, 664). The plan + everything placed on it sits inside one `.world` wrapper; the "camera" is a transform on `.world` (transform-origin 0 0). Camera state is written as `zoom Z centered on (x, y)` = the canvas point (x, y) appears at canvas center (540, 540) at scale Z: `.world` transform = translate(540 − Z·x, 540 − Z·y) scale(Z). Home = zoom 1 with no translate.

**Product cards (shared by frames 3–4 — exact).** Each product is a photo "sticker": the JPG (240×300 source) in a card 96×120 at zoom 1, 4px `{colors.paper}` border, hairline `{colors.ink-faint}` outline, soft drop shadow (the one allowed shadow — physical stickers on a drawing), slight rotation. Card centers (canvas coords at home) and rotation:
- BAÑO: `image-66.jpg` (165, 300) −4° · `dispensador-jabon-sachet-tork-elevation-.jpg` (265, 322) +3°
- COCINA: `haiti-cafe-molido-super-moka-bolsa-250gr.jpg` (790, 300) +3° · `galleta-coco-120-gr.jpg` (905, 322) −3°
- ESCRITORIOS: `papel-fotocopia-a4-500-hjs-75-gr-excelle.jpg` (470, 400) −2° · `cuaderno-universitario-7-mm100-hjs-1.jpg` (590, 384) +4°
- SALA TI: `image-69.jpg` (848, 548) −2°
- MANTENCIÓN: `image-33.jpg` (848, 760) +3°
- BODEGA DE ASEO: `jabn-lquido.jpg` (490, 760) −3° · `image-67.jpg` (600, 772) +2° (room label moved to two lines at the room's left)
Line chips (navy pill, paper text, Rubik 600 uppercase micro + DM Mono count), anchored just above each room's top-left inside the room: "PAPEL TISSUE · 124", "CAFETERÍA · 146", "OFICINA · 259", "TECNOLOGÍA · 80", "FERRETERÍA · 62", "ASEO Y LIMPIEZA · 540".

**Palette (frame.md roles, never invented).** Ground `{colors.paper}` #F3F5F7 + permanent graph grid `{colors.grid}`; ALL ink `{colors.ink}` navy #1A3A5C; secondary `{colors.ink-soft}` #5E849E for furniture/subtitles; `{colors.signal}` amber #F5A623 used for at most ONE element per frame (a highlight block / underline, never amber text on paper). Product photos and the real logo (`favicon.png` mark, `casamado.png` lockup) bring the only other color. No gradients, no glow, no rounded-corner cards except the line-chip pills.

**Type.** Display ramp = Rubik 600 (headline / display-hero / vbig-numeral), tight tracking; labels = Rubik 600 uppercase tracked; chrome, counts, room names = DM Mono. Headlines live in the TOP BAND (y 40–165) above the plan, left-aligned at x = 100 to match the plan's left edge.

**Motion grammar.** One calm camera, long-tail `power3`/`expo` settles — smooth over bouncy; stickers land with a short drop (scale 1.15→1, shadow tightening) — the one playful move. Reveals are paced to the on-screen copy cues: each piece of text enters when it is "said"; never dump the frame at t=0. Hold model: after the last reveal, the frame reads still (no drift, no breathing).

**Rhythm.** Energy: F1 drawing (calm, building) → F2 lockup (punch) → F3 the busy tour (highest energy) → F4 zoom-out + count (climax) → F5 despacho (steady) → F6 held end card (breather, still).

**Negative list.** No stock photos, no people, no invented products or prices, no fake map geography (the map in F5 is a labeled schematic), no amber text on paper, no purple/blue "AI" gradients, no floating bokeh. Both failure modes banned: slideshow (front-load then freeze) and screensaver (everything drifting independently).

## Frame 1 — La oficina vacía

- scene: The floor plan draws itself on graph paper while the question appears: "¿Qué le falta a tu oficina?"
- voiceover: ""
- onscreen: "¿Qué le falta" / "a tu oficina?" — then room tags "SIN PAPEL" (BAÑO), "SIN CAFÉ" (COCINA), "SIN TÓNER" (ESCRITORIOS)
- duration: 4.5s
- transition_in: cut
- status: animated
- src: compositions/frames/01-oficina-vacia.html
- type: hook
- persuasion: Pain validation
- beat: curiosity + mild anxiety
- blueprint: compose (svg self-draw + per-word reveal)
- asset_candidates: assets/plano-oficina.svg — top-down office floor plan (walls, furniture, room labels)
- focal: assets/plano-oficina.svg
- roles: plano-oficina = background drawing (full plan at home position)
- handoff_out: plan at home position, zoom 1, opacity 1, static; headline text exits (crossfade handles it); room tags still visible.

narrativeRole: open on the viewer's own empty office — the recognizable before-state.
keyMessage: your office runs out of things.

Scene 1 (0.0–1.8s): paper + grid only; the plan's `#walls` paths self-draw stroke-by-stroke from the entrance outward (→ `svg-path-draw`), furniture `#furniture` and room labels `#labels` fade up at ~40% → 100% behind the walls as they close. Plan at home position, the only element — centered, ~65% of frame.
Scene 2 (1.2–2.8s): top band, left-aligned at x 100: "¿Qué le falta" then "a tu oficina?" per-word staggered reveal (→ `dynamic-content-sequencing`), display-hero scale in `{colors.ink}`; one amber underline bar wipes in under "falta" (the frame's single signal).
Scene 3 (2.8–4.5s): three small DM Mono tags pop onto rooms one by one (≈0.35s apart) — "SIN PAPEL" on BAÑO, "SIN CAFÉ" on COCINA, "SIN TÓNER" on ESCRITORIOS — outlined in `{colors.ink}` with paper fill, slight tilt; hold still to the cut.

## Frame 2 — Casamado lo trae

- scene: The plan dims; the Casamado logo blooms in the center with "Todo lo que falta, en un solo pedido."
- voiceover: ""
- onscreen: "Todo lo que falta," / "en un solo pedido."
- duration: 4s
- transition_in: crossfade 0.3s
- status: animated
- src: compositions/frames/02-casamado-lo-trae.html
- type: product_intro
- persuasion: Friction reduction (one supplier, one order)
- beat: relief + clarity
- blueprint: logo-assemble-lockup (Adapt)
- asset_candidates: assets/casamado.png — official Casamado logo lockup (gradient chevrons on gray circle + CASAMADO wordmark); assets/plano-oficina.svg — floor plan
- focal: assets/casamado.png
- roles: casamado = cutout (center hero) · plano-oficina = background (dimmed)
- handoff_in: plan at home position, zoom 1, opacity 1 (tags "SIN PAPEL/CAFÉ/TÓNER" visible at t=0, then fade out in Scene 1).
- handoff_out: plan at home position, zoom 1, opacity 1, no logo, no tags, no headline — the bare plan.

narrativeRole: name the bridge — the message lands in beat 2.
keyMessage: one order from Casamado fills the gaps.

Adapt: keep the spring-bloom-from-zero lockup on a cleared stage; the "stage" is the dimmed plan, and the lockup clears away at the end to hand the plan back.
Scene 1 (0.0–0.6s): the three room tags fade out; plan dims to ~25% opacity; a paper-colored disc ~560 wide under the logo position softens the grid.
Scene 2 (0.4–1.6s): `casamado.png` spring-blooms from scale 0 at center (540, 560), ~520 wide — the signature move.
Scene 3 (1.3–2.8s): top band headline "Todo lo que falta," then "en un solo pedido." (second line enters on its own beat), headline scale, `{colors.ink}`; amber highlight block behind "un solo pedido" wipes in left→right.
Scene 4 (2.8–4.0s): hold ~0.4s, then the logo + disc scale down and fade out, headline fades, plan returns to 100% opacity — ends on the bare plan at home (handoff_out).

## Frame 3 — Cada sala se llena

- scene: The camera tours the plan room by room; real Casamado product stickers drop into each room with its line chip.
- voiceover: ""
- onscreen: line chips "PAPEL TISSUE · 124", "CAFETERÍA · 146", "OFICINA · 259", "TECNOLOGÍA · 80", "FERRETERÍA · 62", "ASEO Y LIMPIEZA · 540"
- duration: 9.6s
- transition_in: crossfade 0.3s
- status: animated
- src: compositions/frames/03-salas-se-llenan.html
- type: feature_showcase
- persuasion: Show-don't-tell proof (real catalog products, real counts)
- beat: satisfaction + momentum
- blueprint: spatial-pan-stations (Adapt)
- asset_candidates: assets/plano-oficina.svg — floor plan (the oversized canvas); assets/image-66.jpg — Tork Toalla Jumbo 2 rolls; assets/dispensador-jabon-sachet-tork-elevation-.jpg — white Tork soap dispenser; assets/haiti-cafe-molido-super-moka-bolsa-250gr.jpg — Café Haití Super Moka 250g; assets/galleta-coco-120-gr.jpg — McKay coco cookies; assets/papel-fotocopia-a4-500-hjs-75-gr-excelle.jpg — A4 copy paper ream; assets/cuaderno-universitario-7-mm100-hjs-1.jpg — green Colón notebook; assets/image-69.jpg — wireless keyboard + mouse; assets/image-33.jpg — Flex work gloves; assets/jabn-lquido.jpg — Ballerina liquid soap 650 ml; assets/image-67.jpg — Virutex disinfectant wipes
- focal: the product stickers (each station's pair)
- roles: plano-oficina = background world · all product JPGs = cutout stickers (positions fixed in Video direction)
- handoff_in: plan at home position, zoom 1, opacity 1, no stickers.
- handoff_out: camera zoom 1.8 centered on (525, 766); ALL 11 stickers placed at their Video-direction positions/rotations, all 6 chips visible, opacity 1, camera static at the cut.

narrativeRole: the after-state, room by room — every Casamado line answers a room's need.
keyMessage: one supplier covers the whole office.

Adapt: keep the signature — ONE virtual camera traversing pre-placed stations on one oversized canvas (the plan), repeated pans that center each station and reveal its callout; the "callout" is the stickers dropping + the line chip. Stations are the plan rooms in a zig-zag route.
Scene 1 (0.0–0.8s): from home, camera pushes to zoom 1.8 centered on BAÑO (214, 312) (→ `viewport-change`).
Scene 2 (0.8–2.2s): BAÑO — the two stickers drop in (0.15s apart), then chip "PAPEL TISSUE · 124" slides in.
Scene 3 (2.2–3.6s): camera pans to COCINA (848, 312); stickers drop; chip "CAFETERÍA · 146".
Scene 4 (3.6–5.0s): camera pans to ESCRITORIOS (522, 409); stickers drop; chip "OFICINA · 259".
Scene 5 (5.0–6.4s): camera pans to SALA TI (848, 550); sticker drops; chip "TECNOLOGÍA · 80".
Scene 6 (6.4–7.8s): camera pans to MANTENCIÓN (848, 770); sticker drops; chip "FERRETERÍA · 62".
Scene 7 (7.8–9.6s): camera pans to BODEGA DE ASEO and settles at zoom 1.8 centered on (525, 766); stickers drop; chip "ASEO Y LIMPIEZA · 540" lands last with the frame's one amber underline (biggest line); hold still ≥0.8s.
Stickers outside the current view must already be placed when the camera has passed them (never disappear). Pans are smooth `power3.inOut`, each ~0.55s, then the drops.

## Frame 4 — Más de 1.100 productos

- scene: Zoom out from the bodega to the whole office, now full; the count climbs to +1.100 productos.
- voiceover: ""
- onscreen: "+1.100" / "productos en 6 líneas"
- duration: 4.5s
- transition_in: cut
- status: animated
- src: compositions/frames/04-mas-de-1100.html
- type: benefit_highlight
- persuasion: Statistical proof + value stacking
- beat: awe → confidence
- blueprint: zoom-out-workspace-reveal (Adapt)
- asset_candidates: assets/plano-oficina.svg — floor plan; assets/image-66.jpg — Tork towel; assets/dispensador-jabon-sachet-tork-elevation-.jpg — Tork dispenser; assets/haiti-cafe-molido-super-moka-bolsa-250gr.jpg — coffee; assets/galleta-coco-120-gr.jpg — cookies; assets/papel-fotocopia-a4-500-hjs-75-gr-excelle.jpg — copy paper; assets/cuaderno-universitario-7-mm100-hjs-1.jpg — notebook; assets/image-69.jpg — keyboard+mouse; assets/image-33.jpg — gloves; assets/jabn-lquido.jpg — liquid soap; assets/image-67.jpg — wipes
- focal: the "+1.100" counter
- roles: plan + stickers = background world (full, at home after the zoom-out) · counter = hero type
- handoff_in: camera zoom 1.8 centered on (525, 766); all 11 stickers + 6 chips placed exactly as Frame 3 ends (same positions/rotations); opacity 1.

narrativeRole: the payoff — the whole office, full, and the breadth as a number.
keyMessage: +1.100 productos, todo en un lugar.

Adapt: keep the signature — ONE continuous decelerating zoom-out from a tight detail to the containing whole; the "workspace" is the full office plan.
Scene 1 (0.0–1.8s): camera zooms out from zoom 1.8 on (525, 766) to home (zoom 1), one long `expo.out` move — the full office reveals, every room stocked (→ `viewport-change`).
Scene 2 (1.4–3.2s): top band, left at x 100: "+1.100" counts up 0 → 1.100 with Chilean thousands dot (value-scaled counter → `counting-dynamic-scale`), vbig-numeral scale in `{colors.ink}`, amber underline bar grows under the number as it climbs (single signal); beside it, smaller, "productos en 6 líneas" enters as the count lands.
Scene 3 (3.2–4.5s): hold the full stocked office + number, still.

## Frame 5 — Despacho gratis

- scene: A schematic Santiago map; a route draws from Casamado to "Tu oficina" while free delivery and the service chips appear.
- voiceover: ""
- onscreen: "Despacho gratis" / "sobre $70.000 en la RM" — chips "Pago con Webpay" · "Atención 24/7" · "Precios mayoristas"
- duration: 5.5s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/05-despacho-gratis.html
- type: benefit_highlight
- persuasion: Risk reversal (free delivery threshold) + rule of three
- beat: ease + trust
- blueprint: compose (svg route self-draw + grid-card-assemble chips)
- asset_candidates: assets/favicon.png — Casamado logo mark (chevron circle) used as the origin pin
- focal: the drawn route + "Despacho gratis" headline
- roles: favicon = supporting (origin pin, ~64px)

narrativeRole: remove the last objection — getting it to the office.
keyMessage: delivery is free in the RM above $70.000.

Scene 1 (0.0–1.6s): paper + grid; a schematic map in `{colors.ink-faint}`/`{colors.ink-soft}` strokes occupies the middle (y ≈ 300–760): a gentle river curve labeled "MAPOCHO" (DM Mono), two ring-road arcs, and 6 small comuna dots with DM Mono labels — SANTIAGO, PROVIDENCIA, LAS CONDES, ÑUÑOA, MAIPÚ, QUILICURA. Origin pin = `favicon.png` in a paper circle at (300, 600) labeled "CASAMADO"; destination pin = navy square marker at (780, 420) labeled "TU OFICINA". The map fades up; pins pop.
Scene 2 (1.0–2.6s): a thick navy dashed route self-draws origin → destination along a curved path (→ `svg-path-draw`); a small parcel box icon (navy outline square with tape line) rides the path head and arrives with a tiny bounce at the destination.
Scene 3 (2.0–3.4s): top band, left at x 100: "Despacho gratis" (headline scale) with an amber highlight block behind it (single signal), then "sobre $70.000 en la RM" (body-lede) on its own beat below.
Scene 4 (3.4–5.5s): bottom area (y ≈ 800–880): three outlined navy pills assemble left→right with a stagger — "Pago con Webpay", "Atención 24/7", "Precios mayoristas" (→ `grid-card-assemble` cascade); hold.

## Frame 6 — Pide hoy

- scene: Clean end card: the Casamado logo, "Pide hoy en casamado.cl" and the phone number.
- voiceover: ""
- onscreen: "Pide hoy en" / "casamado.cl" / "+569 3466 0081"
- duration: 4.5s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/06-pide-hoy.html
- type: cta
- persuasion: Friction reduction (direct URL + phone)
- beat: confidence + urgency-to-act
- blueprint: titlecard-reveal (Adapt)
- asset_candidates: assets/casamado.png — official Casamado logo lockup
- focal: assets/casamado.png
- roles: casamado = cutout (centered hero)

narrativeRole: the ask — where to buy, now.
keyMessage: casamado.cl.

Adapt: keep ONE restrained move per element then a still hold; it is the breather end card.
Scene 1 (0.0–1.0s): paper + grid; `casamado.png` slides up + fades in, centered at (540, 400), ~460 wide.
Scene 2 (0.9–2.2s): below the logo, centered: "Pide hoy en" (body-lede, `{colors.ink-soft}`) then "casamado.cl" (display-closing scale, `{colors.ink}`) with an amber underline bar wiping in under it (single signal).
Scene 3 (2.2–4.5s): "+569 3466 0081" in DM Mono under the URL fades in; the whole card holds perfectly still to the end.
