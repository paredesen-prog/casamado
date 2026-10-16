import { RoundedBox } from "@react-three/drei";
import React from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";

type V3 = [number, number, number];
export type Pose = "sit" | "stand" | "carry" | "present" | "walk";

const S = { castShadow: true, receiveShadow: true } as const;

const Limb: React.FC<{ len: number; r: number; c: string }> = ({ len, r, c }) => (
  <mesh position={[0, -len / 2, 0]} {...S}>
    <capsuleGeometry args={[r, len - 2 * r, 6, 12]} />
    <meshStandardMaterial color={c} roughness={0.75} />
  </mesh>
);

/**
 * Stylised person, facing -z. Origin = floor point under the hips
 * (for "sit" put it at the chair origin; the seat is ~0.5 m high).
 */
export const Person: React.FC<{
  p: V3; yaw?: number; pose?: Pose; shirt?: string; pants?: string; skin?: string; hair?: string; seed?: number; box?: THREE.Texture; long?: boolean; moving?: boolean; phase?: number;
}> = ({ p, yaw = 0, pose = "stand", moving = false, phase, shirt = "#1A3A5C", pants = "#2E3238", skin = "#C99772", hair = "#2B1E16", seed = 1, box, long = false }) => {
  const frame = useCurrentFrame();
  const sit = pose === "sit";
  const lift = sit ? -0.33 : 0; // torso/head drop when seated
  const look = Math.sin(frame / 38 + seed * 1.7) * 0.18;
  const breathe = 1 + Math.sin(frame / 22 + seed) * 0.012;
  const step = phase !== undefined ? Math.sin(phase) : pose === "walk" || moving ? Math.sin(frame / 4.5 + seed) : 0;
  const walking = pose === "walk";
  const armX = pose === "carry" ? 1.35 : sit ? 0.95 : walking ? step * 0.4 : 0.08;
  const armXL = pose === "present" ? 0.08 : armX;
  const armXR = pose === "present" ? 2.3 : walking ? -armX : armX;
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      {/* legs */}
      {[-1, 1].map((s) =>
        sit ? (
          <group key={s}>
            <group position={[s * 0.085, 0.52, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <Limb len={0.46} r={0.07} c={pants} />
            </group>
            <group position={[s * 0.085, 0.52, -0.4]}>
              <Limb len={0.5} r={0.062} c={pants} />
            </group>
            <mesh position={[s * 0.085, 0.03, -0.45]} {...S}>
              <boxGeometry args={[0.09, 0.06, 0.2]} />
              <meshStandardMaterial color="#1E1E21" roughness={0.6} />
            </mesh>
          </group>
        ) : (
          <group key={s} position={[s * 0.085, 0.88, 0]} rotation={[step * 0.35 * s, 0, 0]}>
            <Limb len={0.84} r={0.068} c={pants} />
            <mesh position={[0, -0.85, -0.04]} {...S}>
              <boxGeometry args={[0.09, 0.06, 0.2]} />
              <meshStandardMaterial color="#1E1E21" roughness={0.6} />
            </mesh>
          </group>
        ),
      )}
      {/* hips + torso */}
      <RoundedBox args={[0.32, 0.16, 0.2]} radius={0.05} smoothness={3} position={[0, 0.88 + (sit ? -0.34 : 0), sit ? 0.04 : 0]} {...S}>
        <meshStandardMaterial color={pants} roughness={0.75} />
      </RoundedBox>
      <group position={[0, 1.16 + lift, sit ? 0.05 : 0]} scale={[1, breathe, 1]}>
        <RoundedBox args={[0.36, 0.5, 0.22]} radius={0.08} smoothness={4} {...S}>
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </RoundedBox>
      </group>
      {/* arms */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.225, 1.37 + lift, sit ? 0.05 : 0]} rotation={[s > 0 ? armXR : armXL, 0, s * (pose === "carry" ? -0.12 : sit ? -0.08 : 0.06)]}>
          <Limb len={0.5} r={0.052} c={shirt} />
          <mesh position={[0, -0.5, 0]} {...S}>
            <sphereGeometry args={[0.048, 12, 10]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* head */}
      <group position={[0, 1.56 + lift, sit ? 0.05 : 0]} rotation={[0, look, 0]}>
        <mesh position={[0, -0.12, 0]} {...S}>
          <cylinderGeometry args={[0.045, 0.05, 0.1, 12]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]} {...S}>
          <sphereGeometry args={[0.115, 24, 18]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.06, 0.025]} scale={[1.04, 0.82, 1.02]} {...S}>
          <sphereGeometry args={[0.12, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>
        {long ? (
          <mesh position={[0, -0.06, 0.06]} {...S}>
            <boxGeometry args={[0.24, 0.22, 0.09]} />
            <meshStandardMaterial color={hair} roughness={0.8} />
          </mesh>
        ) : null}
      </group>
      {/* carried box */}
      {pose === "carry" ? (
        <mesh position={[0, 1.08, -0.36]} {...S}>
          <boxGeometry args={[0.46, 0.32, 0.34]} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <meshStandardMaterial key={i} attach={`material-${i}`} map={box && (i === 0 || i === 4) ? box : undefined} color={box && (i === 0 || i === 4) ? "#ffffff" : "#BF8F5A"} roughness={0.85} />
          ))}
        </mesh>
      ) : null}
    </group>
  );
};

/** A small cast of outfits / skin tones to pick from deterministically. */
export const LOOKS = [
  { shirt: "#1A3A5C", pants: "#2E3238", skin: "#C99772", hair: "#2B1E16" },
  { shirt: "#F3F1EC", pants: "#3A4A5E", skin: "#8D5A3B", hair: "#141414" },
  { shirt: "#F5A623", pants: "#2B2B2F", skin: "#E3B58F", hair: "#6B4226", long: true },
  { shirt: "#7E9C83", pants: "#C9B79C", skin: "#B07850", hair: "#1E1611" },
  { shirt: "#B85C3A", pants: "#2E3238", skin: "#EBC3A1", hair: "#C9A15A", long: true },
  { shirt: "#5E849E", pants: "#22262B", skin: "#6E4630", hair: "#0F0F0F" },
  { shirt: "#E9E3D8", pants: "#1A3A5C", skin: "#D7A47E", hair: "#8A8A8A" },
];
