import * as THREE from "three";
import { C, FURNITURE, ROOM_LABELS } from "./constants";
import { MONO, RUBIK } from "./fonts";

const S = 2.048; // canvas px per plan unit (2048 x 1638)

const makeTex = (canvas: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

export const floorTexture = (mode: "light" | "blueprint") => {
  const cv = document.createElement("canvas");
  cv.width = 2048; cv.height = 1638;
  const g = cv.getContext("2d")!;
  const bp = mode === "blueprint";
  g.fillStyle = bp ? C.blueprint : "#FBFCFD";
  g.fillRect(0, 0, cv.width, cv.height);

  g.strokeStyle = bp ? "rgba(255,255,255,0.10)" : "rgba(26,58,92,0.07)";
  g.lineWidth = 2;
  for (let x = 0; x <= 1000; x += 25) { g.beginPath(); g.moveTo(x * S, 0); g.lineTo(x * S, cv.height); g.stroke(); }
  for (let y = 0; y <= 800; y += 25) { g.beginPath(); g.moveTo(0, y * S); g.lineTo(cv.width, y * S); g.stroke(); }

  g.strokeStyle = bp ? "rgba(255,255,255,0.85)" : "rgba(94,132,158,0.55)";
  g.lineWidth = bp ? 5 : 4;
  for (const f of FURNITURE) {
    if (f.round) { g.beginPath(); g.arc((f.x + f.w / 2) * S, (f.y + f.d / 2) * S, (f.w / 2) * S, 0, Math.PI * 2); g.stroke(); continue; }
    roundRect(g, f.x * S, f.y * S, f.w * S, f.d * S, 6); g.stroke();
  }

  g.fillStyle = bp ? "rgba(255,255,255,0.92)" : C.ink;
  g.font = `500 ${bp ? 34 : 32}px ${MONO}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const [t, x, y] of ROOM_LABELS) {
    const spaced = t.split("").join(" ");
    g.fillText(spaced, x * S, y * S);
  }
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
