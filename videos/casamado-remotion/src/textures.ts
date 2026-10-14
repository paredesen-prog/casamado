import * as THREE from "three";
import { C, ROOM_LABELS } from "./constants";
import { MONO, RUBIK } from "./fonts";
import { mulberry32 } from "./rng";

const S = 2.048; // canvas px per plan unit (2048 x 1638)

const makeTex = (canvas: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

export const blueprintTexture = () => {
  const cv = document.createElement("canvas");
  cv.width = 2048; cv.height = 1638;
  const g = cv.getContext("2d")!;
  g.fillStyle = C.blueprint;
  g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = "rgba(255,255,255,0.10)";
  g.lineWidth = 2;
  for (let x = 0; x <= 1000; x += 25) { g.beginPath(); g.moveTo(x * S, 0); g.lineTo(x * S, cv.height); g.stroke(); }
  for (let y = 0; y <= 800; y += 25) { g.beginPath(); g.moveTo(0, y * S); g.lineTo(cv.width, y * S); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.font = `500 34px ${MONO}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const [t, x, y] of ROOM_LABELS) g.fillText(t.split("").join(" "), x * S, y * S);
  return makeTex(cv);
};

const RS = 3.072; // realistic floor: 3072 x 2458
type Rect = [number, number, number, number];
const ROOMS: { kind: "wood" | "tile" | "tileWarm" | "carpet" | "concrete"; r: Rect }[] = [
  { kind: "wood", r: [260, 0, 440, 520] }, { kind: "wood", r: [0, 300, 260, 500] },
  { kind: "tile", r: [0, 0, 260, 300] }, { kind: "tileWarm", r: [700, 0, 300, 300] },
  { kind: "carpet", r: [700, 300, 300, 240] }, { kind: "concrete", r: [260, 520, 440, 280] }, { kind: "concrete", r: [700, 540, 300, 260] },
];

const wood = (g: CanvasRenderingContext2D, [x, y, w, h]: Rect, rnd: () => number) => {
  const pw = 18, pl = 130;
  for (let row = 0; row * pw < h; row++) {
    const off = (row % 4) * 33;
    for (let c = -1; c * pl < w + pl; c++) {
      const px = x + c * pl - off, py = y + row * pw;
      const L = 66 + rnd() * 9, sat = 38 + rnd() * 10, hue = 30 + rnd() * 6;
      g.fillStyle = `hsl(${hue}, ${sat}%, ${L}%)`;
      g.fillRect(px * RS, py * RS, pl * RS, pw * RS);
      for (let k = 0; k < 7; k++) {
        g.strokeStyle = `rgba(110,72,38,${0.05 + rnd() * 0.07})`;
        g.lineWidth = 1 + rnd() * 2;
        const gy = (py + 2 + rnd() * (pw - 4)) * RS;
        g.beginPath(); g.moveTo(px * RS, gy);
        g.bezierCurveTo((px + pl * 0.3) * RS, gy + (rnd() - 0.5) * 8, (px + pl * 0.7) * RS, gy + (rnd() - 0.5) * 8, (px + pl) * RS, gy + (rnd() - 0.5) * 6);
        g.stroke();
      }
      g.strokeStyle = "rgba(80,52,28,0.35)"; g.lineWidth = 2;
      g.strokeRect(px * RS, py * RS, pl * RS, pw * RS);
    }
  }
};
const tiles = (g: CanvasRenderingContext2D, [x, y, w, h]: Rect, rnd: () => number, warm: boolean) => {
  const t = warm ? 40 : 30;
  g.fillStyle = warm ? "#C9C2B8" : "#C8D0D6";
  g.fillRect(x * RS, y * RS, w * RS, h * RS);
  for (let ty = 0; ty < h; ty += t) for (let tx = 0; tx < w; tx += t) {
    const v = rnd() * 6;
    g.fillStyle = warm ? `hsl(35, 18%, ${86 + v}%)` : `hsl(205, 12%, ${90 + v}%)`;
    g.fillRect((x + tx + 0.9) * RS, (y + ty + 0.9) * RS, (t - 1.8) * RS, (t - 1.8) * RS);
  }
};
const carpet = (g: CanvasRenderingContext2D, [x, y, w, h]: Rect, rnd: () => number) => {
  const t = 50;
  for (let ty = 0; ty < h; ty += t) for (let tx = 0; tx < w; tx += t) {
    g.fillStyle = `hsl(210, 9%, ${30 + rnd() * 4}%)`;
    g.fillRect((x + tx) * RS, (y + ty) * RS, t * RS, t * RS);
  }
  for (let k = 0; k < 9000; k++) {
    g.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "0,0,0"},${0.05 + rnd() * 0.06})`;
    g.fillRect((x + rnd() * w) * RS, (y + rnd() * h) * RS, 2, 2);
  }
};
const concrete = (g: CanvasRenderingContext2D, [x, y, w, h]: Rect, rnd: () => number) => {
  g.fillStyle = "#CDCFD0";
  g.fillRect(x * RS, y * RS, w * RS, h * RS);
  g.save(); g.beginPath(); g.rect(x * RS, y * RS, w * RS, h * RS); g.clip();
  for (let k = 0; k < 90; k++) {
    const cx = (x + rnd() * w) * RS, cy = (y + rnd() * h) * RS, r = (20 + rnd() * 70) * RS;
    const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    const dark = rnd() > 0.5;
    grd.addColorStop(0, dark ? "rgba(120,124,128,0.10)" : "rgba(255,255,255,0.12)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.strokeStyle = "rgba(90,95,100,0.25)"; g.lineWidth = 2;
  for (let gx = x + 110; gx < x + w; gx += 110) { g.beginPath(); g.moveTo(gx * RS, y * RS); g.lineTo(gx * RS, (y + h) * RS); g.stroke(); }
  for (let gy = y + 110; gy < y + h; gy += 110) { g.beginPath(); g.moveTo(x * RS, gy * RS); g.lineTo((x + w) * RS, gy * RS); g.stroke(); }
  g.restore();
};

export const realFloorTexture = () => {
  const cv = document.createElement("canvas");
  cv.width = 3072; cv.height = 2458;
  const g = cv.getContext("2d")!;
  const rnd = mulberry32(42);
  for (const room of ROOMS) {
    g.save(); g.beginPath(); g.rect(room.r[0] * RS, room.r[1] * RS, room.r[2] * RS, room.r[3] * RS); g.clip();
    if (room.kind === "wood") wood(g, room.r, rnd);
    else if (room.kind === "tile" || room.kind === "tileWarm") tiles(g, room.r, rnd, room.kind === "tileWarm");
    else if (room.kind === "carpet") carpet(g, room.r, rnd);
    else concrete(g, room.r, rnd);
    g.restore();
  }
  // doormat at the entrance
  g.fillStyle = "#3B4148"; g.fillRect(55 * RS, 735 * RS, 110 * RS, 55 * RS);
  return makeTex(cv);
};

export type MapPoint = { name: string; x: number; y: number };
export const MAP_POINTS: MapPoint[] = [
  { name: "QUILICURA", x: 760, y: 470 }, { name: "SANTIAGO", x: 1020, y: 1010 }, { name: "PROVIDENCIA", x: 1230, y: 900 },
  { name: "LAS CONDES", x: 1560, y: 760 }, { name: "ÑUÑOA", x: 1230, y: 1180 }, { name: "MAIPÚ", x: 520, y: 1330 },
  { name: "LA FLORIDA", x: 1340, y: 1480 }, { name: "PUENTE ALTO", x: 1420, y: 1760 },
];
// Map canvas px -> world (map plane is 16 x 16 world units, centered)
export const mapWorld = (x: number, y: number): [number, number] => [(x / 2048) * 16 - 8, (y / 2048) * 16 - 8];

export const mapTexture = () => {
  const cv = document.createElement("canvas");
  cv.width = 2048; cv.height = 2048;
  const g = cv.getContext("2d")!;
  g.fillStyle = C.paper; g.fillRect(0, 0, 2048, 2048);
  g.strokeStyle = "rgba(26,58,92,0.08)"; g.lineWidth = 2;
  for (let i = 0; i <= 2048; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 2048); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(2048, i); g.stroke(); }

  // ring roads
  g.strokeStyle = "rgba(26,58,92,0.16)"; g.lineWidth = 10;
  g.beginPath(); g.ellipse(1080, 1080, 620, 560, -0.2, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 7; g.setLineDash([4, 26]); g.lineCap = "round";
  g.beginPath(); g.ellipse(1080, 1080, 900, 820, -0.2, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]);
  // highways
  g.strokeStyle = "rgba(26,58,92,0.12)"; g.lineWidth = 8;
  [[200, 1600, 1900, 500], [1080, 200, 1080, 1950], [250, 900, 1950, 1250]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
  // river Mapocho
  g.strokeStyle = "rgba(94,132,158,0.55)"; g.lineWidth = 26; g.lineCap = "round";
  g.beginPath(); g.moveTo(80, 760);
  g.bezierCurveTo(420, 640, 640, 900, 980, 820);
  g.bezierCurveTo(1280, 760, 1500, 640, 1980, 560); g.stroke();
  g.fillStyle = C.inkSoft; g.font = `500 34px ${MONO}`; g.fillText("MAPOCHO", 110, 720);

  g.font = `500 32px ${MONO}`;
  for (const p of MAP_POINTS) {
    g.fillStyle = C.steel; g.beginPath(); g.arc(p.x, p.y, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.inkSoft; g.fillText(p.name, p.x + 22, p.y + 11);
  }
  g.fillStyle = C.ink; g.font = `600 30px ${RUBIK}`;
  g.fillText("REGIÓN METROPOLITANA", 90, 1960);
  return makeTex(cv);
};
