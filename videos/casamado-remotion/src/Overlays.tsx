import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { camAt, project, V3 } from "./camera";
import { C, PRODUCTS, STATIONS, T, wx, wz } from "./constants";
import { MONO, RUBIK } from "./fonts";
import { chipFrame, lightMix } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Word: React.FC<{ children: React.ReactNode; at: number; underline?: number; color: string }> = ({ children, at, underline, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 140 } });
  const u = underline === undefined ? 0 : interpolate(frame, [underline, underline + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <span style={{ display: "inline-block", position: "relative", isolation: "isolate", opacity: s, transform: `translateY(${(1 - s) * 34}px)`, color, marginRight: 18 }}>
      {children}
      {underline !== undefined ? (
        <span style={{ position: "absolute", left: 0, right: 0, bottom: 2, height: 12, background: C.amber, transformOrigin: "0 50%", transform: `scaleX(${u})`, zIndex: -1 }} />
      ) : null}
    </span>
  );
};

export const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const color = interpolateColors(lightMix(frame), [0, 1], ["#FFFFFF", C.ink]);
  const out = interpolate(frame, [132, 146], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 84, top: 64, fontFamily: RUBIK, fontWeight: 600, fontSize: 74, lineHeight: 1.0, letterSpacing: "-0.015em", opacity: out, transform: `translateY(${(1 - out) * -20}px)` }}>
      <div><Word at={14} color={color}>¿Qué</Word><Word at={19} color={color}>le</Word><Word at={24} underline={62} color={color}>falta</Word></div>
      <div><Word at={32} color={color}>a</Word><Word at={36} color={color}>tu</Word><Word at={40} color={color}>oficina?</Word></div>
    </div>
  );
};

const TAGS: { text: string; at: number; p: [number, number] }[] = [
  { text: "SIN PAPEL", at: 100, p: [140, 160] },
  { text: "SIN CAFÉ", at: 108, p: [850, 150] },
  { text: "SIN TÓNER", at: 116, p: [480, 300] },
];

export const RoomTags: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = camAt(frame);
  const out = interpolate(frame, [138, 150], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {TAGS.map((t) => {
        const [x, y] = project(cam, [wx(t.p[0]), 0.9, wz(t.p[1])]);
        const s = spring({ frame: frame - t.at, fps, config: { damping: 11, stiffness: 160 } });
        return (
          <div key={t.text} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s}) rotate(${(1 - s) * -10 - 2}deg)`, opacity: Math.min(1, s * 1.5),
            fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: "0.08em", padding: "10px 16px", background: "#FFFFFF", color: C.ink, border: `3px solid ${C.ink}`, boxShadow: "0 10px 24px rgba(26,58,92,0.25)", whiteSpace: "nowrap" }}>
            {t.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const BrandCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const veilIn = interpolate(frame, [T.brandStart, T.brandStart + 16], [0, 1], clamp);
  const veilOut = interpolate(frame, [T.tourStart - 22, T.tourStart - 4], [1, 0], clamp);
  const veil = veilIn * veilOut;
  const logo = spring({ frame: frame - (T.brandStart + 12), fps, config: { damping: 12, stiffness: 110, mass: 0.9 } });
  const l1 = spring({ frame: frame - (T.brandStart + 34), fps, config: { damping: 16 } });
  const l2 = spring({ frame: frame - (T.brandStart + 46), fps, config: { damping: 16 } });
  const block = interpolate(frame, [T.brandStart + 56, T.brandStart + 72], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (veil <= 0.001) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(243,245,247,0.86)", opacity: veil, backdropFilter: "blur(6px)" }} />
      <div style={{ position: "absolute", left: 84, top: 64, fontFamily: RUBIK, fontWeight: 600, fontSize: 74, lineHeight: 1.02, letterSpacing: "-0.015em", color: C.ink, opacity: veilOut }}>
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 30}px)` }}>Todo lo que falta,</div>
        <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 30}px)` }}>
          en{" "}
          <span style={{ position: "relative", isolation: "isolate", display: "inline-block" }}>
            un solo pedido.
            <span style={{ position: "absolute", left: -10, right: -10, top: 16, bottom: -6, background: C.amber, transformOrigin: "0 50%", transform: `scaleX(${block})`, zIndex: -1 }} />
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 540, top: 640, width: 600, height: 600, marginLeft: -300, marginTop: -300, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 40px 90px rgba(26,58,92,0.18)", opacity: veilOut, transform: `scale(${0.6 + 0.4 * logo})` }} />
      <Img src={staticFile("casamado.png")} style={{ position: "absolute", left: 540, top: 640, width: 520, marginLeft: -260, marginTop: -142, opacity: Math.min(1, logo) * veilOut, transform: `scale(${logo})` }} />
    </AbsoluteFill>
  );
};

const topOf = (keys: string[]) => Math.max(...PRODUCTS.filter((p) => keys.indexOf(p.key) >= 0).map((p) => p.base + p.h));

export const TourChips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = camAt(frame);
  const small = interpolate(frame, [T.countStart, T.countStart + 60], [1, 0.58], clamp);
  return (
    <AbsoluteFill>
      {STATIONS.map((s, i) => {
        const at = chipFrame(i);
        if (frame < at) return null;
        const pop = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 170 } });
        const anchor: V3 = [wx(s.chip[0]), topOf(s.items) + 0.22, wz(s.chip[1])];
        const [x, y] = project(cam, anchor);
        return (
          <div key={s.label} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${pop * small})`, transformOrigin: "50% 100%",
            display: "flex", alignItems: "center", gap: 12, padding: "13px 24px", borderRadius: 999, background: C.ink, color: "#FFFFFF", whiteSpace: "nowrap", boxShadow: "0 12px 28px rgba(26,58,92,0.3)" }}>
            <span style={{ fontFamily: RUBIK, fontWeight: 600, fontSize: 29, letterSpacing: "0.08em" }}>{s.label}</span>
            <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 29, color: C.amber }}>· {s.n}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const TopBand: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [T.tourStart, T.tourStart + 14], [0, 1], clamp);
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 190, opacity: o, background: "linear-gradient(rgba(243,245,247,0.95) 50%, rgba(243,245,247,0))" }} />;
};

export const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const vis = interpolate(frame, [T.tourStart + 4, T.tourStart + 16, T.countStart + 20, T.countStart + 36], [0, 1, 1, 0], clamp);
  const filled = STATIONS.filter((_, i) => frame >= chipFrame(i)).length;
  if (vis <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 84, right: 84, top: 64, opacity: vis, display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: "0.1em", color: C.ink, whiteSpace: "nowrap" }}>OFICINA ABASTECIDA</div>
      <div style={{ flex: 1, display: "flex", gap: 8 }}>
        {STATIONS.map((s, i) => {
          const f = interpolate(frame, [chipFrame(i) - 2, chipFrame(i) + 8], [0, 1], clamp);
          return (
            <div key={s.label} style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(26,58,92,0.14)", overflow: "hidden" }}>
              <div style={{ width: `${f * 100}%`, height: "100%", background: i === STATIONS.length - 1 ? C.amber : C.ink }} />
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{filled}/6</div>
    </div>
  );
};

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = T.countStart + 40;
  const t = interpolate(frame, [start, start + 46], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const vis = interpolate(frame, [start - 6, start + 4], [0, 1], clamp);
  const label = spring({ frame: frame - (start + 44), fps, config: { damping: 16 } });
  if (vis <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 84, top: 54, opacity: vis, display: "flex", alignItems: "flex-start", gap: 30 }}>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: RUBIK, fontWeight: 600, fontSize: 150, lineHeight: 1, letterSpacing: "-0.03em", color: C.ink, fontVariantNumeric: "tabular-nums", transformOrigin: "0 100%", transform: `scale(${0.7 + 0.3 * t})` }}>
          +{fmt(Math.round(1100 * t))}
        </div>
        <div style={{ height: 14, marginTop: 8, background: C.amber, width: `${t * 100}%` }} />
      </div>
      <div style={{ marginTop: 30, opacity: label, transform: `translateX(${(1 - label) * -20}px)` }}>
        <div style={{ fontFamily: RUBIK, fontWeight: 600, fontSize: 44, lineHeight: 1.05, color: C.ink }}>productos<br />en 6 líneas</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, letterSpacing: "0.1em", color: C.inkSoft, marginTop: 12 }}>UN SOLO PROVEEDOR</div>
      </div>
    </div>
  );
};
