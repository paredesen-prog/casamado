export const FPS = 30;
export const SIZE = 1080;

export const C = {
  paper: "#F3F5F7",
  ink: "#1A3A5C",
  inkSoft: "#53748B",
  steel: "#5E849E",
  amber: "#F5A623",
  blueprint: "#14304D",
  white: "#FFFFFF",
};

// Scene boundaries (frames @30fps).
export const T = {
  hookStart: 0,
  brandStart: 135,
  tourStart: 255,
  countStart: 555,
  officeEnd: 700,
  mapStart: 686,
  mapEnd: 870,
  endStart: 856,
  total: 990,
};

// Plan units: 1000 x 800 (x right, y down). World: 1 unit = 100 plan units, origin at plan center.
export const wx = (x: number) => x / 100 - 5;
export const wz = (y: number) => y / 100 - 4;

export type Seg = [number, number, number, number];
export const WALLS: Seg[] = [
  [40, 800, 0, 800], [0, 800, 0, 0], [0, 0, 1000, 0], [1000, 0, 1000, 800], [1000, 800, 180, 800],
  [260, 0, 260, 120], [260, 190, 260, 300], [260, 300, 0, 300],
  [700, 0, 700, 110], [700, 180, 700, 300], [700, 300, 1000, 300],
  [700, 300, 700, 380], [700, 450, 700, 540], [700, 540, 1000, 540],
  [260, 520, 420, 520], [500, 520, 700, 520], [700, 520, 700, 800], [260, 520, 260, 800],
  [180, 800, 180, 740],
];

// x, y, w, d (plan units), height (world units), kind
export type Furn = { x: number; y: number; w: number; d: number; h: number; round?: boolean; color?: string };
export const FURNITURE: Furn[] = [
  { x: 30, y: 30, w: 70, d: 90, h: 0.16 }, { x: 30, y: 170, w: 70, d: 90, h: 0.16 }, { x: 160, y: 30, w: 70, d: 60, h: 0.3 },
  { x: 730, y: 30, w: 240, d: 60, h: 0.34 }, { x: 805, y: 165, w: 90, d: 90, h: 0.24, round: true, color: "#E4CFAE" },
  { x: 310, y: 60, w: 150, d: 80, h: 0.22, color: "#E4CFAE" }, { x: 500, y: 60, w: 150, d: 80, h: 0.22, color: "#E4CFAE" },
  { x: 310, y: 210, w: 150, d: 80, h: 0.22, color: "#E4CFAE" }, { x: 500, y: 210, w: 150, d: 80, h: 0.22, color: "#E4CFAE" },
  { x: 310, y: 360, w: 150, d: 80, h: 0.22, color: "#E4CFAE" }, { x: 500, y: 360, w: 150, d: 80, h: 0.22, color: "#E4CFAE" },
  { x: 740, y: 330, w: 220, d: 70, h: 0.26 }, { x: 740, y: 440, w: 100, d: 70, h: 0.4, color: "#C3CED8" },
  { x: 290, y: 560, w: 390, d: 40, h: 0.5, color: "#C3CED8" }, { x: 290, y: 740, w: 390, d: 40, h: 0.5, color: "#C3CED8" }, { x: 730, y: 570, w: 40, d: 200, h: 0.5, color: "#C3CED8" },
  { x: 40, y: 360, w: 160, d: 70, h: 0.32, color: "#2B4E72" },
];

export const ROOM_LABELS: [string, number, number][] = [
  ["BAÑO", 130, 282], ["ESCRITORIOS", 480, 485], ["COCINA", 850, 282], ["SALA TI", 850, 525],
  ["BODEGA DE ASEO", 480, 690], ["MANTENCIÓN", 850, 785], ["RECEPCIÓN", 130, 560],
];

export type Product = { key: string; file: string; x: number; y: number; h: number; base: number };
// h = visual height (world units); base = height of the surface it stands on.
export const PRODUCTS: Product[] = [
  { key: "tork", file: "image-66.png", x: 150, y: 222, h: 0.78, base: 0 },
  { key: "disp", file: "dispensador-jabon-multiflex-plastico-neg.png", x: 222, y: 150, h: 1.05, base: 0 },
  { key: "cafe", file: "haiti-cafe-molido-super-moka-bolsa-250gr.png", x: 790, y: 64, h: 0.95, base: 0.34 },
  { key: "galleta", file: "galleta-coco-120-gr.png", x: 852, y: 214, h: 0.5, base: 0.24 },
  { key: "papel", file: "papel-fotocopia-a4-500-hjs-75-gr-excelle.png", x: 385, y: 252, h: 0.95, base: 0.22 },
  { key: "cuaderno", file: "cuaderno-universitario-7-mm100-hjs-1.png", x: 575, y: 252, h: 0.9, base: 0.22 },
  { key: "teclado", file: "image-69.png", x: 850, y: 368, h: 0.55, base: 0.26 },
  { key: "guantes", file: "image-33.png", x: 870, y: 690, h: 1.0, base: 0 },
  { key: "jabon", file: "jabn-lquido.png", x: 430, y: 586, h: 1.1, base: 0.5 },
  { key: "toallitas", file: "image-67.png", x: 565, y: 586, h: 0.9, base: 0.5 },
];

export type Station = { label: string; n: string; items: string[]; target: [number, number]; chip: [number, number] };
export const STATIONS: Station[] = [
  { label: "PAPEL TISSUE", n: "124", items: ["tork", "disp"], target: [185, 190], chip: [185, 190] },
  { label: "CAFETERÍA", n: "146", items: ["cafe", "galleta"], target: [822, 140], chip: [822, 130] },
  { label: "OFICINA Y LIBRERÍA", n: "259", items: ["papel", "cuaderno"], target: [480, 252], chip: [480, 252] },
  { label: "TECNOLOGÍA", n: "80", items: ["teclado"], target: [850, 400], chip: [850, 368] },
  { label: "FERRETERÍA", n: "62", items: ["guantes"], target: [860, 680], chip: [870, 690] },
  { label: "ASEO Y LIMPIEZA", n: "540", items: ["jabon", "toallitas"], target: [497, 600], chip: [497, 586] },
];
export const STATION_LEN = 50; // frames per station
export const STATION_MOVE = 20; // frames of camera travel at the start of each station
