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

export const ROOM_LABELS: [string, number, number][] = [
  ["BAÑO", 130, 282], ["ESCRITORIOS", 480, 485], ["COCINA", 850, 282], ["SALA TI", 850, 525],
  ["BODEGA DE ASEO", 480, 690], ["MANTENCIÓN", 850, 785], ["RECEPCIÓN", 130, 560],
];

export type Product = { key: string; file: string; x: number; y: number; h: number; base: number };
// h = visual height (world units); base = height of the surface it stands on.
export const PRODUCTS: Product[] = [
  { key: "tork", file: "image-66.png", x: 128, y: 236, h: 0.66, base: 0 },
  { key: "disp", file: "dispensador-jabon-multiflex-plastico-neg.png", x: 228, y: 228, h: 0.55, base: 0 },
  { key: "cafe", file: "haiti-cafe-molido-super-moka-bolsa-250gr.png", x: 768, y: 40, h: 0.6, base: 0.9 },
  { key: "galleta", file: "galleta-coco-120-gr.png", x: 836, y: 196, h: 0.3, base: 0.76 },
  { key: "papel", file: "papel-fotocopia-a4-500-hjs-75-gr-excelle.png", x: 362, y: 266, h: 0.56, base: 0.76 },
  { key: "cuaderno", file: "cuaderno-universitario-7-mm100-hjs-1.png", x: 425, y: 268, h: 0.5, base: 0.76 },
  { key: "teclado", file: "image-69.png", x: 810, y: 384, h: 0.26, base: 0.76 },
  { key: "guantes", file: "image-33.png", x: 885, y: 592, h: 0.55, base: 0.925 },
  { key: "jabon", file: "jabn-lquido.png", x: 468, y: 690, h: 0.8, base: 0 },
  { key: "toallitas", file: "image-67.png", x: 588, y: 700, h: 0.6, base: 0 },
];

export type Station = { label: string; n: string; items: string[]; target: [number, number]; chip: [number, number] };
export const STATIONS: Station[] = [
  { label: "PAPEL TISSUE", n: "124", items: ["tork", "disp"], target: [180, 215], chip: [178, 232] },
  { label: "CAFETERÍA", n: "146", items: ["cafe", "galleta"], target: [805, 110], chip: [800, 110] },
  { label: "OFICINA Y LIBRERÍA", n: "259", items: ["papel", "cuaderno"], target: [400, 262], chip: [395, 266] },
  { label: "TECNOLOGÍA", n: "80", items: ["teclado"], target: [818, 392], chip: [810, 380] },
  { label: "FERRETERÍA", n: "62", items: ["guantes"], target: [870, 612], chip: [880, 592] },
  { label: "ASEO Y LIMPIEZA", n: "540", items: ["jabon", "toallitas"], target: [528, 690], chip: [528, 695] },
];
export const STATION_LEN = 50; // frames per station
export const STATION_MOVE = 20; // frames of camera travel at the start of each station
