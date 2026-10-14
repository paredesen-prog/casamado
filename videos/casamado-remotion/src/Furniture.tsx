import React from "react";
import { useCurrentFrame } from "remotion";
import { wx, wz } from "./constants";
import { furnitureRise } from "./timeline";

// Plan coords (x, y) -> world; sizes in metres (plan units / 100).
type P = { x: number; y: number; rot?: number };

const M = {
  oak: { color: "#C9A27A", roughness: 0.55 },
  oakLight: { color: "#D9BC96", roughness: 0.6 },
  white: { color: "#F4F3F0", roughness: 0.6 },
  offwhite: { color: "#E9E7E2", roughness: 0.7 },
  metal: { color: "#9AA3AB", roughness: 0.35, metalness: 0.6 },
  dark: { color: "#2A2F35", roughness: 0.5, metalness: 0.2 },
  black: { color: "#16191D", roughness: 0.35, metalness: 0.3 },
  navy: { color: "#22476D", roughness: 0.8 },
  fabric: { color: "#5E6B78", roughness: 0.95 },
  steel: { color: "#C9CDD1", roughness: 0.25, metalness: 0.8 },
  screen: { color: "#1B2A3A", roughness: 0.15, metalness: 0.1, emissive: "#24527E", emissiveIntensity: 0.35 },
  leaf: { color: "#3E7A4A", roughness: 0.8 },
  leaf2: { color: "#5C9A5E", roughness: 0.8 },
  pot: { color: "#D9D4CB", roughness: 0.7 },
  kraft: { color: "#B98D5A", roughness: 0.85 },
  kraft2: { color: "#A97C4B", roughness: 0.85 },
  porcelain: { color: "#FAFAFA", roughness: 0.2 },
  mirror: { color: "#B9CCDA", roughness: 0.05, metalness: 0.9 },
} as const;
type Mat = keyof typeof M;

const Box: React.FC<{ s: [number, number, number]; p: [number, number, number]; m: Mat; r?: number }> = ({ s, p, m, r = 0 }) => (
  <mesh position={p} rotation={[0, r, 0]} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...M[m]} />
  </mesh>
);
const Cyl: React.FC<{ r: number; h: number; p: [number, number, number]; m: Mat; seg?: number; r2?: number }> = ({ r, h, p, m, seg = 24, r2 }) => (
  <mesh position={p} castShadow receiveShadow>
    <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
    <meshStandardMaterial {...M[m]} />
  </mesh>
);

const Item: React.FC<{ at: P; i: number; children: React.ReactNode }> = ({ at, i, children }) => {
  const frame = useCurrentFrame();
  const rise = furnitureRise(i, frame);
  if (rise <= 0.001) return null;
  return (
    <group position={[wx(at.x), 0, wz(at.y)]} rotation={[0, ((at.rot ?? 0) * Math.PI) / 180, 0]} scale={[1, rise, 1]}>
      {children}
    </group>
  );
};

// ---- pieces (local origin = floor centre, facing +z) ----
const Desk: React.FC<{ w?: number; d?: number }> = ({ w = 1.5, d = 0.78 }) => (
  <>
    <Box s={[w, 0.04, d]} p={[0, 0.74, 0]} m="oak" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => (
      <Box key={k} s={[0.04, 0.72, 0.04]} p={[a * (w / 2 - 0.05), 0.36, b * (d / 2 - 0.05)]} m="dark" />
    ))}
    <Box s={[w - 0.1, 0.32, 0.02]} p={[0, 0.5, -d / 2 + 0.05]} m="offwhite" />
  </>
);
const Monitor: React.FC<{ x?: number }> = ({ x = 0 }) => (
  <group position={[x, 0.76, -0.18]}>
    <Box s={[0.18, 0.015, 0.14]} p={[0, 0.008, 0]} m="black" />
    <Box s={[0.04, 0.22, 0.03]} p={[0, 0.12, -0.02]} m="black" />
    <Box s={[0.58, 0.34, 0.025]} p={[0, 0.38, 0]} m="black" />
    <Box s={[0.54, 0.3, 0.005]} p={[0, 0.38, 0.0135]} m="screen" />
  </group>
);
const Chair: React.FC<{ color?: Mat }> = ({ color = "navy" }) => (
  <>
    <Cyl r={0.26} h={0.03} p={[0, 0.06, 0]} m="dark" seg={5} />
    <Cyl r={0.025} h={0.36} p={[0, 0.25, 0]} m="metal" />
    <Box s={[0.48, 0.08, 0.46]} p={[0, 0.47, 0]} m={color} />
    <Box s={[0.46, 0.5, 0.07]} p={[0, 0.78, 0.22]} m={color} />
    <Box s={[0.05, 0.05, 0.3]} p={[-0.24, 0.62, 0.02]} m="dark" />
    <Box s={[0.05, 0.05, 0.3]} p={[0.24, 0.62, 0.02]} m="dark" />
  </>
);
const Plant: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <group scale={[s, s, s]}>
    <Cyl r={0.16} r2={0.12} h={0.36} p={[0, 0.18, 0]} m="pot" />
    <mesh position={[0, 0.62, 0]} castShadow><icosahedronGeometry args={[0.3, 1]} /><meshStandardMaterial {...M.leaf} flatShading /></mesh>
    <mesh position={[0.12, 0.86, 0.05]} castShadow><icosahedronGeometry args={[0.2, 1]} /><meshStandardMaterial {...M.leaf2} flatShading /></mesh>
    <mesh position={[-0.12, 0.8, -0.06]} castShadow><icosahedronGeometry args={[0.18, 1]} /><meshStandardMaterial {...M.leaf} flatShading /></mesh>
  </group>
);
const Toilet: React.FC = () => (
  <>
    <Cyl r={0.19} r2={0.15} h={0.4} p={[0, 0.2, 0.05]} m="porcelain" seg={28} />
    <Box s={[0.4, 0.36, 0.17]} p={[0, 0.58, -0.2]} m="porcelain" />
    <Cyl r={0.21} h={0.03} p={[0, 0.415, 0.06]} m="porcelain" seg={28} />
  </>
);
const SinkCounter: React.FC<{ w: number }> = ({ w }) => (
  <>
    <Box s={[w, 0.84, 0.55]} p={[0, 0.42, 0]} m="white" />
    <Box s={[w + 0.02, 0.04, 0.57]} p={[0, 0.86, 0]} m="offwhite" />
    <Box s={[0.42, 0.02, 0.32]} p={[0, 0.885, 0.04]} m="porcelain" />
    <Box s={[0.03, 0.18, 0.03]} p={[0, 0.97, -0.17]} m="steel" />
  </>
);
const KitchenRun: React.FC<{ w: number }> = ({ w }) => (
  <>
    <Box s={[w, 0.86, 0.6]} p={[0, 0.43, 0]} m="white" />
    {Array.from({ length: Math.floor(w / 0.6) }).map((_, k) => (
      <Box key={k} s={[0.008, 0.7, 0.005]} p={[-w / 2 + 0.6 * (k + 1), 0.45, 0.302]} m="offwhite" />
    ))}
    <Box s={[w + 0.02, 0.04, 0.62]} p={[0, 0.88, 0]} m="oak" />
    <Box s={[0.5, 0.02, 0.38]} p={[0.4, 0.905, 0.03]} m="steel" />
  </>
);
const Fridge: React.FC = () => (
  <>
    <Box s={[0.66, 1.82, 0.66]} p={[0, 0.91, 0]} m="steel" />
    <Box s={[0.03, 0.5, 0.03]} p={[0.27, 1.25, 0.345]} m="dark" />
    <Box s={[0.64, 0.006, 0.006]} p={[0, 1.02, 0.333]} m="dark" />
  </>
);
const RoundTable: React.FC = () => (
  <>
    <Cyl r={0.45} h={0.04} p={[0, 0.74, 0]} m="oakLight" seg={40} />
    <Cyl r={0.04} h={0.7} p={[0, 0.36, 0]} m="dark" />
    <Cyl r={0.25} h={0.02} p={[0, 0.01, 0]} m="dark" seg={30} />
  </>
);
const Stool: React.FC = () => (
  <>
    <Cyl r={0.17} h={0.05} p={[0, 0.46, 0]} m="navy" />
    <Cyl r={0.02} h={0.44} p={[0, 0.22, 0]} m="metal" />
    <Cyl r={0.16} h={0.02} p={[0, 0.01, 0]} m="metal" />
  </>
);
const Sofa: React.FC<{ w: number }> = ({ w }) => (
  <>
    <Box s={[w, 0.42, 0.85]} p={[0, 0.21, 0]} m="fabric" />
    <Box s={[w, 0.45, 0.2]} p={[0, 0.62, -0.32]} m="fabric" />
    <Box s={[0.16, 0.25, 0.85]} p={[-w / 2 + 0.08, 0.54, 0]} m="fabric" />
    <Box s={[0.16, 0.25, 0.85]} p={[w / 2 - 0.08, 0.54, 0]} m="fabric" />
    {[-1, 1].map((k) => <Box key={k} s={[w / 2 - 0.2, 0.1, 0.6]} p={[(k * w) / 4, 0.47, 0.06]} m="fabric" />)}
  </>
);
const Reception: React.FC = () => (
  <>
    <Box s={[1.7, 1.05, 0.4]} p={[0, 0.525, 0.25]} m="white" />
    <Box s={[1.74, 0.04, 0.48]} p={[0, 1.07, 0.25]} m="oak" />
    <Box s={[1.6, 0.04, 0.6]} p={[0, 0.74, -0.2]} m="oak" />
    <Box s={[1.66, 0.12, 0.02]} p={[0, 0.85, 0.452]} m="navy" />
  </>
);
const ServerRack: React.FC = () => (
  <>
    <Box s={[0.62, 1.72, 0.9]} p={[0, 0.86, 0]} m="black" />
    {Array.from({ length: 9 }).map((_, k) => (
      <mesh key={k} position={[0.2, 0.25 + k * 0.16, 0.452]}>
        <boxGeometry args={[0.04, 0.012, 0.004]} />
        <meshStandardMaterial color={k % 3 === 0 ? "#F5A623" : "#3FD38B"} emissive={k % 3 === 0 ? "#F5A623" : "#3FD38B"} emissiveIntensity={1.2} />
      </mesh>
    ))}
    {Array.from({ length: 9 }).map((_, k) => <Box key={`s${k}`} s={[0.56, 0.004, 0.004]} p={[0, 0.2 + k * 0.16, 0.453]} m="dark" />)}
  </>
);
const BOXES = [[0, 0, 0.46, 0.34], [1, 0, 0.36, 0.3], [2, 1, 0.42, 0.28], [3, 0, 0.5, 0.36], [4, 1, 0.38, 0.26], [5, 0, 0.44, 0.32]];
const Shelving: React.FC<{ w: number; seed?: number }> = ({ w, seed = 0 }) => (
  <>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => (
      <Box key={k} s={[0.04, 1.8, 0.04]} p={[a * (w / 2 - 0.02), 0.9, b * 0.22]} m="metal" />
    ))}
    {[0.12, 0.6, 1.08, 1.56].map((y, k) => (
      <group key={k}>
        <Box s={[w, 0.03, 0.48]} p={[0, y, 0]} m="metal" />
        {k < 3 ? BOXES.filter((_, j) => (j + k + seed) % 2 === 0).map(([j, , bw, bh], n) => {
          const x = -w / 2 + 0.3 + ((j as number) * (w - 0.5)) / 5;
          return <Box key={n} s={[bw, bh, 0.4]} p={[x, y + 0.015 + bh / 2, 0]} m={(j + k) % 2 ? "kraft" : "kraft2"} />;
        }) : null}
      </group>
    ))}
  </>
);
const Pallet: React.FC = () => (
  <>
    <Box s={[1.0, 0.12, 0.8]} p={[0, 0.06, 0]} m="oakLight" />
    {[[-0.24, -0.18, 0.46], [0.24, -0.18, 0.46], [-0.24, 0.2, 0.46], [0.24, 0.2, 0.46], [0, 0, 0.42]].map(([x, z, h], k) => (
      <Box key={k} s={[0.46, h, 0.38]} p={[x, 0.12 + h / 2 + (k === 4 ? 0.46 : 0), z]} m={k % 2 ? "kraft" : "kraft2"} />
    ))}
  </>
);
const Workbench: React.FC<{ w: number }> = ({ w }) => (
  <>
    <Box s={[w, 0.05, 0.62]} p={[0, 0.9, 0]} m="oak" />
    {[-1, 1].map((a) => <Box key={a} s={[0.06, 0.88, 0.56]} p={[a * (w / 2 - 0.05), 0.44, 0]} m="dark" />)}
    <Box s={[w - 0.12, 0.03, 0.5]} p={[0, 0.25, 0]} m="metal" />
    <Box s={[w, 0.7, 0.03]} p={[0, 1.4, -0.3]} m="offwhite" />
  </>
);
const CoffeeTable: React.FC = () => (
  <>
    <Box s={[0.9, 0.04, 0.5]} p={[0, 0.42, 0]} m="oakLight" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => <Box key={k} s={[0.03, 0.4, 0.03]} p={[a * 0.4, 0.2, b * 0.2]} m="dark" />)}
  </>
);

const DESKS: P[] = [{ x: 385, y: 100 }, { x: 575, y: 100 }, { x: 385, y: 250 }, { x: 575, y: 250 }, { x: 385, y: 400 }, { x: 575, y: 400 }];

export const Furniture: React.FC = () => {
  let i = 0;
  const n = () => i++;
  return (
    <group>
      {DESKS.map((d, k) => (
        <React.Fragment key={k}>
          <Item at={d} i={n()}><Desk /><Monitor x={-0.3} />{k % 2 === 0 ? <Monitor x={0.32} /> : null}</Item>
          <Item at={{ x: d.x + (k % 2 ? 20 : -15), y: d.y + 58, rot: 180 + (k % 2 ? 12 : -10) }} i={n()}><Chair color={k % 3 === 1 ? "fabric" : "navy"} /></Item>
        </React.Fragment>
      ))}
      <Item at={{ x: 672, y: 40 }} i={n()}><Plant s={1.2} /></Item>
      <Item at={{ x: 290, y: 478 }} i={n()}><Plant s={1.0} /></Item>

      <Item at={{ x: 60, y: 75, rot: 90 }} i={n()}><Toilet /></Item>
      <Item at={{ x: 60, y: 225, rot: 90 }} i={n()}><Toilet /></Item>
      <Item at={{ x: 75, y: 150 }} i={n()}><Box s={[1.5, 1.2, 0.04]} p={[0, 0.6, 0]} m="offwhite" /></Item>
      <Item at={{ x: 198, y: 30 }} i={n()}><SinkCounter w={1.0} /></Item>
      <Item at={{ x: 198, y: 3 }} i={n()}><Box s={[0.8, 0.5, 0.02]} p={[0, 1.3, 0]} m="mirror" /></Item>

      <Item at={{ x: 820, y: 32 }} i={n()}><KitchenRun w={2.2} /></Item>
      <Item at={{ x: 960, y: 105, rot: -90 }} i={n()}><Fridge /></Item>
      <Item at={{ x: 840, y: 200 }} i={n()}><RoundTable /></Item>
      {[[775, 200], [905, 200], [840, 268]].map(([x, y], k) => <Item key={k} at={{ x, y }} i={n()}><Stool /></Item>)}
      <Item at={{ x: 725, y: 270 }} i={n()}><Plant s={0.9} /></Item>

      <Item at={{ x: 810, y: 368 }} i={n()}><Desk w={1.7} d={0.72} /><Monitor x={-0.35} /><Monitor x={0.35} /></Item>
      <Item at={{ x: 810, y: 430, rot: 180 }} i={n()}><Chair /></Item>
      <Item at={{ x: 953, y: 480, rot: -90 }} i={n()}><ServerRack /></Item>

      <Item at={{ x: 120, y: 395 }} i={n()}><Reception /></Item>
      <Item at={{ x: 45, y: 640, rot: 90 }} i={n()}><Sofa w={1.8} /></Item>
      <Item at={{ x: 140, y: 640 }} i={n()}><CoffeeTable /></Item>
      <Item at={{ x: 225, y: 760 }} i={n()}><Plant s={1.25} /></Item>

      <Item at={{ x: 385, y: 560 }} i={n()}><Shelving w={2.0} /></Item>
      <Item at={{ x: 600, y: 560 }} i={n()}><Shelving w={1.6} seed={1} /></Item>
      <Item at={{ x: 330, y: 730 }} i={n()}><Pallet /></Item>

      <Item at={{ x: 860, y: 580 }} i={n()}><Workbench w={1.9} /></Item>
      <Item at={{ x: 965, y: 710, rot: -90 }} i={n()}><Shelving w={1.4} seed={1} /></Item>
    </group>
  );
};
