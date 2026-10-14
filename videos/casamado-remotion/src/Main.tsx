import { ThreeCanvas } from "@remotion/three";
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, interpolate, interpolateColors, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, SIZE, T } from "./constants";
import { EndCard } from "./EndCard";
import { useFontsReady } from "./fonts";
import { MapScene } from "./MapScene";
import { Office3D, PRODUCT_URLS } from "./Office3D";
import { BrandCard, Counter, HookTitle, Progress, RoomTags, TopBand, TourChips } from "./Overlays";
import { lightMix } from "./timeline";
import { useTextures } from "./useTextures";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const OfficeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const textures = useTextures(PRODUCT_URLS);
  const bg = interpolateColors(lightMix(frame), [0, 1], [C.blueprint, C.paper]);
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      {textures ? (
        <ThreeCanvas
          width={SIZE}
          height={SIZE}
          shadows
          flat
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.setClearColor(0x000000, 0); }}
          camera={{ fov: 35, position: [0, 17, 0.01] }}
        >
          <Office3D textures={textures} />
        </ThreeCanvas>
      ) : null}
      <RoomTags />
      <TopBand />
      <TourChips />
      <HookTitle />
      <BrandCard />
      <Progress />
      <Counter />
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ children: React.ReactNode; len: number }> = ({ children, len }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, len], [0, 1], clamp);
  const s = interpolate(frame, [0, len], [1.04, 1], clamp);
  return <AbsoluteFill style={{ opacity: o, transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

export const Main: React.FC = () => {
  const ready = useFontsReady();
  if (!ready) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Sequence from={0} durationInFrames={T.officeEnd} name="Oficina 3D">
        <OfficeScene />
      </Sequence>
      <Sequence from={T.mapStart} durationInFrames={T.mapEnd - T.mapStart} name="Despacho">
        <Fade len={T.officeEnd - T.mapStart}><MapScene /></Fade>
      </Sequence>
      <Sequence from={T.endStart} durationInFrames={T.total - T.endStart} name="Cierre">
        <Fade len={T.mapEnd - T.endStart}><EndCard /></Fade>
      </Sequence>
      <Audio src={staticFile("audio/soundtrack.wav")} />
    </AbsoluteFill>
  );
};
