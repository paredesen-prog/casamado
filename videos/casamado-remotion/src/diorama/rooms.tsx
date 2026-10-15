import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { DropCtx, useDrop } from "./drop";
import { ROOM_DROP } from "./edificioTimeline";
import { LOOKS, Person } from "./people";
import { Books, Box, Cyl, DeskSetup, Frame, OfficeChair, Plant, ProductBox, ProductCard, RBox, ShelfRack } from "./props";

type V3 = [number, number, number];
export type Tex = Record<
  "papel" | "cuaderno" | "cafe" | "galleta" | "tork" | "disp" | "jabon" | "toallitas" | "guantes" | "teclado" | "logo",
  THREE.Texture
>;
export type Mats = { wood: THREE.Texture; kraft: THREE.Texture; store: THREE.Texture; order: THREE.Texture; sunset: THREE.Texture; brand: THREE.Texture; lines: THREE.Texture; clock: THREE.Texture };

export const CELL = 3.6;
export const HALF = CELL / 2;
export const T = 0.12;
export const H_OUT = 2.5;
export const H_IN = 1.3;
export const WALL_BODY = "#EEE8DE";

/* ------------------------------------------------------------------ walls */

export type Opening = { a0: number; a1: number; y0: number; y1: number; glass?: boolean };

/** A straight wall. axis "x": runs along x at z=c, visible face +z. axis "z": runs along z at x=c, visible face +x. */
export const WallRun: React.FC<{ axis: "x" | "z"; c: number; a0: number; a1: number; h: number; skin?: string; openings?: Opening[] }> = ({ axis, c, a0, a1, h, skin, openings = [] }) => {
  const pieces: { p0: number; p1: number; y0: number; y1: number }[] = [];
  const glass: Opening[] = [];
  let cur = a0;
  for (const o of [...openings].sort((p, q) => p.a0 - q.a0)) {
    if (o.a0 > cur) pieces.push({ p0: cur, p1: o.a0, y0: 0, y1: h });
    if (o.y0 > 0) pieces.push({ p0: o.a0, p1: o.a1, y0: 0, y1: o.y0 });
    if (o.y1 < h) pieces.push({ p0: o.a0, p1: o.a1, y0: o.y1, y1: h });
    if (o.glass) glass.push(o);
    cur = o.a1;
  }
  if (cur < a1) pieces.push({ p0: cur, p1: a1, y0: 0, y1: h });
  const at = (along: number, y: number, across: number): V3 => (axis === "x" ? [along, y, c + across] : [c + across, y, along]);
  const size = (len: number, hh: number, th: number): V3 => (axis === "x" ? [len, hh, th] : [th, hh, len]);
  return (
    <group>
      {pieces.map((p, i) => (
        <group key={i}>
          <Box p={at((p.p0 + p.p1) / 2, (p.y0 + p.y1) / 2, 0)} s={size(p.p1 - p.p0, p.y1 - p.y0, T)} c={WALL_BODY} r={0.9} />
          {skin ? <Box p={at((p.p0 + p.p1) / 2, (p.y0 + p.y1) / 2, T / 2 + 0.002)} s={size(p.p1 - p.p0, p.y1 - p.y0, 0.004)} c={skin} r={0.9} /> : null}
        </group>
      ))}
      {glass.map((o, i) => {
        const mid = (o.a0 + o.a1) / 2, ym = (o.y0 + o.y1) / 2, w = o.a1 - o.a0, hh = o.y1 - o.y0;
        return (
          <group key={`g${i}`}>
            {/* frame */}
            <Box p={at(o.a0 + 0.025, ym, 0)} s={size(0.05, hh, T + 0.02)} c="#F7F5F1" r={0.5} />
            <Box p={at(o.a1 - 0.025, ym, 0)} s={size(0.05, hh, T + 0.02)} c="#F7F5F1" r={0.5} />
            <Box p={at(mid, o.y1 - 0.025, 0)} s={size(w, 0.05, T + 0.02)} c="#F7F5F1" r={0.5} />
            <Box p={at(mid, o.y0 + 0.02, 0.05)} s={size(w + 0.08, 0.04, T + 0.1)} c="#F7F5F1" r={0.5} />
            <Box p={at(mid, ym, 0)} s={size(0.035, hh, T + 0.01)} c="#F7F5F1" r={0.5} />
            <mesh position={at(mid, ym, -0.01)} rotation={[0, axis === "x" ? 0 : Math.PI / 2, 0]}>
              <planeGeometry args={[w, hh]} />
              <meshBasicMaterial color="#FFF4E4" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/* ---------------------------------------------------------- furniture kit */

const SimpleChair: React.FC<{ p: V3; yaw?: number; c?: string }> = ({ p, yaw = 0, c = "#1A3A5C" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <RBox p={[0, 0.45, 0]} s={[0.42, 0.06, 0.42]} c={c} rad={0.02} r={0.85} />
    <RBox p={[0, 0.72, 0.19]} s={[0.42, 0.42, 0.05]} c={c} rad={0.02} r={0.85} />
    {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
      <Box key={`${sx}${sz}`} p={[sx * 0.18, 0.21, sz * 0.18]} s={[0.025, 0.42, 0.025]} c="#2A2B2F" r={0.4} m={0.5} />
    ))}
  </group>
);

const Table: React.FC<{ p: V3; w: number; d: number; wood: THREE.Texture; h?: number }> = ({ p, w, d, wood, h = 0.74 }) => (
  <group position={p}>
    <RBox p={[0, h - 0.022, 0]} s={[w, 0.045, d]} c="#FFFFFF" map={wood} r={0.45} rad={0.012} />
    {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
      <Box key={`${sx}${sz}`} p={[sx * (w / 2 - 0.08), (h - 0.045) / 2, sz * (d / 2 - 0.08)]} s={[0.04, h - 0.045, 0.04]} c="#1F1F22" r={0.4} m={0.5} />
    ))}
  </group>
);

const Monitor: React.FC<{ p: V3; yaw?: number; screen: THREE.Texture; w?: number }> = ({ p, yaw = 0, screen, w = 0.6 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box p={[0, 0.006, 0]} s={[0.2, 0.012, 0.14]} c="#2A2B2F" />
    <Box p={[0, 0.12, -0.02]} s={[0.04, 0.22, 0.025]} c="#2A2B2F" />
    <Box p={[0, 0.32, 0]} s={[w, w * 0.6, 0.025]} c="#141416" r={0.3} />
    <mesh position={[0, 0.32, 0.0135]}>
      <planeGeometry args={[w - 0.03, w * 0.6 - 0.03]} />
      <meshStandardMaterial map={screen} emissiveMap={screen} emissive="#ffffff" emissiveIntensity={0.85} toneMapped={false} />
    </mesh>
  </group>
);

export const KraftBox: React.FC<{ p: V3; s?: V3; kraft: THREE.Texture; yaw?: number; d?: number }> = ({ p, s = [0.5, 0.36, 0.4], kraft, yaw = 0, d = 0 }) => {
  const a = useDrop(d);
  if (!a.show) return null;
  return (
    <group position={[p[0], p[1] + a.y, p[2]]} rotation={[0, yaw, 0]} scale={[a.sx, a.sy, a.sx]}>
      <mesh position={[0, s[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={s} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} map={i === 0 || i === 4 ? kraft : undefined} color={i === 0 || i === 4 ? "#ffffff" : "#BF8F5A"} roughness={0.85} />
        ))}
      </mesh>
    </group>
  );
};

const Toilet: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Cyl p={[0, 0.2, 0.05]} r={0.17} r2={0.13} h={0.4} c="#FAFAFA" rough={0.15} />
    <RBox p={[0, 0.42, 0.06]} s={[0.36, 0.05, 0.44]} c="#FAFAFA" rad={0.02} r={0.15} />
    <RBox p={[0, 0.6, -0.17]} s={[0.4, 0.38, 0.16]} c="#FAFAFA" rad={0.03} r={0.15} />
  </group>
);

const ServerRack: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box p={[0, 1.0, 0]} s={[0.6, 2.0, 0.7]} c="#1E2024" r={0.4} m={0.3} />
    {Array.from({ length: 9 }, (_, k) => (
      <group key={k}>
        <Box p={[0, 0.3 + k * 0.18, 0.352]} s={[0.52, 0.12, 0.006]} c="#2C2F35" r={0.4} />
        <mesh position={[0.2, 0.3 + k * 0.18, 0.357]}>
          <planeGeometry args={[0.03, 0.02]} />
          <meshBasicMaterial color={k % 3 ? "#56D27A" : "#5AA9FF"} toneMapped={false} />
        </mesh>
      </group>
    ))}
  </group>
);

const Sofa: React.FC<{ p: V3; w: number; yaw?: number; c?: string }> = ({ p, w, yaw = 0, c = "#53748B" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <RBox p={[0, 0.22, 0]} s={[w, 0.3, 0.8]} c={c} rad={0.06} r={0.95} />
    <RBox p={[0, 0.55, -0.32]} s={[w, 0.5, 0.18]} c={c} rad={0.07} r={0.95} />
    <RBox p={[-w / 2 + 0.08, 0.42, 0]} s={[0.16, 0.36, 0.8]} c={c} rad={0.06} r={0.95} />
    <RBox p={[w / 2 - 0.08, 0.42, 0]} s={[0.16, 0.36, 0.8]} c={c} rad={0.06} r={0.95} />
    <RBox p={[-w / 4 + 0.05, 0.42, 0.04]} s={[w / 2 - 0.2, 0.12, 0.6]} c="#6B8BA1" rad={0.05} r={0.95} />
    <RBox p={[w / 4 - 0.05, 0.42, 0.04]} s={[w / 2 - 0.2, 0.12, 0.6]} c="#6B8BA1" rad={0.05} r={0.95} />
  </group>
);

/* ---------------------------------------------------------------- rooms */

type RoomProps = { tex: Tex; m: Mats };

/** 0,0 — meeting room. */
const Meeting: React.FC<RoomProps> = ({ tex, m }) => (
  <group>
    <Table p={[-0.1, 0, -0.35]} w={2.1} d={0.95} wood={m.wood} />
    {[-0.75, 0, 0.75].map((x) => (
      <React.Fragment key={x}>
        <SimpleChair p={[x - 0.1, 0, -1.15]} yaw={Math.PI} />
        <SimpleChair p={[x - 0.1, 0, 0.45]} />
      </React.Fragment>
    ))}
    <ProductBox p={[0.35, 0.74, -0.4]} size={[0.32, 0.014, 0.42]} tex={tex.cuaderno} face="top" side="#5C9A35" yaw={0.4} d={0} />
    <ProductBox p={[-0.55, 0.74, -0.35]} size={[0.36, 0.5, 0.08]} tex={tex.papel} yaw={0.7} d={1} />
    <Frame p={[-0.1, 1.55, -HALF + 0.08]} w={1.3} h={0.72} map={m.store} />
    <Plant p={[-1.4, 0, 1.25]} kind="bush" seed={31} size={1.2} pot="#E9E5DE" />
    <Plant p={[1.4, 0, -1.4]} kind="snake" seed={32} size={1.1} pot="#2B2B2F" />
    <Person p={[-0.85, 0, 0.45]} {...LOOKS[1]} pose="sit" seed={1} />
    <Person p={[0.65, 0, -1.15]} yaw={Math.PI} {...LOOKS[4]} pose="sit" seed={2} />
    <Person p={[1.2, 0, -0.7]} yaw={2.4} {...LOOKS[0]} pose="present" seed={3} />
  </group>
);

/** 0,1 — open-plan office. */
const OpenOffice: React.FC<RoomProps> = ({ tex, m }) => (
  <group>
    {[-0.55, 0.75].map((z, row) => (
      <group key={z}>
        <Table p={[-0.15, 0, z]} w={2.2} d={0.7} wood={m.wood} />
        {[-0.7, 0.4].map((x, k) => (
          <React.Fragment key={x}>
            <Monitor p={[x, 0.74, z - 0.18]} screen={k ? m.order : m.store} />
            <Box p={[x, 0.752, z + 0.08]} s={[0.4, 0.016, 0.13]} c="#26272B" />
            <OfficeChair p={[x, 0, z + 0.65]} yaw={0.15 * (row ? 1 : -1)} />
          </React.Fragment>
        ))}
      </group>
    ))}
    <ProductBox p={[0.85, 0.74, -0.65]} size={[0.36, 0.5, 0.08]} tex={tex.papel} yaw={0.6} d={0} />
    <ProductBox p={[0.95, 0.74, 0.7]} size={[0.32, 0.014, 0.42]} tex={tex.cuaderno} face="top" side="#5C9A35" yaw={0.3} d={1} />
    <ShelfRack p={[-1.55, 0, -0.1]} len={1.6} depth={0.32} levels={[0.08, 0.5, 0.92]} wood={m.wood} yaw={Math.PI / 2} />
    {[0, 1, 2].map((i) => (
      <ProductBox key={i} p={[-1.55, 0.095 + i * 0.075, -0.5]} size={[0.24, 0.075, 0.34]} tex={tex.papel} face="top" d={2 + i} />
    ))}
    <Books p={[-1.57, 0.515, 0.1]} seed={41} n={9} />
    <Plant p={[-1.55, 0.935, -0.4]} kind="small" seed={42} size={1.4} pot="#C66B3D" potH={0.13} potR={0.08} />
    <Plant p={[-1.55, 0.935, 0.45]} kind="trail" seed={43} size={0.8} pot="#F1EEE8" potH={0.15} potR={0.09} />
    <Person p={[-0.7, 0, 0.1]} yaw={-0.15} {...LOOKS[2]} pose="sit" seed={4} />
    <Person p={[0.4, 0, 1.4]} yaw={0.15} {...LOOKS[5]} pose="sit" seed={5} />
    <Person p={[-1.0, 0, 0.75]} yaw={Math.PI / 2} {...LOOKS[6]} seed={6} />
  </group>
);

/** 1,0 — cafeteria / kitchen. */
const Cafeteria: React.FC<RoomProps> = ({ tex, m }) => (
  <group>
    {/* base cabinets + counter along the back (-z) wall */}
    <Box p={[-0.3, 0.43, -1.45]} s={[2.6, 0.86, 0.6]} c="#F2EFEA" r={0.5} />
    <RBox p={[-0.3, 0.885, -1.43]} s={[2.66, 0.05, 0.66]} c="#FFFFFF" map={m.wood} rad={0.01} r={0.4} />
    {[-1.3, -0.65, 0, 0.65].map((x) => (
      <Box key={x} p={[x + 0.02, 0.6, -1.148]} s={[0.12, 0.012, 0.015]} c="#B9BBC0" m={0.8} r={0.3} />
    ))}
    {/* sink */}
    <Box p={[0.45, 0.905, -1.42]} s={[0.5, 0.01, 0.38]} c="#C9CDD1" m={0.8} r={0.25} />
    <Cyl p={[0.45, 1.05, -1.62]} r={0.015} h={0.3} c="#C9CDD1" m={0.9} rough={0.2} />
    {/* coffee machine */}
    <group position={[-1.1, 0.91, -1.5]}>
      <RBox p={[0, 0.2, 0]} s={[0.3, 0.4, 0.34]} c="#1E1E21" rad={0.02} r={0.3} />
      <Box p={[0, 0.12, 0.15]} s={[0.16, 0.12, 0.06]} c="#2A2B2F" />
    </group>
    {/* fridge */}
    <RBox p={[1.35, 0.95, -1.45]} s={[0.7, 1.9, 0.65]} c="#E9EAEC" rad={0.03} r={0.25} />
    <Box p={[1.08, 1.2, -1.11]} s={[0.025, 0.5, 0.03]} c="#9EA3A9" m={0.8} r={0.3} />
    {/* products on the counter */}
    <ProductCard p={[-0.55, 0.91, -1.4]} h={0.52} tex={tex.cafe} yaw={0.55} d={0} />
    <ProductCard p={[-0.15, 0.91, -1.35]} h={0.21} tex={tex.galleta} yaw={0.55} lean={0.15} d={1} />
    {/* bistro table */}
    <Cyl p={[0.1, 0.37, 0.35]} r={0.04} h={0.74} c="#1F1F22" m={0.5} rough={0.4} />
    <Cyl p={[0.1, 0.02, 0.35]} r={0.25} h={0.04} c="#1F1F22" m={0.5} rough={0.4} />
    <Cyl p={[0.1, 0.75, 0.35]} r={0.45} h={0.04} c="#F4F1EC" rough={0.3} />
    {[0, 2.1, 4.2].map((a) => (
      <SimpleChair key={a} p={[0.1 + Math.sin(a) * 0.75, 0, 0.35 + Math.cos(a) * 0.75]} yaw={a} c="#F5A623" />
    ))}
    <group position={[0.18, 0.77, 0.3]}>
      <Cyl p={[0, 0.05, 0]} r={0.04} h={0.1} c="#F1EEE8" rough={0.35} />
      <Cyl p={[0, 0.096, 0]} r={0.034} h={0.004} c="#3A2416" rough={0.2} />
    </group>
    <Plant p={[1.45, 0, 1.3]} kind="bush" seed={51} size={1.1} pot="#C66B3D" />
    <Person p={[-0.8, 0, -0.85]} {...LOOKS[3]} seed={7} />
    <Person p={[0.1, 0, 1.1]} {...LOOKS[0]} pose="sit" seed={8} />
  </group>
);

/** 1,1 — reception / lobby with today's delivery. */
const Reception: React.FC<RoomProps> = ({ m }) => (
  <group>
    {/* brand panel on the back wall */}
    <Box p={[0, 0.65, -HALF + 0.09]} s={[1.6, 1.25, 0.04]} c="#1A3A5C" r={0.6} />
    <Frame p={[0, 0.72, -HALF + 0.12]} w={0.62} h={0.86} map={m.brand} />
    {/* counter */}
    <RBox p={[0.1, 0.52, -0.7]} s={[1.9, 1.04, 0.55]} c="#F3EFE8" rad={0.03} r={0.5} />
    <RBox p={[0.1, 1.055, -0.7]} s={[2.0, 0.04, 0.62]} c="#FFFFFF" map={m.wood} rad={0.01} r={0.4} />
    <Box p={[0.1, 0.5, -0.42]} s={[1.9, 0.08, 0.004]} c="#F5A623" r={0.5} />
    <Monitor p={[-0.4, 1.075, -0.8]} screen={m.order} w={0.45} yaw={0.1} />
    <Sofa p={[-1.3, 0, 0.6]} w={1.5} yaw={Math.PI / 2} />
    {/* delivery that just arrived */}
    <KraftBox p={[0.55, 0, 0.55]} kraft={m.kraft} yaw={0.15} d={0} />
    <KraftBox p={[1.05, 0, 0.75]} kraft={m.kraft} yaw={-0.2} s={[0.42, 0.3, 0.36]} d={1} />
    <KraftBox p={[0.6, 0.36, 0.55]} kraft={m.kraft} yaw={0.35} s={[0.4, 0.28, 0.34]} d={2} />
    <Plant p={[1.45, 0, -1.4]} kind="bush" seed={61} size={1.35} pot="#E9E5DE" />
    <Plant p={[-1.45, 0, -1.4]} kind="snake" seed={62} size={1.15} pot="#2B2B2F" />
    <Person p={[0.55, 0, -1.2]} yaw={Math.PI} {...LOOKS[4]} seed={9} />
    <Person p={[-1.38, 0, 0.6]} yaw={-Math.PI / 2} {...LOOKS[1]} pose="sit" seed={10} />
  </group>
);

/** 2,0 — restroom. */
const Restroom: React.FC<RoomProps> = ({ tex }) => (
  <group>
    {/* two stalls along the back wall, low partitions */}
    {[-0.1, 0.9].map((x) => (
      <Toilet key={x} p={[x, 0, -1.45]} />
    ))}
    {[-0.6, 0.4, 1.4].map((x) => (
      <Box key={x} p={[x, 0.58, -1.3]} s={[0.04, 1.0, 0.9]} c="#1A3A5C" r={0.4} />
    ))}
    {/* sink counter along the -x wall */}
    <Box p={[-1.5, 0.8, 0.3]} s={[0.55, 0.1, 1.6]} c="#F4F2EE" r={0.3} />
    {[-0.1, 0.7].map((z) => (
      <group key={z}>
        <Cyl p={[-1.48, 0.86, z]} r={0.17} h={0.04} c="#FFFFFF" rough={0.1} />
        <Cyl p={[-1.68, 0.95, z]} r={0.012} h={0.2} c="#C9CDD1" m={0.9} rough={0.2} />
      </group>
    ))}
    <Box p={[-1.72, 1.15, 0.3]} s={[0.02, 0.25, 1.5]} c="#B9CCDA" m={0.9} r={0.05} />
    {/* products: soap refill + dispenser + paper towels */}
    <ProductCard p={[-1.45, 0.85, 1.0]} h={0.5} tex={tex.jabon} yaw={0.9} d={0} />
    <ProductCard p={[-1.68, 0.95, -0.55]} h={0.52} tex={tex.disp} yaw={Math.PI / 2 - 0.2} d={1} />
    <ProductBox p={[0.9, 0, 0.3]} size={[0.74, 0.33, 0.35]} tex={tex.tork} yaw={0.45} side="#F7F7F5" d={2} />
    <ProductBox p={[0.95, 0.33, 0.32]} size={[0.74, 0.33, 0.35]} tex={tex.tork} yaw={0.55} side="#F7F7F5" d={3} />
    <Plant p={[1.45, 0, 1.35]} kind="small" seed={71} size={1.8} pot="#E9E5DE" potH={0.2} potR={0.1} />
  </group>
);

/** 0,2 — store room: cleaning + hardware. */
const StoreRoom: React.FC<RoomProps> = ({ tex, m }) => (
  <group>
    {[-0.75, 0.75].map((z) => (
      <ShelfRack key={z} p={[-1.5, 0, z]} len={1.3} depth={0.45} levels={[0.08, 0.6, 1.12, 1.64]} wood={m.wood} yaw={Math.PI / 2} />
    ))}
    <ProductCard p={[-1.5, 0.095, -1.05]} h={0.42} tex={tex.jabon} yaw={1.0} d={0} />
    <ProductCard p={[-1.5, 0.095, -0.55]} h={0.42} tex={tex.jabon} yaw={1.0} d={1} />
    <ProductCard p={[-1.5, 0.615, -0.8]} h={0.44} tex={tex.toallitas} yaw={1.0} d={2} />
    <ProductCard p={[-1.5, 1.135, -0.8]} h={0.44} tex={tex.guantes} yaw={1.0} d={3} />
    <ProductBox p={[-1.5, 0.095, 0.75]} size={[0.74, 0.33, 0.35]} tex={tex.tork} yaw={Math.PI / 2} side="#F7F7F5" d={4} />
    <ProductBox p={[-1.5, 0.615, 0.75]} size={[0.74, 0.33, 0.35]} tex={tex.tork} yaw={Math.PI / 2} side="#F7F7F5" d={5} />
    <KraftBox p={[-1.5, 1.135, 0.75]} kraft={m.kraft} yaw={Math.PI / 2} s={[0.45, 0.3, 0.38]} d={6} />
    {/* pallet with boxes */}
    <group position={[0.4, 0, -0.6]}>
      <Box p={[0, 0.07, 0]} s={[1.2, 0.14, 1.0]} c="#B98D5A" r={0.9} />
      <KraftBox p={[-0.28, 0.14, -0.22]} kraft={m.kraft} d={7} />
      <KraftBox p={[0.28, 0.14, -0.22]} kraft={m.kraft} d={8} />
      <KraftBox p={[-0.28, 0.14, 0.24]} kraft={m.kraft} d={9} />
      <KraftBox p={[0.28, 0.14, 0.24]} kraft={m.kraft} d={10} />
      <KraftBox p={[0, 0.5, 0]} kraft={m.kraft} yaw={0.2} d={11} />
    </group>
    <Person p={[0.95, 0, 0.1]} yaw={2.5} {...LOOKS[3]} pose="carry" box={m.kraft} seed={13} />
    {/* mop bucket */}
    <group position={[0.9, 0, 0.9]}>
      <Cyl p={[0, 0.17, 0]} r={0.2} r2={0.17} h={0.34} c="#F5C02A" rough={0.5} />
      <Cyl p={[0.05, 0.6, 0]} r={0.015} h={1.1} c="#C9CDD1" m={0.6} rough={0.3} rot={[0, 0, 0.15]} />
    </group>
  </group>
);

/** 2,1 — IT room. */
const ITRoom: React.FC<RoomProps> = ({ tex, m }) => (
  <group>
    <ServerRack p={[-0.9, 0, -1.4]} />
    <ServerRack p={[-0.2, 0, -1.4]} />
    <Table p={[0.7, 0, 0.15]} w={1.5} d={0.75} wood={m.wood} />
    <Monitor p={[0.45, 0.74, -0.05]} screen={m.store} yaw={0.1} />
    <Monitor p={[1.05, 0.74, -0.02]} screen={m.order} yaw={-0.15} />
    <ProductCard p={[0.75, 0.74, 0.35]} h={0.28} tex={tex.teclado} yaw={0.6} lean={0.9} d={0} />
    <OfficeChair p={[0.75, 0, 0.85]} yaw={0.1} />
    <KraftBox p={[1.35, 0, -1.3]} kraft={m.kraft} yaw={-0.3} d={1} />
    <Plant p={[-1.45, 0, 1.35]} kind="snake" seed={81} size={1.0} pot="#E9E5DE" />
    <Person p={[0.75, 0, 0.85]} yaw={0.1} {...LOOKS[2]} pose="sit" seed={11} />
  </group>
);

/** 1,2 — manager's office (the diorama hero room). */
const Manager: React.FC<RoomProps> = ({ tex, m }) => (
  <group position={[0, 0, -0.2]}>
    <DeskSetup store={m.store} order={m.order} wood={m.wood} />
    <OfficeChair p={[0.42, 0, -0.55]} yaw={0.22} />
    <Person p={[0.42, 0, -0.55]} yaw={0.22} {...LOOKS[0]} pose="sit" seed={12} />
    <ProductBox p={[1.3, 0.74, -1.33]} size={[0.36, 0.5, 0.08]} tex={tex.papel} yaw={0.4} d={0} />
    <ProductCard p={[-0.2, 0.74, -1.45]} h={0.32} tex={tex.cafe} yaw={0.5} d={1} />
    <Plant p={[-1.35, 0, 1.3]} kind="bush" seed={2} size={1.4} pot="#C66B3D" />
    <Sofa p={[-1.3, 0, 0.1]} w={1.3} yaw={Math.PI / 2} c="#C9B79C" />
  </group>
);

export type RoomDef = { i: number; j: number; key: string; label: string; skin: string; Content: React.FC<RoomProps> };

export const ROOMS: RoomDef[] = [
  { i: 0, j: 0, key: "meeting", label: "SALA DE REUNIONES", skin: "#2D4B6C", Content: Meeting },
  { i: 0, j: 1, key: "office", label: "OFICINA Y LIBRERÍA", skin: "#E7E1D6", Content: OpenOffice },
  { i: 1, j: 0, key: "cafe", label: "CAFETERÍA", skin: "#C46A3E", Content: Cafeteria },
  { i: 1, j: 1, key: "lobby", label: "RECEPCIÓN", skin: "#E9E3D8", Content: Reception },
  { i: 2, j: 0, key: "wc", label: "PAPEL TISSUE", skin: "#9FB4C0", Content: Restroom },
  { i: 0, j: 2, key: "store", label: "ASEO Y FERRETERÍA", skin: "#8E9196", Content: StoreRoom },
  { i: 2, j: 1, key: "it", label: "TECNOLOGÍA", skin: "#36373C", Content: ITRoom },
  { i: 1, j: 2, key: "boss", label: "GERENCIA", skin: "#3B3C41", Content: Manager },
];

export const roomCenter = (i: number, j: number): [number, number] => [(i - 1) * CELL, (j - 1) * CELL];
export const hasRoom = (i: number, j: number) => ROOMS.some((r) => r.i === i && r.j === j);

/** Floors are passed in by key so each texture is built once. */
export const Building: React.FC<{ tex: Tex; m: Mats; floors: Record<string, THREE.Texture>; animate?: boolean }> = ({ tex, m, floors, animate = false }) => {
  const doors = useMemo(() => new Set(["1,0x", "1,1x", "0,1z", "1,1z", "2,1x", "1,2z", "2,1z"]), []);
  return (
    <group>
      {ROOMS.map((r) => {
        const [cx, cz] = roomCenter(r.i, r.j);
        const outX = r.i === 0, outZ = r.j === 0;
        const frontX = !hasRoom(r.i + 1, r.j), frontZ = !hasRoom(r.i, r.j + 1);
        const slab = { x0: cx - HALF - (outX ? T : 0), x1: cx + HALF + (frontX ? 0.08 : 0), z0: cz - HALF - (outZ ? T : 0), z1: cz + HALF + (frontZ ? 0.08 : 0) };
        const C = r.Content;
        return (
          <group key={r.key}>
            <Box p={[(slab.x0 + slab.x1) / 2, -0.13, (slab.z0 + slab.z1) / 2]} s={[slab.x1 - slab.x0, 0.26, slab.z1 - slab.z0]} c="#E9E3D9" r={0.8} />
            <mesh position={[cx, 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[CELL, CELL]} />
              <meshStandardMaterial map={floors[r.key]} roughness={r.key === "wc" || r.key === "lobby" ? 0.3 : 0.6} />
            </mesh>
            {/* back walls: -x and -z */}
            <WallRun
              axis="z" c={cx - HALF} a0={cz - HALF - (outZ ? T : T / 2)} a1={cz + HALF + (frontZ ? 0.08 : -T / 2)} h={outX ? H_OUT : H_IN} skin={r.skin}
              openings={outX ? [{ a0: cz - 0.75, a1: cz + 0.75, y0: 0.85, y1: 2.2, glass: true }] : doors.has(`${r.i},${r.j}x`) ? [{ a0: cz + 0.4, a1: cz + 1.3, y0: 0, y1: H_IN }] : []}
            />
            <WallRun
              axis="x" c={cz - HALF} a0={cx - HALF - (outX ? T : T / 2)} a1={cx + HALF + (frontX ? 0.08 : -T / 2)} h={outZ ? H_OUT : H_IN} skin={r.skin}
              openings={outZ ? [{ a0: cx - 0.75, a1: cx + 0.75, y0: 0.85, y1: 2.2, glass: true }] : doors.has(`${r.i},${r.j}z`) ? [{ a0: cx + 0.4, a1: cx + 1.3, y0: 0, y1: H_IN }] : []}
            />
            {/* low front walls on the camera-facing edge */}
            {frontX ? <WallRun axis="z" c={cx + HALF + 0.02} a0={cz - HALF} a1={cz + HALF + (frontZ ? 0.08 : 0)} h={0.22} /> : null}
            {frontZ ? <WallRun axis="x" c={cz + HALF + 0.02} a0={cx - HALF} a1={cx + HALF + (frontX ? 0.08 : 0)} h={0.22} /> : null}
            <DropCtx.Provider value={animate ? ROOM_DROP[r.key] : null}>
              <group position={[cx, 0, cz]}>
                <C tex={tex} m={m} />
              </group>
            </DropCtx.Provider>
          </group>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ van */

export const Van: React.FC<{ p: V3; yaw?: number; logo: THREE.Texture }> = ({ p, yaw = 0, logo }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {/* cargo body */}
    <RoundedBox args={[2.3, 1.45, 1.3]} radius={0.08} smoothness={4} position={[-0.35, 0.95, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#F7F7F5" roughness={0.35} />
    </RoundedBox>
    {/* cab */}
    <RoundedBox args={[0.9, 1.05, 1.28]} radius={0.12} smoothness={4} position={[1.15, 0.75, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#F7F7F5" roughness={0.35} />
    </RoundedBox>
    <Box p={[1.45, 1.0, 0]} s={[0.36, 0.42, 1.2]} c="#1E2A36" r={0.1} m={0.4} rot={[0, 0, -0.35]} />
    {/* navy stripe + logo on both sides */}
    {[1, -1].map((s) => (
      <group key={s}>
        <Box p={[-0.35, 0.5, s * 0.652]} s={[2.25, 0.16, 0.005]} c="#1A3A5C" r={0.5} />
        <Box p={[-0.35, 0.6, s * 0.652]} s={[2.25, 0.04, 0.005]} c="#F5A623" r={0.5} />
        <mesh position={[-0.35, 1.15, s * 0.656]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshStandardMaterial map={logo} transparent roughness={0.4} />
        </mesh>
        <Box p={[1.2, 1.0, s * 0.645]} s={[0.4, 0.3, 0.005]} c="#1E2A36" r={0.1} />
      </group>
    ))}
    {/* wheels */}
    {[[-1.0, 1], [-1.0, -1], [1.05, 1], [1.05, -1]].map(([x, s]) => (
      <group key={`${x}${s}`}>
        <Cyl p={[x, 0.3, s * 0.6]} r={0.3} h={0.22} c="#1B1B1E" rough={0.8} rot={[Math.PI / 2, 0, 0]} />
        <Cyl p={[x, 0.3, s * 0.712]} r={0.15} h={0.01} c="#B9BBC0" m={0.8} rough={0.3} rot={[Math.PI / 2, 0, 0]} />
      </group>
    ))}
    {/* lights */}
    <Box p={[1.6, 0.55, 0.45]} s={[0.02, 0.1, 0.2]} c="#FFF6DD" r={0.2} />
    <Box p={[1.6, 0.55, -0.45]} s={[0.02, 0.1, 0.2]} c="#FFF6DD" r={0.2} />
  </group>
);
