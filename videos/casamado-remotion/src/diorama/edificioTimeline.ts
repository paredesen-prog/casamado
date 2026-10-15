import { Easing, interpolate } from "remotion";
import * as THREE from "three";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Scene boundaries (frames @30fps).
export const E = {
  brand: 120,
  tour: 210,
  stopLen: 96,
  overview: 690,
  delivery: 810,
  end: 930,
  total: 1050,
};

const CELL = 3.6;
export const roomXZ = (i: number, j: number): [number, number] => [(i - 1) * CELL, (j - 1) * CELL];

export type Stop = { room: string; i: number; j: number; chips: { label: string; n: string; at: [number, number, number] }[]; az: number };

// One camera stop per room on the tour; chip anchors are room-local.
export const STOPS: Stop[] = [
  { room: "office", i: 0, j: 1, az: 40, chips: [{ label: "OFICINA Y LIBRERÍA", n: "259", at: [0.4, 1.35, -0.3] }] },
  { room: "cafe", i: 1, j: 0, az: 50, chips: [{ label: "CAFETERÍA", n: "146", at: [-0.4, 1.55, -1.2] }] },
  { room: "wc", i: 2, j: 0, az: 44, chips: [{ label: "PAPEL TISSUE", n: "124", at: [0.6, 1.05, 0.3] }] },
  {
    room: "store", i: 0, j: 2, az: 40,
    chips: [
      { label: "ASEO Y LIMPIEZA", n: "540", at: [-1.4, 2.05, -0.75] },
      { label: "FERRETERÍA", n: "62", at: [-1.4, 1.55, 0.75] },
    ],
  },
  { room: "it", i: 2, j: 1, az: 48, chips: [{ label: "TECNOLOGÍA", n: "80", at: [0.75, 1.3, 0.1] }] },
];

export const stopStart = (k: number) => E.tour + k * E.stopLen;
export const chipFrame = (k: number, c = 0) => stopStart(k) + 40 + c * 10;

/** Frame at which each room's products start dropping. */
export const ROOM_DROP: Record<string, number> = {
  office: stopStart(0) + 24,
  cafe: stopStart(1) + 24,
  wc: stopStart(2) + 24,
  store: stopStart(3) + 24,
  it: stopStart(4) + 24,
  meeting: E.overview + 12,
  lobby: E.overview + 22,
  boss: E.overview + 32,
};

/* ---------------------------------------------------------------- camera */

type Shot = { target: [number, number, number]; az: number; el: number; width: number; vw?: number }; // vw: portrait width override
const WIDE: Shot = { target: [-0.9, 0, -0.9], az: 45, el: 40, width: 18.5 };
const HOOK0: Shot = { target: [-1.6, 0, -1.6], az: 30, el: 60, width: 19 };
const room = (k: number): Shot => {
  const s = STOPS[k];
  const [x, z] = roomXZ(s.i, s.j);
  return { target: [x - 0.25, 0.55, z - 0.25], az: s.az, el: 41, width: 7.0 };
};
const VAN: Shot = { target: [3.1, 0.9, 3.4], az: 44, el: 36, width: 9.5 };
const END: Shot = { target: [-2.6, 0, -2.6], az: 47, el: 40, width: 28, vw: 24.5 * 0.84 };

// [frame, shot] keys; between keys the camera eases, on equal shots it holds.
const KEYS: [number, Shot][] = [
  [0, HOOK0],
  [E.brand, WIDE],
  [E.tour - 10, { ...WIDE, az: 47 }],
  ...STOPS.reduce<[number, Shot][]>((acc, _, k) => [
    ...acc,
    [stopStart(k) + 28, room(k)],
    [stopStart(k) + E.stopLen - 6, { ...room(k), az: room(k).az + 4 }],
  ], []),
  [E.overview + 30, WIDE],
  [E.delivery - 6, { ...WIDE, az: 42 }],
  [E.delivery + 30, VAN],
  [E.end - 4, { ...VAN, az: 48, width: 8.8 }],
  [E.end + 46, END],
  [E.total, { ...END, az: END.az + 7 }],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type CamState = { pos: THREE.Vector3; target: THREE.Vector3; fov: number };
export const VFOV = 22;

export const camAt = (frame: number, aspect: number): CamState => {
  let i = 0;
  while (i < KEYS.length - 2 && frame >= KEYS[i + 1][0]) i++;
  const [f0, a] = KEYS[i];
  const [f1, b] = KEYS[i + 1];
  const t = interpolate(frame, [f0, f1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const az = THREE.MathUtils.degToRad(lerp(a.az, b.az, t));
  const el = THREE.MathUtils.degToRad(lerp(a.el, b.el, t));
  const wOf = (x: Shot) => (aspect < 1 ? x.vw ?? x.width * 0.84 : x.width); // portrait fills more of the frame
  const width = lerp(wOf(a), wOf(b), t);
  const target = new THREE.Vector3(lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t));
  // distance so that `width` metres span the frame horizontally (portrait frames get extra height for text)
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(VFOV) / 2) * Math.min(1, aspect));
  const dist = width / (2 * Math.tan(hfov / 2));
  const pos = new THREE.Vector3(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el));
  return { pos, target, fov: aspect < 1 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / aspect)) : VFOV };
};

const scratch = new THREE.PerspectiveCamera();
const v = new THREE.Vector3();
export const project = (c: CamState, p: [number, number, number], w: number, h: number): [number, number] => {
  scratch.fov = c.fov;
  scratch.aspect = w / h;
  scratch.near = 1;
  scratch.far = 200;
  scratch.position.copy(c.pos);
  scratch.lookAt(c.target);
  scratch.updateProjectionMatrix();
  scratch.updateMatrixWorld();
  v.set(...p).project(scratch);
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
};

/* ------------------------------------------------------------------- van */

export const VAN_PARK: [number, number, number] = [CELL * 0.98, -0.26, CELL * 0.98];
export const VAN_YAW = Math.PI / 4;
const VAN_DIR = new THREE.Vector3(Math.cos(VAN_YAW), 0, -Math.sin(VAN_YAW)); // local +x (cab forward)
export const VAN_ARRIVE = [E.delivery + 4, E.delivery + 58] as const;
export const vanAt = (frame: number) => {
  const t = interpolate(frame, [VAN_ARRIVE[0], VAN_ARRIVE[1]], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const back = (1 - t) * 16;
  return {
    visible: frame >= VAN_ARRIVE[0] - 2,
    pos: [VAN_PARK[0] - VAN_DIR.x * back, VAN_PARK[1], VAN_PARK[2] - VAN_DIR.z * back] as [number, number, number],
    wheel: -back / 0.3,
  };
};
