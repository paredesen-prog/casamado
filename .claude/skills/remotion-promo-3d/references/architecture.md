# Project architecture (reference: `videos/casamado-remotion/src/`)

```
src/
  constants.ts   colors, scene frame boundaries T, plan→world mapping, WALLS segments,
                 ROOM_LABELS, PRODUCTS (file, plan x/y, height, base surface), STATIONS
  timeline.ts    pure functions of frame: lightMix, wallRise, furnitureRise, dropFrame,
                 dropY (Easing.bounce), squash, chipFrame
  camera.ts      Cam {pos,target,fov}; TOP/HOME/OVERVIEW keyframes; stationCam(i);
                 camAt(frame); project(cam, worldPoint) -> screen px (for overlays)
  textures.ts    CanvasTextures: blueprint floor, realistic per-room floor, map
  rng.ts         mulberry32 seeded PRNG (procedural textures must be deterministic)
  fonts.ts       @remotion/fonts loadFont + useFontsReady (delayRender until loaded)
  useTextures.ts TextureLoader + delayRender; call it OUTSIDE the ThreeCanvas
  Furniture.tsx  procedural pieces (Desk, Monitor, Chair, Plant, Toilet, KitchenRun,
                 Fridge, ServerRack, Shelving with boxes, Pallet, Sofa, Reception…) + layout
  Office3D.tsx   CameraRig, Floor, Walls (back walls with windows), Products, lights, N8AO
  Overlays.tsx   HTML layer: HookTitle, RoomTags, BrandCard, TopBand, TourChips,
                 Progress, Counter
  MapScene.tsx   second ThreeCanvas: map plane, TubeGeometry route with drawRange,
                 van on CatmullRomCurve3, building + arrival ring, labels, chips
  EndCard.tsx    logo, URL with highlight bar, phone, footer
  Main.tsx       Sequences + crossfades + <Audio>
```

## Conventions that matter

- **Coordinates**: design the floor plan in "plan units" (1000×800, y down), map to
  world metres with `wx(x) = x/100 - 5`, `wz(y) = y/100 - 4`. All furniture/products are
  placed in plan coords, which keeps layout edits readable.
- **Everything is a pure function of `useCurrentFrame()`**. No `Math.random`, no
  `useFrame` accumulation, no timers. Seed any randomness (`mulberry32`).
- **Never mutate an object you pass as a prop.** R3F diffs props by reference; a
  `THREE.Color` that you `.lerp()` in place keeps its first value across a sequential
  render (walls stayed white in the MP4 while stills looked right). Pass fresh values —
  e.g. a hex string — every frame.
- **One camera source of truth**: `camAt(frame)` drives the R3F camera (in a
  `useLayoutEffect` with no deps) and `project()` uses the same params for HTML overlays.
- **Billboards**: product planes rotate about Y toward the camera
  (`atan2(cam.x - x, cam.z - z)`), `alphaTest 0.5`, `customDepthMaterial` =
  `MeshDepthMaterial({depthPacking: RGBADepthPacking, map, alphaTest})` so shadows follow
  the cut-out silhouette, `toneMapped={false}` + slight emissive so photos stay vivid.
- **Rise/drop animations** scale a group whose origin is on the floor (`scale=[1,r,1]`)
  so things grow up out of the floor; drops use `Easing.bounce` plus a 3-frame squash.
- **Blueprint → model reveal**: blueprint floor plane on top with opacity `1-lightMix`,
  CSS background navy→paper, wall color white→wall/cap colors, light intensities ramp.
- **Second 3D scene** (map) is its own `ThreeCanvas` inside its own `Sequence`, faded in
  with a short overlap; keep each canvas focused rather than one giant world.
- **Shadows**: `PCFSoftShadowMap`, one 2048² directional shadow with bounds covering the
  model, `shadow-normalBias≈0.02`, a large `shadowMaterial` ground plane for the drop
  shadow under the slab.
- **AO**: `<EffectComposer multisampling={4} enableNormalPass={false}><N8AO aoRadius≈0.55
  intensity≈2.4 distanceFalloff≈0.8 quality="medium" /></EffectComposer>`.

## Review checklist (run on stills and on frames pulled from the MP4)

- Each station: are all of that room's products visible, unoccluded, below the top band,
  and is the chip readable next to them?
- Overview + counter: does the whole model fit, with nothing cut at the edges, and no
  overlap between the number and the chips?
- Hook: does the title sit clear of the plan, and are the tags fully on screen?
- Map: does the van stop *in front of* the building, not inside it; do the headline and
  map labels stay clear of each other?
- End card: logo, URL, phone legible; footer appears before the last second.
- Audio: `ffprobe` shows an audio stream; per-second RMS around −14 dB in the body.
