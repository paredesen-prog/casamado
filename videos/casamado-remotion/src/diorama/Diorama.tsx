import { MeshReflectorMaterial } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFontsReady } from "../fonts";
import { useTextures } from "../useTextures";
import { Books, Box, DeskSetup, Frame, OfficeChair, Plant, ProductBox, ProductCard, ShelfRack } from "./props";
import { clockTexture, marbleTexture, orderScreenTexture, posterBrand, posterLines, posterSunset, storeScreenTexture, woodTexture } from "./textures";

export const BG = "#F0A868";
const ROOM = 1.6; // interior half-size
const T = 0.14; // wall thickness
const H = 2.7; // wall height
const WIN = { z0: 0.2, z1: 1.15, y0: 0.78, y1: 2.3 };
const WALL_OUT = "#ECE6DC";
const WALL_IN = "#36373C";

const FILES = {
  papel: "products/papel-fotocopia-a4-500-hjs-75-gr-excelle.png",
  cuaderno: "products/cuaderno-universitario-7-mm100-hjs-1.png",
  cafe: "products/haiti-cafe-molido-super-moka-bolsa-250gr.png",
  galleta: "products/galleta-coco-120-gr.png",
  tork: "products/image-66.png",
  logo: "casamado.png",
};
const KEYS = Object.keys(FILES) as (keyof typeof FILES)[];
type Tex = Record<keyof typeof FILES, THREE.Texture>;

const Camera: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { camera } = useThree();
  useLayoutEffect(() => {
    const az = THREE.MathUtils.degToRad(interpolate(frame, [0, durationInFrames], [39, 51]));
    const el = THREE.MathUtils.degToRad(31);
    const dist = 17.5;
    const target = new THREE.Vector3(0.0, 0.95, 0.0);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 20;
    cam.near = 1;
    cam.far = 80;
    cam.position.set(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el));
    cam.lookAt(target);
    cam.updateProjectionMatrix();
  });
  return null;
};

/** Soft studio reflections without downloading an HDRI. */
export const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    pm.dispose();
  }, [gl, scene]);
  return null;
};

/** A wall segment: light body with a dark interior skin on one face. */
const Wall: React.FC<{ x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; skin: "+x" | "+z" }> = ({ x0, x1, y0, y1, z0, z1, skin }) => {
  const c: [number, number, number] = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const s: [number, number, number] = [x1 - x0, y1 - y0, z1 - z0];
  return (
    <group>
      <Box p={c} s={s} c={WALL_OUT} r={0.9} />
      {skin === "+z" ? (
        <Box p={[c[0], c[1], z1 + 0.002]} s={[s[0], s[1], 0.004]} c={WALL_IN} r={0.92} />
      ) : (
        <Box p={[x1 + 0.002, c[1], c[2]]} s={[0.004, s[1], s[2]]} c={WALL_IN} r={0.92} />
      )}
    </group>
  );
};

const Shell: React.FC<{ marble: THREE.Texture; wood: THREE.Texture }> = ({ marble, wood }) => {
  const L = -ROOM - T; // outer face of left/back walls
  const front = ROOM + 0.1;
  const slats = useMemo(() => {
    const out: number[] = [];
    for (let x = -0.6; x <= 0.98; x += 0.072) out.push(x);
    return out;
  }, []);
  const slatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", map: wood, roughness: 0.5 }), [wood]);
  return (
    <group>
      {/* slab + floor */}
      <Box p={[(L + front) / 2, -0.13, (L + front) / 2]} s={[front - L, 0.26, front - L]} c="#E9E3D9" r={0.8} />
      <mesh position={[0.05, 0.002, 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM * 2 + 0.1, ROOM * 2 + 0.1]} />
        <meshStandardMaterial map={marble} roughness={0.38} metalness={0} />
      </mesh>
      {/* back wall */}
      <Wall x0={L} x1={front} y0={0} y1={H} z0={L} z1={-ROOM} skin="+z" />
      {/* left wall around the window */}
      <Wall x0={L} x1={-ROOM} y0={0} y1={WIN.y0} z0={-ROOM} z1={front} skin="+x" />
      <Wall x0={L} x1={-ROOM} y0={WIN.y1} y1={H} z0={-ROOM} z1={front} skin="+x" />
      <Wall x0={L} x1={-ROOM} y0={WIN.y0} y1={WIN.y1} z0={-ROOM} z1={WIN.z0} skin="+x" />
      <Wall x0={L} x1={-ROOM} y0={WIN.y0} y1={WIN.y1} z0={WIN.z1} z1={front} skin="+x" />
      {/* window: white frame, sill, bright glass */}
      <group>
        {[
          [WIN.z0 + 0.025, (WIN.y0 + WIN.y1) / 2, 0.05, WIN.y1 - WIN.y0],
          [WIN.z1 - 0.025, (WIN.y0 + WIN.y1) / 2, 0.05, WIN.y1 - WIN.y0],
          [(WIN.z0 + WIN.z1) / 2, WIN.y1 - 0.025, WIN.z1 - WIN.z0, 0.05],
          [(WIN.z0 + WIN.z1) / 2, WIN.y0 + 0.025, WIN.z1 - WIN.z0, 0.05],
          [(WIN.z0 + WIN.z1) / 2, WIN.y0 + 0.62, WIN.z1 - WIN.z0, 0.035],
        ].map(([z, y, w, h], i) => (
          <Box key={i} p={[-ROOM - T / 2, y, z]} s={[0.06, h, w]} c="#F5F3EF" r={0.5} />
        ))}
        <Box p={[-ROOM + 0.03, WIN.y0 - 0.015, (WIN.z0 + WIN.z1) / 2]} s={[0.1, 0.03, WIN.z1 - WIN.z0 + 0.1]} c="#F5F3EF" r={0.5} />
        <mesh position={[-ROOM - T / 2 - 0.01, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[WIN.z1 - WIN.z0, WIN.y1 - WIN.y0]} />
          <meshBasicMaterial color="#FFF3E0" toneMapped={false} transparent opacity={0.92} />
        </mesh>
      </group>
      {/* wood slat feature wall behind the desk */}
      <Box p={[0.19, H / 2, -ROOM + 0.006]} s={[1.66, H, 0.008]} c="#2A1D15" r={0.9} />
      {slats.map((x) => (
        <mesh key={x} position={[x, H / 2, -ROOM + 0.024]} material={slatMat} castShadow receiveShadow>
          <boxGeometry args={[0.046, H, 0.028]} />
        </mesh>
      ))}
      {/* skirting */}
      <Box p={[(-ROOM + front) / 2, 0.03, -ROOM + 0.006]} s={[front + ROOM, 0.06, 0.012]} c="#2E2F33" />
    </group>
  );
};

export const Ground: React.FC = () => (
  <mesh position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[80, 80]} />
    <MeshReflectorMaterial
      color="#E59A5C"
      blur={[500, 150]}
      resolution={1024}
      mixBlur={1}
      mixStrength={0.6}
      mirror={0.18}
      roughness={0.85}
      depthScale={0.8}
      minDepthThreshold={0.3}
      maxDepthThreshold={1.4}
      metalness={0.15}
    />
  </mesh>
);

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#FFE7CC", "#B8774A", 0.55]} />
    {/* low warm sun through the window */}
    <directionalLight
      position={[-6.6, 5.4, -1.1]}
      color="#FFD49C"
      intensity={5.0}
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-left={-5}
      shadow-camera-right={5}
      shadow-camera-top={5}
      shadow-camera-bottom={-5}
      shadow-camera-near={1}
      shadow-camera-far={30}
      shadow-bias={-0.0002}
      shadow-normalBias={0.015}
      shadow-radius={3}
    />
    {/* soft key from the camera side so the interior reads */}
    <directionalLight position={[7, 9, 8]} color="#FFF1E2" intensity={0.9} />
    {/* warm bounce inside the room */}
    <pointLight position={[0.3, 2.3, -0.3]} color="#FFC890" intensity={2.2} distance={5} decay={2} />
  </>
);

const Contents: React.FC<{ tex: Tex; wood: THREE.Texture }> = ({ tex, wood }) => {
  const store = useMemo(() => storeScreenTexture(tex.logo.image as HTMLImageElement, [tex.papel, tex.cafe, tex.cuaderno, tex.tork].map((t) => t.image as HTMLImageElement)), [tex]);
  const order = useMemo(() => orderScreenTexture(tex.logo.image as HTMLImageElement), [tex]);
  const sunset = useMemo(posterSunset, []);
  const brand = useMemo(() => posterBrand(tex.logo.image as HTMLImageElement), [tex]);
  const lines = useMemo(posterLines, []);
  const clock = useMemo(clockTexture, []);
  const toCam = 0.62;
  return (
    <group>
      <DeskSetup store={store} order={order} wood={wood} />
      <OfficeChair p={[0.42, 0, -0.55]} yaw={0.22} />

      {/* products on the desk */}
      <ProductBox p={[1.3, 0.74, -1.33]} size={[0.3, 0.42, 0.07]} tex={tex.papel} yaw={toCam - 0.25} />
      <ProductBox p={[-0.02, 0.74, -0.98]} size={[0.24, 0.012, 0.3]} tex={tex.cuaderno} face="top" side="#5C9A35" yaw={0.35} />

      {/* floating shelf above the monitor */}
      <Box p={[0.16, 1.55, -ROOM + 0.16]} s={[1.25, 0.035, 0.26]} c="#FFFFFF" map={wood} r={0.5} />
      <Books p={[-0.42, 1.568, -ROOM + 0.13]} seed={3} n={7} />
      <Plant p={[0.0, 1.568, -ROOM + 0.15]} kind="trail" seed={4} size={0.75} pot="#F1EEE8" potH={0.16} potR={0.09} />
      <ProductCard p={[0.36, 1.568, -ROOM + 0.16]} h={0.34} tex={tex.cafe} yaw={0.35} />
      <Plant p={[0.66, 1.568, -ROOM + 0.15]} kind="small" seed={9} size={1.1} pot="#C66B3D" potH={0.11} potR={0.07} />

      {/* small shelf + prints on the right */}
      <Box p={[1.33, 1.3, -ROOM + 0.13]} s={[0.62, 0.03, 0.2]} c="#FFFFFF" map={wood} r={0.5} />
      <ProductCard p={[1.22, 1.315, -ROOM + 0.12]} h={0.13} tex={tex.galleta} yaw={0.3} lean={0.12} />
      <Plant p={[1.5, 1.315, -ROOM + 0.12]} kind="small" seed={12} size={0.9} pot="#2B2B2F" potH={0.1} potR={0.06} />
      <Frame p={[1.2, 1.98, -ROOM + 0.02]} w={0.32} h={0.44} map={sunset} />
      <Frame p={[1.52, 2.1, -ROOM + 0.02]} w={0.2} h={0.2} map={lines} />
      <mesh position={[-1.12, 2.14, -ROOM + 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 48]} />
        <meshStandardMaterial attach="material-0" color="#1E1E21" />
        <meshStandardMaterial attach="material-1" map={clock} roughness={0.4} />
        <meshStandardMaterial attach="material-2" color="#1E1E21" />
      </mesh>

      {/* left wall: shelving with stock, print above */}
      <ShelfRack p={[-1.43, 0, -0.95]} len={0.95} depth={0.3} levels={[0.08, 0.5, 0.92, 1.32]} wood={wood} yaw={Math.PI / 2} />
      {[0, 1, 2].map((i) => (
        <ProductBox key={i} p={[-1.43, 0.095 + i * 0.075, -1.2]} size={[0.24, 0.075, 0.34]} tex={tex.papel} face="top" yaw={0.04 * (i - 1)} />
      ))}
      <ProductBox p={[-1.43, 0.095, -0.72]} size={[0.38, 0.17, 0.2]} tex={tex.tork} yaw={Math.PI / 2} side="#F7F7F5" />
      <Books p={[-1.45, 0.515, -1.38]} seed={8} n={6} />
      <Plant p={[-1.43, 0.515, -0.75]} kind="small" seed={21} size={1.3} pot="#E9E5DE" potH={0.13} potR={0.08} />
      <Plant p={[-1.43, 0.935, -1.05]} kind="bush" seed={6} size={0.55} pot="#C66B3D" potH={0.2} potR={0.11} />
      <Plant p={[-1.43, 1.335, -0.95]} kind="trail" seed={13} size={0.8} pot="#F1EEE8" potH={0.15} potR={0.09} />
      <Frame p={[-ROOM + 0.02, 2.0, -0.95]} w={0.34} h={0.46} map={brand} rot={[0, Math.PI / 2, 0]} />

      {/* floor plants */}
      <Plant p={[-1.2, 0, 1.3]} kind="bush" seed={2} size={1.55} pot="#C66B3D" potH={0.3} potR={0.17} />
      <Plant p={[1.38, 0, -0.5]} kind="snake" seed={5} size={1.2} pot="#2B2B2F" potH={0.32} potR={0.13} />
    </group>
  );
};

const Scene: React.FC<{ tex: Tex }> = ({ tex }) => {
  const marble = useMemo(marbleTexture, []);
  const wood = useMemo(() => woodTexture(3), []);
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 24, 42]} />
      <Camera />
      <Env />
      <Lights />
      <Ground />
      <Shell marble={marble} wood={wood} />
      <Contents tex={tex} wood={wood} />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <N8AO aoRadius={0.35} intensity={2.2} distanceFalloff={0.5} quality="medium" />
        <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.92} luminanceSmoothing={0.1} />
        <Vignette offset={0.25} darkness={0.55} />
      </EffectComposer>
    </>
  );
};

export const Diorama: React.FC = () => {
  const { width, height } = useVideoConfig();
  const fonts = useFontsReady();
  const list = useTextures(KEYS.map((k) => staticFile(FILES[k])));
  const tex = useMemo(() => (list ? (KEYS.reduce((o, k, i) => ({ ...o, [k]: list[i] }), {}) as Tex) : null), [list]);
  return (
    <AbsoluteFill style={{ background: BG }}>
      {fonts && tex ? (
        <ThreeCanvas
          width={width}
          height={height}
          shadows
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
          camera={{ fov: 20, position: [12, 10, 12] }}
        >
          <Scene tex={tex} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
