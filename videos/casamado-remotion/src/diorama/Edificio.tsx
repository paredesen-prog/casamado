import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { useFontsReady } from "../fonts";
import { useTextures } from "../useTextures";
import { BG, Env, Ground } from "./Diorama";
import { Building, CELL, Mats, Tex, Van } from "./rooms";
import { clockTexture, kraftTexture, marbleTexture, orderScreenTexture, plankTexture, posterBrand, posterLines, posterSunset, speckleTexture, storeScreenTexture, tileTexture, woodTexture } from "./textures";

const FILES: Record<keyof Tex, string> = {
  papel: "products/papel-fotocopia-a4-500-hjs-75-gr-excelle.png",
  cuaderno: "products/cuaderno-universitario-7-mm100-hjs-1.png",
  cafe: "products/haiti-cafe-molido-super-moka-bolsa-250gr.png",
  galleta: "products/galleta-coco-120-gr.png",
  tork: "products/image-66.png",
  disp: "products/dispensador-jabon-multiflex-plastico-neg.png",
  jabon: "products/jabn-lquido.png",
  toallitas: "products/image-67.png",
  guantes: "products/image-33.png",
  teclado: "products/image-69.png",
  logo: "casamado.png",
};
const KEYS = Object.keys(FILES) as (keyof Tex)[];

const Camera: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { camera } = useThree();
  useLayoutEffect(() => {
    const az = THREE.MathUtils.degToRad(interpolate(frame, [0, durationInFrames], [40, 50]));
    const el = THREE.MathUtils.degToRad(40);
    const dist = 47;
    const target = new THREE.Vector3(-0.5, 0.0, -0.5);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 22;
    cam.near = 1;
    cam.far = 140;
    cam.position.set(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el));
    cam.lookAt(target);
    cam.updateProjectionMatrix();
  });
  return null;
};

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#FFE7CC", "#B8774A", 0.6]} />
    <directionalLight
      position={[-11, 9.5, -6.5]}
      color="#FFD49C"
      intensity={4.2}
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
      shadow-camera-near={1}
      shadow-camera-far={45}
      shadow-bias={-0.0002}
      shadow-normalBias={0.02}
      shadow-radius={3}
    />
    <directionalLight position={[9, 12, 10]} color="#FFF1E2" intensity={1.0} />
  </>
);

const Scene: React.FC<{ tex: Tex }> = ({ tex }) => {
  const m: Mats = useMemo(() => {
    const logo = tex.logo.image as HTMLImageElement;
    return {
      wood: woodTexture(3),
      kraft: kraftTexture(logo),
      store: storeScreenTexture(logo, [tex.papel, tex.cafe, tex.cuaderno, tex.tork].map((t) => t.image as HTMLImageElement)),
      order: orderScreenTexture(logo),
      sunset: posterSunset(),
      brand: posterBrand(logo),
      lines: posterLines(),
      clock: clockTexture(),
    };
  }, [tex]);
  const floors = useMemo(
    () => ({
      meeting: plankTexture(7),
      office: speckleTexture([118, 128, 140], 0.18, 0.05, 3),
      cafe: tileTexture("#EDE7DC", "#2E3A46", 8, "#B9B4AC", 5),
      lobby: marbleTexture(),
      wc: tileTexture("#D5DDE2", "#C3CED5", 10, "#AEB8BE", 6),
      store: speckleTexture([168, 166, 160], 0.1, 0.12, 8),
      it: tileTexture("#4A4D55", "#43464E", 6, "#30333A", 9),
      boss: plankTexture(11, [176, 120, 78]),
    }),
    [],
  );
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 75, 140]} />
      <Camera />
      <Env />
      <Lights />
      <Ground />
      <Building tex={tex} m={m} floors={floors} />
      <Van p={[CELL * 0.98, -0.26, CELL * 0.98]} yaw={Math.PI / 4} logo={tex.logo} />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <N8AO aoRadius={0.4} intensity={2.2} distanceFalloff={0.6} quality="medium" />
        <Bloom mipmapBlur intensity={0.3} luminanceThreshold={0.92} luminanceSmoothing={0.1} />
        <Vignette offset={0.25} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

export const Edificio: React.FC = () => {
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
          camera={{ fov: 22, position: [25, 25, 25] }}
        >
          <Scene tex={tex} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
