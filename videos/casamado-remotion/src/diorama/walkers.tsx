import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { LOOKS, Person, Pose } from "./people";

type P2 = [number, number];

/** People walking back and forth along a polyline (world x/z), so the building feels alive. */
export type Walk = { path: P2[]; speed?: number; offset?: number; look: number; pose?: Pose; y?: number; seed: number };

// Paths follow the open floor and the door gaps (see Building `doors` in rooms.tsx).
export const WALKS: Walk[] = [
  // open office: along the aisle beside the desks
  { path: [[-2.2, -1.4], [-2.2, 1.5]], look: 6, seed: 31, offset: 0.4 },
  // lobby <-> cafeteria through the door in their shared wall
  { path: [[0.85, -1.95], [1.25, -2.7], [1.25, -4.3]], look: 1, seed: 32, offset: 1.8 },
  // visitor from the IT room door to the reception counter
  { path: [[2.7, 0.85], [1.6, 0.85], [0.55, -0.05]], look: 4, seed: 33, offset: 0.0 },
  // store room: worker carrying stock
  { path: [[-2.3, 4.9], [-2.3, 2.3]], look: 3, seed: 34, pose: "carry", offset: 1.0, speed: 0.7 },
  // meeting room: someone heading to the screen
  { path: [[-4.5, -2.35], [-2.5, -2.35]], look: 5, seed: 35, offset: 2.2, speed: 0.6 },
  // pedestrians on the "street" in front of the building (ground level)
  { path: [[-5.6, 6.1], [1.2, 6.1]], look: 2, seed: 36, y: -0.26, speed: 1.1 },
  { path: [[6.1, -5.6], [6.1, 1.2]], look: 0, seed: 37, y: -0.26, speed: 1.0, offset: 3.0 },
];

const segLens = (path: P2[]) => path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));

/** Ping-pong along the path; returns position, heading and distance travelled (for the gait). */
export const walkAt = (w: Walk, t: number) => {
  const lens = segLens(w.path);
  const L = lens.reduce((a, b) => a + b, 0);
  const travelled = (t * (w.speed ?? 0.9) + (w.offset ?? 0) * L) % (2 * L);
  const back = travelled > L;
  let d = back ? 2 * L - travelled : travelled;
  let k = 0;
  while (k < lens.length - 1 && d > lens[k]) d -= lens[k++];
  const a = w.path[k], b = w.path[k + 1];
  const u = Math.min(1, d / lens[k]);
  const dx = (b[0] - a[0]) * (back ? -1 : 1), dz = (b[1] - a[1]) * (back ? -1 : 1);
  return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, yaw: Math.atan2(-dx, -dz), travelled };
};

export const Walkers: React.FC<{ kraft: THREE.Texture }> = ({ kraft }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <group>
      {WALKS.map((w, i) => {
        const s = walkAt(w, t);
        const phase = (s.travelled / 0.62) * Math.PI; // ~0.62 m per step
        const bob = Math.abs(Math.sin(phase)) * 0.025;
        return (
          <Person key={i} p={[s.x, (w.y ?? 0) + bob, s.z]} yaw={s.yaw} pose={w.pose ?? "walk"} phase={phase} box={kraft} seed={w.seed} {...LOOKS[w.look % LOOKS.length]} />
        );
      })}
    </group>
  );
};
