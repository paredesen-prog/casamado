import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { mulberry32 } from "../rng";
import { useDrop } from "./drop";

type V3 = [number, number, number];
const S = { castShadow: true, receiveShadow: true } as const;

export const Box: React.FC<{ p: V3; s: V3; c?: string; r?: number; m?: number; map?: THREE.Texture; rot?: V3 }> = ({ p, s, c = "#ffffff", r = 0.7, m = 0, map, rot }) => (
  <mesh position={p} rotation={rot} {...S}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={r} metalness={m} map={map} />
  </mesh>
);

export const RBox: React.FC<{ p: V3; s: V3; c?: string; r?: number; rad?: number; rot?: V3; map?: THREE.Texture }> = ({ p, s, c = "#ffffff", r = 0.7, rad = 0.02, rot, map }) => (
  <RoundedBox args={s} radius={rad} smoothness={4} position={p} rotation={rot} {...S}>
    <meshStandardMaterial color={c} roughness={r} map={map} />
  </RoundedBox>
);

export const Cyl: React.FC<{ p: V3; r: number; r2?: number; h: number; c?: string; rough?: number; m?: number; rot?: V3; seg?: number }> = ({ p, r, r2, h, c = "#ffffff", rough = 0.6, m = 0, rot, seg = 32 }) => (
  <mesh position={p} rotation={rot} {...S}>
    <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
    <meshStandardMaterial color={c} roughness={rough} metalness={m} />
  </mesh>
);

/* ------------------------------------------------------------------ plants */

const leafGeometry = (len: number, wid: number, curl: number, fold: number) => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(wid * 0.62, len * 0.18, wid * 0.55, len * 0.78, 0, len);
  s.bezierCurveTo(-wid * 0.55, len * 0.78, -wid * 0.62, len * 0.18, 0, 0);
  const g = new THREE.ShapeGeometry(s, 10);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, -curl * (y / len) ** 2 * len + fold * Math.abs(x));
  }
  g.computeVertexNormals();
  return g;
};

const GREENS = ["#2F6B34", "#3B7D3A", "#285C2E", "#4A8A3F", "#356F38", "#21522A"];

type PlantKind = "bush" | "snake" | "trail" | "small";

/** Procedural potted plant; deterministic per seed. Origin = floor under the pot. */
export const Plant: React.FC<{ p: V3; kind?: PlantKind; seed?: number; size?: number; pot?: string; potH?: number; potR?: number }> = ({
  p, kind = "bush", seed = 1, size = 1, pot = "#E9E5DE", potH = 0.28, potR = 0.16,
}) => {
  const leaves = useMemo(() => {
    const r = mulberry32(seed * 7919);
    const out: { geo: THREE.BufferGeometry; az: number; tilt: number; stem: number; droop: number; twist: number; color: string; drop: number }[] = [];
    const n = kind === "bush" ? 32 : kind === "snake" ? 11 : kind === "trail" ? 30 : 14;
    for (let i = 0; i < n; i++) {
      const az = (i / n) * Math.PI * 2 * 2.618 + r() * 0.6;
      if (kind === "bush") {
        out.push({ geo: leafGeometry(0.18 + r() * 0.12, 0.15 + r() * 0.08, 0.12, 0.25), az, tilt: 0.15 + r() * 1.15, stem: 0.12 + r() * 0.5, droop: 0.3 + r() * 0.5, twist: (r() - 0.5) * 0.6, color: GREENS[i % GREENS.length], drop: 0 });
      } else if (kind === "snake") {
        out.push({ geo: leafGeometry(0.45 + r() * 0.35, 0.1 + r() * 0.04, -0.03, 0.35), az, tilt: r() * 0.35, stem: 0.02, droop: 0, twist: r() * 3, color: i % 2 ? "#3E6E3A" : "#56803F", drop: 0 });
      } else if (kind === "trail") {
        out.push({ geo: leafGeometry(0.07 + r() * 0.03, 0.06 + r() * 0.02, 0.05, 0.2), az, tilt: 1.2 + r() * 0.5, stem: 0.08 + r() * 0.1, droop: 0.4, twist: (r() - 0.5), color: GREENS[(i * 3) % GREENS.length], drop: r() * 0.55 });
      } else {
        out.push({ geo: leafGeometry(0.08 + r() * 0.05, 0.06 + r() * 0.03, 0.08, 0.3), az, tilt: 0.3 + r() * 1.0, stem: 0.03 + r() * 0.08, droop: 0.3, twist: 0, color: GREENS[i % GREENS.length], drop: 0 });
      }
    }
    return out;
  }, [kind, seed]);

  return (
    <group position={p} scale={size}>
      <Cyl p={[0, potH / 2, 0]} r={potR} r2={potR * 0.78} h={potH} c={pot} rough={0.85} />
      <Cyl p={[0, potH - 0.012, 0]} r={potR * 0.93} h={0.01} c="#3A2A20" rough={1} />
      <group position={[0, potH - 0.01, 0]}>
        {leaves.map((l, i) => (
          <group key={i} rotation={[0, l.az, 0]}>
            {l.drop > 0 ? (
              // trailing vine: leaf hangs over the pot rim
              <group position={[0, -l.drop, potR * 1.05]} rotation={[l.tilt, l.twist, 0]}>
                <mesh geometry={l.geo} castShadow receiveShadow>
                  <meshStandardMaterial color={l.color} roughness={0.55} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ) : (
              <group rotation={[l.tilt, 0, 0]}>
                {l.stem > 0.05 ? (
                  <mesh position={[0, l.stem / 2, 0]} castShadow>
                    <cylinderGeometry args={[0.006, 0.008, l.stem, 5]} />
                    <meshStandardMaterial color="#4C7A3A" roughness={0.7} />
                  </mesh>
                ) : null}
                <group position={[0, l.stem, 0]} rotation={[l.droop, 0, l.twist]}>
                  <mesh geometry={l.geo} castShadow receiveShadow>
                    <meshStandardMaterial color={l.color} roughness={0.55} side={THREE.DoubleSide} />
                  </mesh>
                </group>
              </group>
            )}
          </group>
        ))}
        {kind === "trail"
          ? [0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} position={[Math.cos(i * 1.3) * potR, -0.25, Math.sin(i * 1.3) * potR]} castShadow>
                <cylinderGeometry args={[0.004, 0.004, 0.5, 4]} />
                <meshStandardMaterial color="#4C7A3A" />
              </mesh>
            ))
          : null}
      </group>
    </group>
  );
};

/* --------------------------------------------------------------- furniture */

export const OfficeChair: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => {
  const dark = "#2A2B2F";
  const fabric = "#3C3E44";
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box p={[0, 0.07, 0.15]} s={[0.04, 0.03, 0.3]} c={dark} r={0.35} m={0.4} />
            <mesh position={[0, 0.03, 0.29]} {...S}>
              <sphereGeometry args={[0.03, 16, 12]} />
              <meshStandardMaterial color="#1B1B1E" roughness={0.4} />
            </mesh>
          </group>
        );
      })}
      <Cyl p={[0, 0.27, 0]} r={0.025} h={0.4} c="#9A9CA2" rough={0.25} m={0.8} />
      <RBox p={[0, 0.49, 0]} s={[0.5, 0.08, 0.48]} c={fabric} r={0.9} rad={0.035} />
      {/* backrest (behind the sitter = +z) */}
      <RBox p={[0, 0.88, 0.25]} s={[0.46, 0.62, 0.05]} c={dark} r={0.85} rad={0.025} rot={[-0.12, 0, 0]} />
      <RBox p={[0, 1.27, 0.3]} s={[0.3, 0.12, 0.05]} c={dark} r={0.85} rad={0.02} rot={[-0.15, 0, 0]} />
      <Box p={[0, 0.66, 0.24]} s={[0.05, 0.3, 0.03]} c={dark} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Box p={[sx * 0.26, 0.6, 0.02]} s={[0.03, 0.18, 0.03]} c={dark} />
          <RBox p={[sx * 0.26, 0.7, 0.0]} s={[0.07, 0.03, 0.26]} c="#1E1F22" rad={0.012} />
        </group>
      ))}
    </group>
  );
};

/** Keyboard with a key grid painted on top. */
const keyTexture = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 880; c.height = 280;
    const g = c.getContext("2d")!;
    g.fillStyle = "#26272B";
    g.fillRect(0, 0, 880, 280);
    g.fillStyle = "#3A3C42";
    for (let row = 0; row < 5; row++) for (let k = 0; k < 15; k++) g.fillRect(14 + k * 57, 14 + row * 52, 48, 42);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

export const DeskSetup: React.FC<{ store: THREE.Texture; order: THREE.Texture; wood: THREE.Texture }> = ({ store, order, wood }) => {
  const top = 0.74;
  return (
    <group>
      {/* desk top + supports */}
      <RBox p={[0.48, top - 0.022, -1.24]} s={[2.1, 0.045, 0.7]} c="#FFFFFF" map={wood} r={0.45} rad={0.012} />
      {[-1.42, -1.06].map((z) => (
        <Box key={z} p={[-0.52, (top - 0.045) / 2, z]} s={[0.05, top - 0.045, 0.05]} c="#1F1F22" r={0.4} m={0.5} />
      ))}
      <Box p={[-0.52, 0.03, -1.24]} s={[0.06, 0.03, 0.62]} c="#1F1F22" r={0.4} m={0.5} />
      {/* drawer unit */}
      <group position={[1.3, 0, -1.25]}>
        <Box p={[0, 0.35, 0]} s={[0.44, 0.66, 0.6]} c="#3A3B40" r={0.6} />
        {[0.13, 0.33, 0.53].map((y) => (
          <group key={y}>
            <Box p={[0, y, 0.302]} s={[0.4, 0.17, 0.006]} c="#44464C" r={0.5} />
            <Box p={[0, y + 0.06, 0.31]} s={[0.12, 0.012, 0.015]} c="#B9BBC0" r={0.3} m={0.8} />
          </group>
        ))}
      </group>
      {/* desk mat, keyboard, mouse */}
      <Box p={[0.42, top + 0.002, -1.08]} s={[0.95, 0.004, 0.36]} c="#2A2B2F" r={0.95} />
      <mesh position={[0.36, top + 0.014, -1.06]} {...S}>
        <boxGeometry args={[0.44, 0.02, 0.14]} />
        <meshStandardMaterial attach="material-0" color="#26272B" />
        <meshStandardMaterial attach="material-1" color="#26272B" />
        <meshStandardMaterial attach="material-2" map={keyTexture()} roughness={0.6} />
        <meshStandardMaterial attach="material-3" color="#26272B" />
        <meshStandardMaterial attach="material-4" color="#26272B" />
        <meshStandardMaterial attach="material-5" color="#26272B" />
      </mesh>
      <RBox p={[0.72, top + 0.016, -1.05]} s={[0.06, 0.028, 0.1]} c="#26272B" rad={0.013} r={0.4} />
      {/* ultrawide monitor */}
      <group position={[0.42, top, -1.43]}>
        <Box p={[0, 0.006, 0.02]} s={[0.26, 0.012, 0.18]} c="#2A2B2F" r={0.35} m={0.5} />
        <Box p={[0, 0.14, -0.02]} s={[0.05, 0.26, 0.03]} c="#2A2B2F" r={0.35} m={0.5} />
        <Box p={[0, 0.36, 0]} s={[1.02, 0.44, 0.03]} c="#141416" r={0.3} />
        <mesh position={[0, 0.365, 0.0155]}>
          <planeGeometry args={[0.99, 0.42]} />
          <meshStandardMaterial map={store} emissiveMap={store} emissive="#ffffff" emissiveIntensity={0.9} roughness={0.25} toneMapped={false} />
        </mesh>
      </group>
      {/* laptop on a stand */}
      <group position={[-0.24, top, -1.2]} rotation={[0, 0.35, 0]}>
        <Box p={[0, 0.06, 0]} s={[0.24, 0.012, 0.2]} c="#B8BAC0" r={0.3} m={0.7} rot={[0.35, 0, 0]} />
        <Box p={[0, 0.03, -0.06]} s={[0.2, 0.06, 0.012]} c="#B8BAC0" r={0.3} m={0.7} />
        <group position={[0, 0.1, -0.09]} rotation={[-0.25, 0, 0]}>
          <Box p={[0, 0.11, 0]} s={[0.32, 0.22, 0.008]} c="#C9CBD0" r={0.3} m={0.6} />
          <mesh position={[0, 0.11, 0.0045]}>
            <planeGeometry args={[0.3, 0.195]} />
            <meshStandardMaterial map={order} emissiveMap={order} emissive="#ffffff" emissiveIntensity={0.85} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* speakers */}
      {[-0.22, 1.06].map((x) => (
        <group key={x} position={[x, top, -1.42]}>
          <RBox p={[0, 0.1, 0]} s={[0.12, 0.2, 0.13]} c="#5B3A26" r={0.55} rad={0.012} />
          <Cyl p={[0, 0.13, 0.066]} r={0.035} h={0.006} c="#1B1B1E" rot={[Math.PI / 2, 0, 0]} />
          <Cyl p={[0, 0.06, 0.066]} r={0.018} h={0.006} c="#1B1B1E" rot={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
      {/* mug */}
      <group position={[0.98, top, -1.06]}>
        <Cyl p={[0, 0.05, 0]} r={0.042} h={0.1} c="#F1EEE8" rough={0.35} />
        <Cyl p={[0, 0.096, 0]} r={0.036} h={0.004} c="#3A2416" rough={0.2} />
        <mesh position={[0.05, 0.05, 0]} rotation={[0, 0, 0]} {...S}>
          <torusGeometry args={[0.025, 0.007, 8, 16]} />
          <meshStandardMaterial color="#F1EEE8" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
};

/** Black metal frame shelving with wood boards. */
export const ShelfRack: React.FC<{ p: V3; len: number; depth: number; levels: number[]; wood: THREE.Texture; yaw?: number }> = ({ p, len, depth, levels, wood, yaw = 0 }) => {
  const h = levels[levels.length - 1] + 0.03;
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
        <Box key={`${sx}${sz}`} p={[(sx * len) / 2, h / 2, (sz * depth) / 2]} s={[0.025, h, 0.025]} c="#1C1C1F" r={0.4} m={0.6} />
      ))}
      {levels.map((y) => (
        <Box key={y} p={[0, y, 0]} s={[len + 0.03, 0.03, depth + 0.02]} c="#FFFFFF" map={wood} r={0.5} />
      ))}
    </group>
  );
};

export const Frame: React.FC<{ p: V3; w: number; h: number; map: THREE.Texture; rot?: V3 }> = ({ p, w, h, map, rot }) => (
  <group position={p} rotation={rot}>
    <Box p={[0, 0, 0]} s={[w + 0.04, h + 0.04, 0.03]} c="#1E1E21" r={0.5} />
    <mesh position={[0, 0, 0.016]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={map} roughness={0.5} />
    </mesh>
  </group>
);

export const Books: React.FC<{ p: V3; seed?: number; n?: number }> = ({ p, seed = 2, n = 7 }) => {
  const cols = ["#1A3A5C", "#F5A623", "#E9E2D3", "#53748B", "#9C3D2A", "#2E2E33", "#D8CDB8"];
  const r = mulberry32(seed);
  let x = 0;
  const items = Array.from({ length: n }, (_, i) => {
    const w = 0.025 + r() * 0.02, h = 0.17 + r() * 0.07;
    const it = { x: x + w / 2, w, h, c: cols[(i + seed) % cols.length], lean: i === n - 1 ? -0.25 : 0 };
    x += w + 0.002;
    return it;
  });
  return (
    <group position={p}>
      {items.map((b, i) => (
        <Box key={i} p={[b.x, b.h / 2, 0]} s={[b.w, b.h, 0.15]} c={b.c} r={0.8} rot={[0, 0, b.lean]} />
      ))}
    </group>
  );
};

/* ---------------------------------------------------------------- products */

/** Box-shaped product with the photo on its front (+z) or top (+y) face. `d` = drop order in its room. */
export const ProductBox: React.FC<{ p: V3; size: V3; tex: THREE.Texture; face?: "front" | "top"; side?: string; yaw?: number; d?: number }> = ({
  p, size, tex, face = "front", side = "#F4F2EE", yaw = 0, d = 0,
}) => {
  const photo = face === "front" ? 4 : 2;
  const a = useDrop(d);
  if (!a.show) return null;
  return (
    <group position={[p[0], p[1] + a.y, p[2]]} rotation={[0, yaw, 0]} scale={[a.sx, a.sy, a.sx]}>
      <mesh position={[0, size[1] / 2, 0]} {...S}>
        <boxGeometry args={size} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color={i === photo ? "#ffffff" : side}
            map={i === photo ? tex : undefined}
            roughness={0.55}
            emissive="#ffffff"
            emissiveMap={i === photo ? tex : undefined}
            emissiveIntensity={i === photo ? 0.12 : 0}
          />
        ))}
      </mesh>
    </group>
  );
};

/** Cut-out photo standing upright (bags, pouches), shadow follows the silhouette. */
export const ProductCard: React.FC<{ p: V3; h: number; tex: THREE.Texture; yaw?: number; lean?: number; d?: number }> = ({ p, h, tex, yaw = 0, lean = 0, d = 0 }) => {
  const img = tex.image as HTMLImageElement;
  const w = (h * img.width) / img.height;
  const depth = useMemo(() => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }), [tex]);
  const a = useDrop(d);
  if (!a.show) return null;
  return (
    <group position={[p[0], p[1] + a.y, p[2]]} rotation={[0, yaw, 0]} scale={[a.sx, a.sy, a.sx]}>
      <mesh position={[0, h / 2, 0]} rotation={[-lean, 0, 0]} castShadow customDepthMaterial={depth}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.5} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
};
