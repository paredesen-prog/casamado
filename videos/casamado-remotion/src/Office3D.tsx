import { useThree } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { staticFile, useCurrentFrame } from "remotion";
import { camAt } from "./camera";
import { C, PRODUCTS, WALLS, wx, wz } from "./constants";
import { Furniture } from "./Furniture";
import { blueprintTexture, realFloorTexture } from "./textures";
import { dropY, lightMix, productVisible, squash, wallRise } from "./timeline";

const WALL_T = 0.12;
const H_BACK = 1.5;
const H_INNER = 0.9;
const H_FRONT = 0.2;
const SILL = 0.72;

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camAt(frame);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = c.fov;
    cam.near = 0.1; cam.far = 300;
    cam.position.set(...c.pos);
    cam.lookAt(...c.target);
    cam.updateProjectionMatrix();
  });
  return null;
};

const navy = new THREE.Color(C.ink);
const white = new THREE.Color("#FFFFFF");
const wallWhite = new THREE.Color("#F1EEE9");
const hex = (c: THREE.Color) => `#${c.getHexString()}`;

const kindOf = (x1: number, y1: number, x2: number, y2: number) => {
  if ((y1 === 0 && y2 === 0) || (x1 === 1000 && x2 === 1000)) return "back";
  if ((y1 === 800 && y2 === 800) || (x1 === 0 && x2 === 0) || (x1 === 180 && x2 === 180)) return "front";
  return "inner";
};

const Walls: React.FC = () => {
  const frame = useCurrentFrame();
  const mix = lightMix(frame);
  const body = hex(white.clone().lerp(wallWhite, mix));
  const cap = hex(white.clone().lerp(navy, mix));
  return (
    <group>
      {WALLS.map(([x1, y1, x2, y2], i) => {
        const len = Math.hypot(x2 - x1, y2 - y1) / 100 + WALL_T;
        const kind = kindOf(x1, y1, x2, y2);
        const full = kind === "back" ? H_BACK : kind === "inner" ? H_INNER : H_FRONT;
        const rise = wallRise(i, frame);
        const h = full * rise;
        const horizontal = y1 === y2;
        const cx = wx((x1 + x2) / 2), cz = wz((y1 + y2) / 2);
        const size = (hh: number, t = WALL_T): [number, number, number] => (horizontal ? [len, hh, t] : [t, hh, len]);
        if (kind !== "back") {
          return (
            <group key={i}>
              <mesh castShadow receiveShadow position={[cx, h / 2, cz]}><boxGeometry args={size(h)} /><meshStandardMaterial color={body} roughness={0.9} /></mesh>
              <mesh position={[cx, h + 0.008, cz]}><boxGeometry args={size(0.016, WALL_T + 0.004)} /><meshStandardMaterial color={cap} roughness={0.6} /></mesh>
            </group>
          );
        }
        const sill = Math.min(h, SILL * rise);
        const glassH = Math.max(0, h - sill - 0.06 * rise);
        const n = Math.round(len / 1.0);
        return (
          <group key={i}>
            <mesh castShadow receiveShadow position={[cx, sill / 2, cz]}><boxGeometry args={size(sill)} /><meshStandardMaterial color={body} roughness={0.9} /></mesh>
            {glassH > 0.01 ? (
              <>
                <mesh position={[cx, sill + glassH / 2, cz]}><boxGeometry args={size(glassH, 0.02)} /><meshStandardMaterial color="#BFD5E4" roughness={0.05} metalness={0.1} transparent opacity={0.32} depthWrite={false} /></mesh>
                {Array.from({ length: n + 1 }).map((_, k) => {
                  const off = -len / 2 + (k * len) / n;
                  return (
                    <mesh key={k} castShadow position={horizontal ? [cx + off, sill + glassH / 2, cz] : [cx, sill + glassH / 2, cz + off]}>
                      <boxGeometry args={horizontal ? [0.05, glassH, 0.06] : [0.06, glassH, 0.05]} />
                      <meshStandardMaterial color="#3B4652" roughness={0.4} metalness={0.5} />
                    </mesh>
                  );
                })}
                <mesh castShadow position={[cx, sill + glassH + 0.03 * rise, cz]}><boxGeometry args={size(0.06 * rise)} /><meshStandardMaterial color={body} roughness={0.9} /></mesh>
              </>
            ) : null}
            <mesh position={[cx, h + 0.008, cz]}><boxGeometry args={size(0.016, WALL_T + 0.004)} /><meshStandardMaterial color={cap} roughness={0.6} /></mesh>
          </group>
        );
      })}
    </group>
  );
};

const Floor: React.FC = () => {
  const frame = useCurrentFrame();
  const mix = lightMix(frame);
  const real = useMemo(() => realFloorTexture(), []);
  const blue = useMemo(() => blueprintTexture(), []);
  return (
    <group>
      <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.3, 0.18, 8.3]} />
        <meshStandardMaterial color={mix > 0.5 ? "#D7DDE3" : "#1F4166"} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial map={real} roughness={0.7} />
      </mesh>
      {mix < 0.999 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <planeGeometry args={[10, 8]} />
          <meshBasicMaterial map={blue} transparent opacity={1 - mix} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.16 * mix} />
      </mesh>
    </group>
  );
};

export const PRODUCT_URLS = PRODUCTS.map((p) => staticFile(`products/${p.file}`));

const Products: React.FC<{ textures: THREE.Texture[] }> = ({ textures }) => {
  const frame = useCurrentFrame();
  const depthMats = useMemo(
    () => textures.map((t) => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 })),
    [textures],
  );
  const cam = camAt(frame);
  return (
    <group>
      {PRODUCTS.map((p, i) => {
        if (!productVisible(p.key, frame)) return null;
        const tex = textures[i];
        const img = tex.image as HTMLImageElement;
        const w = (p.h * img.width) / img.height;
        const x = wx(p.x), z = wz(p.y);
        const yaw = Math.atan2(cam.pos[0] - x, cam.pos[2] - z);
        const sq = squash(p.key, frame);
        const h = p.h * sq;
        return (
          <group key={p.key} position={[x, p.base + dropY(p.key, frame), z]} rotation={[0, yaw, 0]}>
            <mesh position={[0, h / 2, 0]} scale={[1 / Math.sqrt(sq), 1, 1]} castShadow customDepthMaterial={depthMats[i]}>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial map={tex} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.6} toneMapped={false} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Office3D: React.FC<{ textures: THREE.Texture[] }> = ({ textures }) => {
  const frame = useCurrentFrame();
  const mix = lightMix(frame);
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.15 + 0.15 * mix} />
      <hemisphereLight args={["#EEF4FF", "#C9BBA6", 0.7 + 0.5 * mix]} />
      <directionalLight
        position={[-5.5, 11, 6.5]}
        color="#FFF2DE"
        intensity={0.4 + 2.3 * mix}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-radius={5}
      />
      <directionalLight position={[6, 6, -4]} color="#D8E6FF" intensity={0.35 * mix} />
      <Floor />
      <Walls />
      <Furniture />
      <Products textures={textures} />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <N8AO aoRadius={0.55} intensity={2.4 * mix} distanceFalloff={0.8} quality="medium" halfRes={false} />
      </EffectComposer>
    </>
  );
};
