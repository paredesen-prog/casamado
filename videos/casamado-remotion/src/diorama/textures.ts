import * as THREE from "three";
import { mulberry32 } from "../rng";
import { RUBIK } from "../fonts";

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};

const finish = (c: HTMLCanvasElement, repeat = 1, color = true) => {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
};

// Tileable value noise on a lattice, summed in octaves.
const makeNoise = (seed: number, cells: number) => {
  const r = mulberry32(seed);
  const g = Array.from({ length: cells * cells }, () => r());
  const at = (x: number, y: number) => g[((y % cells) + cells) % cells * cells + (((x % cells) + cells) % cells)];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const x = u * cells, y = v * cells;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = s(x - x0), fy = s(y - y0);
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
};
const fbm = (seed: number, base: number, oct: number) => {
  const ns = Array.from({ length: oct }, (_, i) => makeNoise(seed + i * 97, base << i));
  return (u: number, v: number) => {
    let s = 0, a = 0.5, n = 0;
    for (const f of ns) { s += f(u, v) * a; n += a; a *= 0.5; }
    return s / n;
  };
};

/** Gray stone floor: soft cloudy patches + fine speckle (terrazzo / honed granite). */
export const marbleTexture = () => {
  const N = 1024;
  const [c, g] = canvas(N, N);
  const img = g.createImageData(N, N);
  const cloud = fbm(11, 6, 6);
  const fine = fbm(31, 48, 2);
  const grain = mulberry32(5);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      const patch = Math.max(0, Math.min(1, (cloud(u, v) - 0.4) * 2.6));
      const k = 0.9 - patch * 0.24 + (fine(u, v) - 0.5) * 0.12 + (grain() - 0.5) * 0.07;
      const i = (y * N + x) * 4;
      img.data[i] = 200 * k;
      img.data[i + 1] = 196 * k;
      img.data[i + 2] = 190 * k;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return finish(c, 1);
};

/** Warm oak / teak grain running along v. */
export const woodTexture = (seed = 3) => {
  const W = 512, H = 1024;
  const [c, g] = canvas(W, H);
  const img = g.createImageData(W, H);
  const warp = fbm(seed, 4, 4);
  const fleck = mulberry32(seed + 1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const ring = Math.sin((u * 26 + warp(u * 0.5, v) * 6) * Math.PI);
      const k = 0.86 + ring * 0.07 + (warp(u * 4, v * 0.25) - 0.5) * 0.18 + (fleck() - 0.5) * 0.04;
      const i = (y * W + x) * 4;
      img.data[i] = 196 * k;
      img.data[i + 1] = 124 * k;
      img.data[i + 2] = 74 * k;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return finish(c, 1);
};

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};

const contain = (g: CanvasRenderingContext2D, im: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) => {
  const s = Math.min(w / im.width, h / im.height);
  g.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s);
};

type Img = HTMLImageElement;

/** Ultrawide monitor: a casamado.cl-style storefront. */
export const storeScreenTexture = (logo: Img, products: Img[]) => {
  const W = 1600, H = 680;
  const [c, g] = canvas(W, H);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#F7F8FA");
  bg.addColorStop(1, "#E9EEF3");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#1A3A5C";
  g.fillRect(0, 0, W, 92);
  contain(g, logo, 36, 14, 64, 64);
  g.fillStyle = "#FFFFFF";
  g.font = `600 40px ${RUBIK}`;
  g.fillText("casamado", 116, 60);
  g.font = `500 24px ${RUBIK}`;
  ["Oficina", "Aseo", "Cafetería", "Tecnología", "Ferretería"].forEach((t, i) => g.fillText(t, 560 + i * 170, 56));
  // hero
  g.fillStyle = "#1A3A5C";
  g.font = `700 62px ${RUBIK}`;
  g.fillText("Todo para tu oficina,", 60, 200);
  g.fillText("en un solo pedido.", 60, 272);
  g.fillStyle = "#F5A623";
  rr(g, 60, 312, 330, 70, 35);
  g.fill();
  g.fillStyle = "#1A3A5C";
  g.font = `600 30px ${RUBIK}`;
  g.fillText("Ver catálogo  →", 98, 358);
  g.fillStyle = "#53748B";
  g.font = `500 26px ${RUBIK}`;
  g.fillText("Despacho gratis sobre $70.000 en la RM", 60, 440);
  // product cards
  const cw = 200, ch = 250;
  products.slice(0, 4).forEach((im, i) => {
    const x = 760 + (i % 4) * (cw + 20), y = 140;
    g.fillStyle = "#FFFFFF";
    rr(g, x, y, cw, ch, 18);
    g.fill();
    contain(g, im, x + 20, y + 18, cw - 40, ch - 80);
    g.fillStyle = "#1A3A5C";
    rr(g, x + 20, y + ch - 44, 110, 14, 7);
    g.fill();
    g.fillStyle = "#C9D3DD";
    rr(g, x + 20, y + ch - 24, 70, 10, 5);
    g.fill();
  });
  g.fillStyle = "#DDE4EB";
  for (let i = 0; i < 4; i++) {
    rr(g, 760 + i * 220, 420, cw, 210, 18);
    g.fill();
  }
  return finish(c);
};

/** Laptop: order confirmation. */
export const orderScreenTexture = (logo: Img) => {
  const W = 800, H = 520;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#1A3A5C";
  g.fillRect(0, 0, W, H);
  contain(g, logo, 330, 60, 140, 140);
  g.fillStyle = "#FFFFFF";
  g.textAlign = "center";
  g.font = `700 52px ${RUBIK}`;
  g.fillText("Pedido confirmado", W / 2, 290);
  g.fillStyle = "#F5A623";
  g.font = `600 34px ${RUBIK}`;
  g.fillText("Llega mañana ✓", W / 2, 350);
  g.fillStyle = "rgba(255,255,255,.25)";
  rr(g, 200, 400, 400, 14, 7);
  g.fill();
  rr(g, 260, 430, 280, 14, 7);
  g.fill();
  return finish(c);
};

/** Abstract sunset print (navy / amber). */
export const posterSunset = () => {
  const W = 400, H = 560;
  const [c, g] = canvas(W, H);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#F7C873");
  sky.addColorStop(0.6, "#F09A4B");
  sky.addColorStop(1, "#C2552B");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#FFF1D2";
  g.beginPath();
  g.arc(W * 0.6, H * 0.4, 70, 0, Math.PI * 2);
  g.fill();
  const hills = ["#8B3C26", "#1A3A5C", "#0F2740"];
  hills.forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, H);
    const base = H * (0.55 + i * 0.13);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, base - Math.sin(x / (60 + i * 25) + i * 2) * (28 - i * 6) - (i === 0 ? 30 : 0));
    g.lineTo(W, H);
    g.fill();
  });
  return finish(c);
};

/** Typographic brand print. */
export const posterBrand = (logo: Img) => {
  const W = 400, H = 560;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#F3EDE3";
  g.fillRect(0, 0, W, H);
  contain(g, logo, 120, 90, 160, 160);
  g.fillStyle = "#1A3A5C";
  g.textAlign = "center";
  g.font = `700 52px ${RUBIK}`;
  g.fillText("casamado", W / 2, 330);
  g.fillStyle = "#F5A623";
  g.fillRect(150, 360, 100, 8);
  g.fillStyle = "#53748B";
  g.font = `500 22px ${RUBIK}`;
  g.fillText("insumos para empresas", W / 2, 410);
  return finish(c);
};

/** Small line-art print. */
export const posterLines = () => {
  const W = 400, H = 400;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#1A3A5C";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "#F5A623";
  g.lineWidth = 6;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.arc(W / 2, H * 0.95, 40 + i * 32, Math.PI, Math.PI * 2);
    g.stroke();
  }
  return finish(c);
};

export const clockTexture = () => {
  const N = 512;
  const [c, g] = canvas(N, N);
  g.fillStyle = "#F4F1EC";
  g.fillRect(0, 0, N, N);
  g.translate(N / 2, N / 2);
  g.fillStyle = "#1E1E22";
  for (let i = 0; i < 12; i++) {
    g.save();
    g.rotate((i / 12) * Math.PI * 2);
    g.fillRect(-5, -230, 10, i % 3 === 0 ? 46 : 26);
    g.restore();
  }
  g.lineCap = "round";
  g.strokeStyle = "#1E1E22";
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(Math.cos(-2.2) * 120, Math.sin(-2.2) * 120);
  g.stroke();
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(Math.cos(-0.5) * 190, Math.sin(-0.5) * 190);
  g.stroke();
  g.fillStyle = "#F5A623";
  g.beginPath();
  g.arc(0, 0, 14, 0, Math.PI * 2);
  g.fill();
  return finish(c);
};

/** Wood planks: grain + staggered seams. `tone` tints the base colour. */
export const plankTexture = (seed = 7, tone: [number, number, number] = [205, 150, 102]) => {
  const W = 1024, H = 1024;
  const [c, g] = canvas(W, H);
  const img = g.createImageData(W, H);
  const warp = fbm(seed, 6, 4);
  const r = mulberry32(seed);
  const rows = 8, plankLen = 0.5;
  const offs = Array.from({ length: rows }, () => r());
  const shade = Array.from({ length: rows * 4 }, () => 0.9 + r() * 0.16);
  for (let y = 0; y < H; y++) {
    const row = Math.floor((y / H) * rows);
    const vy = (y / H) * rows - row;
    for (let x = 0; x < W; x++) {
      const u = x / W + offs[row];
      const seg = Math.floor(u / plankLen);
      const su = (u / plankLen) % 1;
      const grain = Math.sin((vy * 9 + warp(u, y / H) * 5) * Math.PI) * 0.05;
      let k = shade[(row * 4 + seg) % shade.length] + grain + (warp(u * 3, y / H * 3) - 0.5) * 0.12;
      if (vy < 0.025 || su < 0.006) k *= 0.55;
      const i = (y * W + x) * 4;
      img.data[i] = tone[0] * k;
      img.data[i + 1] = tone[1] * k;
      img.data[i + 2] = tone[2] * k;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return finish(c, 1);
};

/** Square tiles with grout; checker optional. */
export const tileTexture = (a: string, b: string, n = 8, grout = "#B9B4AC", seed = 3) => {
  const N = 1024;
  const [c, g] = canvas(N, N);
  const r = mulberry32(seed);
  const s = N / n;
  g.fillStyle = grout;
  g.fillRect(0, 0, N, N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = (x + y) % 2 ? b : a;
    g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
    g.fillStyle = `rgba(255,255,255,${r() * 0.06})`;
    g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
  }
  return finish(c, 1);
};

/** Speckled carpet tiles / concrete: base colour + fine noise. */
export const speckleTexture = (base: [number, number, number], amount = 0.12, cloudAmt = 0.08, seed = 9) => {
  const N = 512;
  const [c, g] = canvas(N, N);
  const img = g.createImageData(N, N);
  const r = mulberry32(seed);
  const cloud = fbm(seed, 4, 5);
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = Math.floor(i / N);
    const k = 1 + (r() - 0.5) * amount + (cloud(x / N, y / N) - 0.5) * cloudAmt * 2;
    img.data[i * 4] = base[0] * k;
    img.data[i * 4 + 1] = base[1] * k;
    img.data[i * 4 + 2] = base[2] * k;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return finish(c, 1);
};

/** Kraft shipping box face with the Casamado logo and tape. */
export const kraftTexture = (logo: Img) => {
  const W = 512, H = 512;
  const [c, g] = canvas(W, H);
  g.fillStyle = "#C2935E";
  g.fillRect(0, 0, W, H);
  const r = mulberry32(4);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(90,60,30,${r() * 0.08})`;
    g.fillRect(r() * W, r() * H, 2 + r() * 6, 1);
  }
  g.fillStyle = "rgba(255,255,255,.18)";
  g.fillRect(W / 2 - 40, 0, 80, H);
  contain(g, logo, 150, 120, 212, 212);
  g.fillStyle = "#1A3A5C";
  g.textAlign = "center";
  g.font = `700 54px ${RUBIK}`;
  g.fillText("casamado", W / 2, 400);
  return finish(c);
};
