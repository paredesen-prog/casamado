# Rendering Remotion in the Claude Code cloud container

Everything below was hit for real; each fix is one flag or one command.

| Problem | Symptom | Fix |
|---|---|---|
| Remotion can't download Chrome Headless Shell (`remotion.media` blocked) | `getaddrinfo ENOTFOUND remotion.media` on `compositions`/`still`/`render` | Pass `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` (check the version dir with `ls /opt/pw-browsers`). Don't hard-code it in `remotion.config.ts` — it breaks the user's local machine. |
| No GPU | black/empty 3D | `--gl=swangle` (software WebGL). Shadows, tone mapping and N8AO all work; just slower. |
| Playwright's Chromium has no H.264 | `R3F: Img is not part of the THREE namespace` (OffthreadVideo fallback rendering inside the canvas) | Don't use H.264 videos inside the 3D scene here; use images/textures, or transcode to VP9 webm with the system `ffmpeg`. |
| CDNs blocked (jsdelivr, unpkg, Poly Haven, Kenney) | 403 / connection reset | npm registry and GitHub raw work. Get libraries via `npm install` / `npm pack <pkg>@<ver>`; build models and textures procedurally in code. |
| Browser `console.log` not shown | debugging blind | Render a still and look at it; use a bright debug mesh (red box) to test whether a component mounts. |
| Heavy first frame (big procedural canvas textures, many shaders, reflector + AO) | `Timeout (30000ms) exceeded rendering the component initially` — stills work, full render dies after ~45 s | Add `--timeout=240000` to `render` (the parallel tabs each build textures and compile shaders at once). |
| `drei` `<Environment preset>` / HDRI files | download blocked | Build IBL offline: `scene.environment = new PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture` (from `three/examples/jsm/environments/RoomEnvironment.js`). |
| Product textures missing in renders | products never appear | Load textures **outside** the `<ThreeCanvas>` with `delayRender`, and only mount the canvas once they're ready (state set inside the R3F tree arrives after the frame is captured). |

## Commands

```bash
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx tsc --noEmit                                   # typecheck
npx remotion compositions --browser-executable="$B"
node <skill>/scripts/stills.mjs --root . --comp CasamadoPromo --out /tmp/stills 30 120 300 545
npx remotion render CasamadoPromo out/video.mp4 --browser-executable="$B" --gl=swangle \
  --concurrency=4 --codec=h264 --crf=18 --log=error
ffprobe -v error -show_entries stream=codec_type -show_entries format=duration -of compact out/video.mp4
```

Full renders take 5–15 min: run them with the Bash tool's `run_in_background` and keep
talking to the user meanwhile. Python helpers need `pip install Pillow numpy scipy`
(use `python3 -m pip`, and run scripts with `python3 -I`).

## Licensing to mention to the user

Remotion is free for individuals and companies of up to 3 people; larger companies need a
license (remotion.pro/license). Synthesized music from `make-soundtrack.py` is original and
safe to use; anything else needs proof of rights.
