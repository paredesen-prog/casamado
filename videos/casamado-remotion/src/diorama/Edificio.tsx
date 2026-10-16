import { useThree } from "@react-three/fiber";
import { Bloom, BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, N8AO, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, DepthOfFieldEffect } from "postprocessing";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { useFontsReady } from "../fonts";
import { useTextures } from "../useTextures";
import { BG, Env, Ground } from "./Diorama";
import { camAt, VAN_ARRIVE, VAN_YAW, vanAt } from "./edificioTimeline";
import { Brand, Counter, Delivery, EndCard, Hook, Progress, TopBand, TourChips } from "./overlays";
import { LOOKS, Person } from "./people";
import { Walkers } from "./walkers";
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

const Camera: React.FC<{ film: boolean }> = ({ film }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const { camera } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = 1;
    cam.far = 160;
    if (film) {
      const c = camAt(frame, width / height);
      cam.fov = c.fov;
      cam.position.copy(c.pos);
      cam.lookAt(c.target);
    } else {
      const az = THREE.MathUtils.degToRad(interpolate(frame, [0, durationInFrames], [40, 50]));
      const el = THREE.MathUtils.degToRad(40);
      const dist = 47;
      const target = new THREE.Vector3(-0.5, 0.0, -0.5);
      cam.fov = 22;
      cam.position.set(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el));
      cam.lookAt(target);
    }
    cam.updateProjectionMatrix();
  });
  return null;
};

/** Van drives in for the delivery scene; the driver walks a box toward the building. */
const Delivery3D: React.FC<{ logo: THREE.Texture; kraft: THREE.Texture }> = ({ logo, kraft }) => {
  const frame = useCurrentFrame();
  const v = vanAt(frame);
  if (!v.visible) return null;
  const moving = frame < VAN_ARRIVE[1];
  const bob = moving ? Math.sin(frame / 2.2) * 0.012 : 0;
  const w0 = VAN_ARRIVE[1] + 8;
  const t = interpolate(frame, [w0, w0 + 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const from = [2.26, -0.26, 5.09], to = [2.0, -0.26, 4.55];
  return (
    <group>
      <Van p={[v.pos[0], v.pos[1] + bob, v.pos[2]]} yaw={VAN_YAW} logo={logo} />
      {frame >= w0 ? (
        <Person p={[from[0] + (to[0] - from[0]) * t, from[1], from[2] + (to[2] - from[2]) * t]} yaw={0.56} pose="carry" moving={t > 0 && t < 1} box={kraft} {...LOOKS[5]} shirt="#1A3A5C" seed={21} />
      ) : null}
    </group>
  );
};

/** Cinematic depth of field: focus rides the camera target; the focus range opens up on wide shots
 *  so the whole building stays sharp and only room close-ups get a soft background. */
const FocusPull: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ref = useRef<DepthOfFieldEffect>(null);
  const c = camAt(frame, width / height);
  const dist = c.pos.distanceTo(c.target);
  useLayoutEffect(() => {
    const e = ref.current;
    if (!e) return;
    e.cocMaterial.worldFocusRange = interpolate(dist, [17, 30, 45], [7, 18, 45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    e.bokehScale = interpolate(dist, [17, 45], [2.6, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  });
  return <DepthOfField ref={ref} target={[c.target.x, c.target.y, c.target.z]} worldFocusRange={10} bokehScale={2} />;
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

const Scene: React.FC<{ tex: Tex; film: boolean }> = ({ tex, film }) => {
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
      <Camera film={film} />
      <Env />
      <Lights />
      <Ground />
      <Building tex={tex} m={m} floors={floors} animate={film} />
      {film ? <Delivery3D logo={tex.logo} kraft={m.kraft} /> : <Van p={[CELL * 0.98, -0.26, CELL * 0.98]} yaw={VAN_YAW} logo={tex.logo} />}
      {film ? <Walkers kraft={m.kraft} /> : null}
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <N8AO aoRadius={0.4} intensity={2.2} distanceFalloff={0.6} quality="medium" />
        {film ? <FocusPull /> : <></>}
        <Bloom mipmapBlur intensity={0.3} luminanceThreshold={0.92} luminanceSmoothing={0.1} />
        <BrightnessContrast brightness={-0.01} contrast={film ? 0.06 : 0} />
        <HueSaturation saturation={film ? -0.04 : 0} />
        <Vignette offset={0.25} darkness={film ? 0.6 : 0.5} />
        {film ? <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.16} /> : <></>}
      </EffectComposer>
    </>
  );
};

export const Edificio: React.FC<{ film?: boolean }> = ({ film = false }) => {
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
          <Scene tex={tex} film={film} />
        </ThreeCanvas>
      ) : null}
      {film ? (
        <>
          <TopBand />
          <Hook />
          <TourChips />
          <Progress />
          <Counter />
          <Delivery />
          <Brand />
          <EndCard />
          <Audio src={staticFile("audio/soundtrack-edificio.wav")} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
