import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Cam, project, V3 } from "./camera";
import { C, SIZE } from "./constants";
import { MONO, RUBIK } from "./fonts";
import { mapTexture, mapWorld } from "./textures";
import { useTextures } from "./useTextures";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

const pt = (x: number, y: number, h = 0.04): THREE.Vector3 => { const [a, b] = mapWorld(x, y); return new THREE.Vector3(a, h, b); };
const ORIGIN = pt(640, 1150);
const DEST = pt(1600, 900);
const curve = new THREE.CatmullRomCurve3([ORIGIN, pt(860, 1110), pt(1060, 960), pt(1290, 980), pt(1460, 900), DEST], false, "catmullrom", 0.5);

const DRIVE: [number, number] = [22, 118];
export const driveT = (f: number) => interpolate(f, [DRIVE[0], DRIVE[1]], [0, 1], { ...clamp, easing: ease });

const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mapCam = (f: number): Cam => {
  const startPos: V3 = [-1.2, 11.5, 9.5];
  const startTarget: V3 = [0.6, 0, 0.4];
  const endTarget: V3 = [DEST.x - 0.4, 0.5, DEST.z - 2.0];
  const endPos: V3 = [DEST.x - 3.6, 6.4, DEST.z + 5.6];
  const t = interpolate(f, [8, 150], [0, 1], { ...clamp, easing: ease });
  return { pos: lerp3(startPos, endPos, t), target: lerp3(startTarget, endTarget, t), fov: 34 };
};

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = mapCam(frame);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = c.fov; cam.near = 0.1; cam.far = 300;
    cam.position.set(...c.pos); cam.lookAt(...c.target); cam.updateProjectionMatrix();
  });
  return null;
};

const Route: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.07, 10, false), []);
  const total = geo.index ? geo.index.count : 0;
  const t = driveT(frame);
  geo.setDrawRange(0, Math.floor((total * t) / 6) * 6);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={C.ink} roughness={0.5} />
    </mesh>
  );
};

const Van: React.FC = () => {
  const frame = useCurrentFrame();
  const t = driveT(frame);
  const p = curve.getPointAt(Math.min(0.999, t));
  const tan = curve.getTangentAt(Math.min(0.999, t));
  const yaw = Math.atan2(tan.x, tan.z);
  const bob = Math.sin(frame * 0.9) * 0.012 * (t > 0 && t < 1 ? 1 : 0);
  const vis = interpolate(frame, [DRIVE[0] - 8, DRIVE[0]], [0, 1], clamp);
  return (
    <group position={[p.x, 0.02 + bob, p.z]} rotation={[0, yaw, 0]} scale={vis * 1.0}>
      <mesh position={[0, 0.34, -0.12]} castShadow><boxGeometry args={[0.52, 0.48, 0.82]} /><meshStandardMaterial color="#FFFFFF" roughness={0.5} /></mesh>
      <mesh position={[0, 0.28, 0.42]} castShadow><boxGeometry args={[0.5, 0.36, 0.3]} /><meshStandardMaterial color={C.ink} roughness={0.4} /></mesh>
      <mesh position={[0, 0.3, 0.575]}><boxGeometry args={[0.42, 0.16, 0.01]} /><meshStandardMaterial color="#9FB6CB" roughness={0.2} /></mesh>
      <mesh position={[0.262, 0.3, -0.12]}><boxGeometry args={[0.01, 0.08, 0.8]} /><meshStandardMaterial color={C.amber} /></mesh>
      <mesh position={[-0.262, 0.3, -0.12]}><boxGeometry args={[0.01, 0.08, 0.8]} /><meshStandardMaterial color={C.amber} /></mesh>
      {[[-0.27, 0.32], [0.27, 0.32], [-0.27, -0.36], [0.27, -0.36]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.08, 20]} /><meshStandardMaterial color="#1C2630" /></mesh>
      ))}
    </group>
  );
};

const Building: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrive = spring({ frame: frame - (DRIVE[1] - 2), fps, config: { damping: 8, stiffness: 160 } });
  const pulse = 1 + 0.06 * Math.sin(Math.min(1, arrive) * Math.PI);
  const ring = interpolate(frame, [DRIVE[1], DRIVE[1] + 30], [0, 1], clamp);
  return (
    <group position={[DEST.x, 0, DEST.z - 1.55]}>
      <group scale={[pulse, pulse, pulse]}>
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 1.4, 1.1]} /><meshStandardMaterial color="#FFFFFF" roughness={0.6} /></mesh>
        <mesh position={[0, 1.43, 0]} castShadow><boxGeometry args={[1.58, 0.08, 1.18]} /><meshStandardMaterial color={C.ink} /></mesh>
        {[0.35, 0.75, 1.1].map((y) => (
          <mesh key={y} position={[0, y, 0.556]}><boxGeometry args={[1.2, 0.16, 0.01]} /><meshStandardMaterial color="#8FA9C1" roughness={0.15} metalness={0.2} /></mesh>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1.55]}>
        <ringGeometry args={[0.35 + ring * 1.4, 0.45 + ring * 1.4, 64]} />
        <meshBasicMaterial color={C.amber} transparent opacity={(1 - ring) * 0.9} />
      </mesh>
    </group>
  );
};

const Origin: React.FC<{ logo: THREE.Texture }> = ({ logo }) => {
  const frame = useCurrentFrame();
  const c = mapCam(frame);
  const yaw = Math.atan2(c.pos[0] - ORIGIN.x, c.pos[2] - ORIGIN.z);
  return (
    <group position={[ORIGIN.x, 0, ORIGIN.z]}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow><cylinderGeometry args={[0.55, 0.6, 0.12, 48]} /><meshStandardMaterial color={C.ink} /></mesh>
      <group rotation={[0, yaw, 0]}>
        <mesh position={[0, 0.75, 0]} castShadow><circleGeometry args={[0.55, 48]} /><meshStandardMaterial map={logo} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh>
      </group>
    </group>
  );
};

const MapWorld: React.FC<{ logo: THREE.Texture }> = ({ logo }) => {
  const tex = useMemo(() => mapTexture(), []);
  return (
    <>
      <Rig />
      <hemisphereLight args={["#FFFFFF", "#B8C6D4", 1.4]} />
      <directionalLight position={[-6, 12, 7]} intensity={2.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004} shadow-radius={4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 16]} /><meshStandardMaterial map={tex} roughness={0.95} /></mesh>
      <Route />
      <Origin logo={logo} />
      <Building />
      <Van />
    </>
  );
};

const Label: React.FC<{ p: V3; text: string; frame: number; at: number; strong?: boolean }> = ({ p, text, frame, at, strong }) => {
  const [x, y] = project(mapCam(frame), p);
  const o = interpolate(frame, [at, at + 10], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, 0)", opacity: o, fontFamily: MONO, fontWeight: 500, fontSize: strong ? 26 : 22, letterSpacing: "0.1em",
      color: strong ? "#FFFFFF" : C.ink, background: strong ? C.ink : "rgba(255,255,255,0.9)", padding: "6px 12px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

const MapOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h1 = spring({ frame: frame - 60, fps, config: { damping: 15 } });
  const block = interpolate(frame, [70, 86], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const h2 = spring({ frame: frame - 82, fps, config: { damping: 16 } });
  const chips = ["Pago con Webpay", "Atención 24/7", "Precios mayoristas"];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 330, background: "linear-gradient(rgba(243,245,247,0.97) 55%, rgba(243,245,247,0))" }} />
      <Label p={[ORIGIN.x, 0, ORIGIN.z + 0.75]} text="CASAMADO" frame={frame} at={14} />
      <Label p={[DEST.x, 0, DEST.z - 0.2]} text="TU OFICINA" frame={frame} at={DRIVE[1] - 4} strong />
      <div style={{ position: "absolute", left: 84, top: 64, fontFamily: RUBIK, fontWeight: 600, color: C.ink }}>
        <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: "-0.015em", opacity: h1, transform: `translateY(${(1 - h1) * 30}px)` }}>
          <span style={{ position: "relative", isolation: "isolate", display: "inline-block" }}>
            Despacho gratis
            <span style={{ position: "absolute", left: -12, right: -12, top: 18, bottom: -8, background: C.amber, transformOrigin: "0 50%", transform: `scaleX(${block})`, zIndex: -1 }} />
          </span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 500, marginTop: 18, opacity: h2, transform: `translateY(${(1 - h2) * 20}px)` }}>sobre $70.000 en la Región Metropolitana</div>
      </div>
      <div style={{ position: "absolute", left: 84, right: 84, bottom: 70, display: "flex", gap: 18 }}>
        {chips.map((c, i) => {
          const s = spring({ frame: frame - (128 + i * 7), fps, config: { damping: 13, stiffness: 150 } });
          return (
            <div key={c} style={{ flex: 1, textAlign: "center", padding: "20px 10px", borderRadius: 999, background: "#FFFFFF", border: `3px solid ${C.ink}`, fontFamily: RUBIK, fontWeight: 600, fontSize: 27,
              color: C.ink, whiteSpace: "nowrap", opacity: s, transform: `translateY(${(1 - s) * 40}px)`, boxShadow: "0 12px 26px rgba(26,58,92,0.16)" }}>{c}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const MapScene: React.FC = () => {
  const textures = useTextures([staticFile("favicon.png")]);
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {textures ? (
        <ThreeCanvas width={SIZE} height={SIZE} shadows flat gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.setClearColor(0x000000, 0); }} camera={{ fov: 34, position: [0, 12, 9] }}>
          <MapWorld logo={textures[0]} />
        </ThreeCanvas>
      ) : null}
      <MapOverlay />
    </AbsoluteFill>
  );
};
