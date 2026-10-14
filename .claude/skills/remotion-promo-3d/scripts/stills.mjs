// Bundle a Remotion project once and render many review stills (much faster than one
// `npx remotion still` per frame). Uses the preinstalled Chromium + software WebGL.
//
// node stills.mjs --root <remotion-project> --comp <CompositionId> --out <dir> 30 120 300 ...
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const root = path.resolve(opt("root", "."));
const comp = opt("comp", "Main");
const out = path.resolve(opt("out", "./stills"));
const browserExecutable = opt("browser", "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell");
const frames = args.map(Number).filter((n) => !Number.isNaN(n));

const { bundle } = await import(path.join(root, "node_modules/@remotion/bundler/dist/index.js"));
const { renderStill, selectComposition, openBrowser } = await import(path.join(root, "node_modules/@remotion/renderer/dist/index.js"));
const fs = await import("node:fs");
fs.mkdirSync(out, { recursive: true });

const chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), rspack: true });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id: comp, puppeteerInstance: browser, browserExecutable, chromiumOptions });
for (const f of frames) {
  const file = path.join(out, `s${String(f).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame: f, output: file, puppeteerInstance: browser, chromiumOptions });
  console.log("still", f, file);
}
await browser.close({ silent: true });
