import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { staticFile, useCurrentFrame } from "remotion";
import { camAt } from "./camera";
import { C, FURNITURE, PRODUCTS, WALLS, wx, wz } from "./constants";
import { floorTexture } from "./textures";
import { dropY, furnitureRise, lightMix, productVisible, squash, wallRise } from "./timeline";

const WALL_H = 0.46;
const WALL_T = 0.1;

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

const Walls: React.FC = () => {
  const frame = useCurrentFrame();
  const mix = lightMix(frame);
  const color = `#${white.clone().lerp(navy, mix).getHexString()}`;
  return (
    <group>
      {WALLS.map(([x1, y1, x2, y2], i) => {
        const len = Math.hypot(x2 - x1, y2 - y1) / 100 + WALL_T;
        const rise = wallRise(i, frame);
        const h = WALL_H * rise;
        const horizontal = y1 === y2;
        return (
          <mesh key={i} castShadow receiveShadow position={[wx((x1 + x2) / 2), h / 2, wz((y1 + y2) / 2)]}>
            <boxGeometry args={horizontal ? [len, h, WALL_T] : [WALL_T, h, len]} />
            <meshStandardMaterial color={color} roughness={0.65} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
};

const Furniture: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <group>
      {FURNITURE.map((f, i) => {
        const r = furnitureRise(i, frame);
        if (r <= 0.001) return null;
        const h = f.h * r;
        const cx = wx(f.x + f.w / 2), cz = wz(f.y + f.d / 2);
        return (
          <mesh key={i} castShadow receiveShadow position={[cx, h / 2, cz]}>
            {f.round ? <cylinderGeometry args={[f.w / 200, f.w / 200, h, 40]} /> : <boxGeometry args={[f.w / 100, h, f.d / 100]} />}
            <meshStandardMaterial color={f.color ?? "#F7F9FB"} roughness={0.85} />
          </mesh>
        );
      })}
    </group>
  );
};

const Floor: React.FC = () => {
  const frame = useCurrentFrame();
  const mix = lightMix(frame);
  const light = useMemo(() => floorTexture("light"), []);
  const blue = useMemo(() => floorTexture("blueprint"), []);
  return (
    <group>
      <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.3, 0.18, 8.3]} />
        <meshStandardMaterial color={mix > 0.5 ? "#DCE4EC" : "#1F4166"} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial map={light} roughness={0.95} />
      </mesh>
      {mix < 0.999 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[10, 8]} />
          <meshBasicMaterial map={blue} transparent opacity={1 - mix} depthWrite={false} />
        </mesh>
      ) : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.14 * mix} />
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
              <meshStandardMaterial map={tex} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.7} />
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
      <hemisphereLight args={["#FFFFFF", "#B8C6D4", 0.9 + 0.6 * mix]} />
      <directionalLight
        position={[-5.5, 11, 6.5]}
        intensity={0.4 + 2.0 * mix}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-radius={4}
      />
      <Floor />
      <Walls />
      <Furniture />
      <Products textures={textures} />
    </>
  );
};
