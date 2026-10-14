import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { SIZE, STATIONS, STATION_LEN, STATION_MOVE, T, wx, wz } from "./constants";

export type V3 = [number, number, number];
export type Cam = { pos: V3; target: V3; fov: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mix = (a: Cam, b: Cam, t: number): Cam => ({ pos: lerp3(a.pos, b.pos, t), target: lerp3(a.target, b.target, t), fov: lerp(a.fov, b.fov, t) });

const orbit = (c: Cam, angle: number): Cam => {
  const dx = c.pos[0] - c.target[0];
  const dz = c.pos[2] - c.target[2];
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return { ...c, pos: [c.target[0] + dx * cos - dz * sin, c.pos[1], c.target[2] + dx * sin + dz * cos] };
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

export const TOP: Cam = { pos: [0, 21, -1.0], target: [0, 0, -1.01], fov: 35 };
export const HOME: Cam = { pos: [-4.0, 11.4, 11.6], target: [0.35, 0, -0.75], fov: 35 };
export const OVERVIEW: Cam = { pos: [-5.4, 13.4, 11.6], target: [-0.2, 0, -1.7], fov: 35 };

const YAWS = [-0.28, 0.3, -0.12, 0.34, 0.22, -0.18];
export const stationCam = (i: number): Cam => {
  const s = STATIONS[i];
  const target: V3 = [wx(s.target[0]), 0.55, wz(s.target[1])];
  const base: Cam = { pos: [target[0] - 0.8, target[1] + 4.0, target[2] + 3.7], target, fov: 34 };
  return orbit(base, YAWS[i]);
};

export const camAt = (f: number): Cam => {
  if (f < 45) return { ...TOP, pos: [0, interpolate(f, [0, 45], [21.6, 21]), -1.0] };
  if (f < 125) return mix(TOP, HOME, ease(interpolate(f, [45, 125], [0, 1])));
  if (f < T.tourStart) return orbit(HOME, interpolate(f, [125, T.tourStart], [0, -0.16]));

  if (f < T.countStart) {
    const i = Math.min(STATIONS.length - 1, Math.floor((f - T.tourStart) / STATION_LEN));
    const local = f - (T.tourStart + i * STATION_LEN);
    const prev = i === 0 ? orbit(HOME, -0.16) : stationCam(i - 1);
    const cur = stationCam(i);
    if (local < STATION_MOVE) return mix(prev, cur, ease(local / STATION_MOVE));
    return orbit(cur, interpolate(local, [STATION_MOVE, STATION_LEN], [0, 0.04]));
  }

  const last = orbit(stationCam(STATIONS.length - 1), 0.04);
  if (f < T.countStart + 75) return mix(last, OVERVIEW, easeOut(interpolate(f, [T.countStart, T.countStart + 75], [0, 1])));
  return orbit(OVERVIEW, interpolate(f, [T.countStart + 75, T.officeEnd], [0, 0.07]));
};

const scratch = new THREE.PerspectiveCamera(35, 1, 0.1, 300);
const v = new THREE.Vector3();
export const project = (c: Cam, p: V3): [number, number] => {
  scratch.fov = c.fov;
  scratch.position.set(...c.pos);
  scratch.lookAt(...c.target);
  scratch.updateProjectionMatrix();
  scratch.updateMatrixWorld(true);
  v.set(...p).project(scratch);
  return [((v.x + 1) / 2) * SIZE, ((1 - v.y) / 2) * SIZE];
};
