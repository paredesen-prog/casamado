import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../constants";
import { MONO, RUBIK } from "../fonts";
import { camAt, chipFrame, clamp, E, project, roomXZ, stopStart, STOPS } from "./edificioTimeline";

const useLayout = () => {
  const { width, height } = useVideoConfig();
  const v = height > width;
  // portrait keeps clear of the Reels/TikTok UI (top ~240 px, bottom ~380 px)
  return { width, height, v, pad: v ? 80 : 72, top: v ? 250 : 60, bottom: v ? 400 : 64, title: v ? 96 : 78 };
};

const Mark: React.FC<{ children: React.ReactNode; at: number; color?: string; inset?: number }> = ({ children, at, color = "#FFFFFF", inset = 16 }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <span style={{ position: "relative", isolation: "isolate", display: "inline-block" }}>
      {children}
      <span style={{ position: "absolute", left: -10, right: -10, top: inset, bottom: -6, background: color, transformOrigin: "0 50%", transform: `scaleX(${k})`, zIndex: -1 }} />
    </span>
  );
};

const Rise: React.FC<{ at: number; children: React.ReactNode; dy?: number; style?: React.CSSProperties }> = ({ at, children, dy = 30, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 140 } });
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * dy}px)`, ...style }}>{children}</div>;
};

/* ------------------------------------------------------------------ hook */

const TAGS: { text: string; at: number; room: [number, number]; off: [number, number, number] }[] = [
  { text: "SIN PAPEL", at: 48, room: [0, 1], off: [0.3, 1.5, -0.2] },
  { text: "SIN CAFÉ", at: 58, room: [1, 0], off: [-0.4, 1.5, -1.0] },
  { text: "SIN JABÓN", at: 68, room: [2, 0], off: [0.2, 1.4, 0.2] },
];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const out = interpolate(frame, [E.brand - 14, E.brand], [1, 0], clamp);
  if (out <= 0) return null;
  const cam = camAt(frame, L.width / L.height);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", left: L.pad, right: L.pad, top: L.top, fontFamily: RUBIK, fontWeight: 600, fontSize: L.title, lineHeight: 1.02, letterSpacing: "-0.015em", color: C.ink, textAlign: L.v ? "center" : "left" }}>
        <Rise at={8}>¿Qué le <Mark at={34}>falta</Mark></Rise>
        <Rise at={16}>a tu empresa?</Rise>
      </div>
      {TAGS.map((t) => {
        const [rx, rz] = roomXZ(...t.room);
        const [x, y] = project(cam, [rx + t.off[0], t.off[1], rz + t.off[2]], L.width, L.height);
        const s = spring({ frame: frame - t.at, fps, config: { damping: 11, stiffness: 160 } });
        return (
          <div key={t.text} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s}) rotate(${(1 - s) * -10 - 2}deg)`, opacity: Math.min(1, s * 1.5),
            fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 30 : 25, letterSpacing: "0.08em", padding: "10px 16px", background: "#FFFFFF", color: C.ink, border: `3px solid ${C.ink}`, boxShadow: "0 10px 24px rgba(26,58,92,0.25)", whiteSpace: "nowrap" }}>
            {t.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------------- brand */

export const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const inn = interpolate(frame, [E.brand - 4, E.brand + 12], [0, 1], clamp);
  const out = interpolate(frame, [E.tour - 20, E.tour - 2], [1, 0], clamp);
  const veil = inn * out;
  if (veil <= 0.001) return null;
  const logo = spring({ frame: frame - (E.brand + 8), fps, config: { damping: 12, stiffness: 110, mass: 0.9 } });
  const R = L.v ? 340 : 290;
  const cy = L.v ? L.height * 0.56 : 650;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(246,240,232,0.88)", opacity: veil, backdropFilter: "blur(6px)" }} />
      <div style={{ position: "absolute", left: L.pad, right: L.pad, top: L.top, fontFamily: RUBIK, fontWeight: 600, fontSize: L.title, lineHeight: 1.04, letterSpacing: "-0.015em", color: C.ink, opacity: out, textAlign: L.v ? "center" : "left" }}>
        <Rise at={E.brand + 26}>Todo lo que falta,</Rise>
        <Rise at={E.brand + 36}>en <Mark at={E.brand + 50} color={C.amber}>un solo pedido.</Mark></Rise>
      </div>
      <div style={{ position: "absolute", left: L.width / 2 - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 40px 90px rgba(26,58,92,0.18)", opacity: out, transform: `scale(${0.6 + 0.4 * logo})` }} />
      <Img src={staticFile("casamado.png")} style={{ position: "absolute", left: L.width / 2 - R * 0.86, top: cy - R * 0.47, width: R * 1.72, opacity: Math.min(1, logo) * out, transform: `scale(${logo})` }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ tour */

export const TopBand: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const o = interpolate(frame, [E.tour - 6, E.tour + 10, E.end - 10, E.end], [0, 1, 1, 0], clamp);
  const h = L.top + (L.v ? 260 : 170);
  const ob = interpolate(frame, [E.delivery + 50, E.delivery + 66, E.end - 10, E.end], [0, 1, 1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, opacity: o, background: "linear-gradient(rgba(246,240,232,0.94) 55%, rgba(246,240,232,0))" }} />
      {L.v ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: L.bottom + 330, opacity: ob, background: "linear-gradient(rgba(246,240,232,0), rgba(246,240,232,0.94) 40%)" }} /> : null}
    </>
  );
};

const lineFrames = STOPS.reduce<number[]>((acc, s, k) => [...acc, ...s.chips.map((_, c) => chipFrame(k, c))], []);

export const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const vis = interpolate(frame, [E.tour + 4, E.tour + 16, E.overview + 24, E.overview + 38], [0, 1, 1, 0], clamp);
  if (vis <= 0) return null;
  const filled = lineFrames.filter((f) => frame >= f).length;
  const current = STOPS.findIndex((_, k) => frame >= chipFrame(k) - 12 && frame < chipFrame(k) + 56);
  return (
    <div style={{ position: "absolute", left: L.pad, right: L.pad, top: L.top, opacity: vis, fontFamily: RUBIK, color: C.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 28 : 22, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>EMPRESA ABASTECIDA</div>
        <div style={{ flex: 1, display: "flex", gap: 8 }}>
          {lineFrames.map((f, i) => {
            const k = interpolate(frame, [f - 2, f + 8], [0, 1], clamp);
            return (
              <div key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(26,58,92,0.14)", overflow: "hidden" }}>
                <div style={{ width: `${k * 100}%`, height: "100%", background: i === lineFrames.length - 1 ? C.amber : C.ink }} />
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 28 : 22, fontVariantNumeric: "tabular-nums" }}>{filled}/6</div>
      </div>
      {/* the line being stocked, as a big headline */}
      {current >= 0 ? (
        <div key={current} style={{ marginTop: L.v ? 26 : 18, fontWeight: 600, fontSize: L.v ? 76 : 60, letterSpacing: "-0.01em", lineHeight: 1, textAlign: L.v ? "center" : "left" }}>
          <Rise at={chipFrame(current) - 12} dy={20}>
            {STOPS[current].chips.map((c) => c.label.charAt(0) + c.label.slice(1).toLowerCase()).join(" + ")}
          </Rise>
        </div>
      ) : null}
    </div>
  );
};

export const TourChips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const cam = camAt(frame, L.width / L.height);
  const out = interpolate(frame, [E.delivery - 10, E.delivery + 4], [1, 0], clamp);
  if (out <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {STOPS.map((s, k) => {
        const [rx, rz] = roomXZ(s.i, s.j);
        return s.chips.map((c, ci) => {
          const at = chipFrame(k, ci);
          const leave = stopStart(k) + E.stopLen - 4;
          if (frame < at || frame > leave + 8) return null;
          const pop = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 170 } }) * interpolate(frame, [leave, leave + 8], [1, 0], clamp);
          const [x, y] = project(cam, [rx + c.at[0], c.at[1], rz + c.at[2]], L.width, L.height);
          return (
            <div key={c.label} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${pop})`, transformOrigin: "50% 100%",
              display: "flex", alignItems: "center", gap: 12, padding: "13px 24px", borderRadius: 999, background: C.ink, color: "#FFFFFF", whiteSpace: "nowrap", boxShadow: "0 12px 28px rgba(26,58,92,0.3)" }}>
              <span style={{ fontFamily: RUBIK, fontWeight: 600, fontSize: L.v ? 32 : 28, letterSpacing: "0.08em" }}>{c.label}</span>
              <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 32 : 28, color: C.amber }}>· {c.n}</span>
            </div>
          );
        });
      })}
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- counter */

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const start = E.overview + 40;
  const t = interpolate(frame, [start, start + 44], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const vis = interpolate(frame, [start - 6, start + 4, E.delivery - 8, E.delivery + 4], [0, 1, 1, 0], clamp);
  const label = spring({ frame: frame - (start + 40), fps, config: { damping: 16 } });
  if (vis <= 0) return null;
  return (
    <div style={{ position: "absolute", left: L.pad, right: L.pad, top: L.top - 8, opacity: vis, display: "flex", flexDirection: L.v ? "column" : "row", alignItems: L.v ? "center" : "flex-start", gap: L.v ? 10 : 30, color: C.ink }}>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: RUBIK, fontWeight: 600, fontSize: L.v ? 190 : 150, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", transformOrigin: L.v ? "50% 100%" : "0 100%", transform: `scale(${0.7 + 0.3 * t})` }}>
          +{fmt(Math.round(1100 * t))}
        </div>
        <div style={{ height: 14, marginTop: 8, background: C.amber, width: `${t * 100}%` }} />
      </div>
      <div style={{ marginTop: L.v ? 6 : 30, opacity: label, transform: `translateX(${(1 - label) * -20}px)`, textAlign: L.v ? "center" : "left" }}>
        <div style={{ fontFamily: RUBIK, fontWeight: 600, fontSize: L.v ? 54 : 44, lineHeight: 1.05 }}>productos{L.v ? " " : <br />}en 6 líneas</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 26 : 20, letterSpacing: "0.1em", color: C.inkSoft, marginTop: 12 }}>UN SOLO PROVEEDOR</div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- delivery */

export const Delivery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const D = E.delivery;
  const vis = interpolate(frame, [D + 8, D + 18, E.end - 8, E.end + 4], [0, 1, 1, 0], clamp);
  if (vis <= 0) return null;
  const chips = ["Pago con Webpay", "Atención 24/7", "Precios mayoristas"];
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <div style={{ position: "absolute", left: L.pad, right: L.pad, top: L.top, fontFamily: RUBIK, fontWeight: 600, color: C.ink, textAlign: L.v ? "center" : "left" }}>
        <Rise at={D + 14}>
          <div style={{ fontSize: L.v ? 100 : 84, lineHeight: 1, letterSpacing: "-0.015em" }}>
            <Mark at={D + 30} color={C.amber} inset={18}>Despacho gratis</Mark>
          </div>
        </Rise>
        <Rise at={D + 24} dy={20}>
          <div style={{ fontSize: L.v ? 44 : 40, fontWeight: 500, marginTop: 18 }}>sobre $70.000 en la Región Metropolitana</div>
        </Rise>
      </div>
      <div style={{ position: "absolute", left: L.pad, right: L.pad, bottom: L.bottom, display: "flex", flexDirection: L.v ? "column" : "row", gap: 18, alignItems: "stretch" }}>
        {chips.map((c, i) => {
          const s = spring({ frame: frame - (D + 70 + i * 7), fps, config: { damping: 13, stiffness: 150 } });
          return (
            <div key={c} style={{ flex: 1, textAlign: "center", padding: L.v ? "22px 10px" : "20px 10px", borderRadius: 999, background: "#FFFFFF", border: `3px solid ${C.ink}`, fontFamily: RUBIK, fontWeight: 600, fontSize: L.v ? 34 : 27,
              color: C.ink, whiteSpace: "nowrap", opacity: s, transform: `translateY(${(1 - s) * 40}px)`, boxShadow: "0 12px 26px rgba(26,58,92,0.16)" }}>{c}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- end card */

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame() - E.end;
  const { fps } = useVideoConfig();
  const L = useLayout();
  const bg = interpolate(frame, [0, 16], [0, 1], clamp);
  if (bg <= 0) return null;
  const logo = spring({ frame: frame - 8, fps, config: { damping: 13, stiffness: 110 } });
  const pre = spring({ frame: frame - 26, fps, config: { damping: 16 } });
  const url = spring({ frame: frame - 34, fps, config: { damping: 14 } });
  const bar = interpolate(frame, [46, 62], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const phone = interpolate(frame, [58, 70], [0, 1], clamp);
  const foot = interpolate(frame, [66, 80], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: bg, backgroundColor: C.paper, alignItems: "center", justifyContent: "center", fontFamily: RUBIK, color: C.ink, paddingBottom: L.v ? 200 : 40,
      backgroundImage: "linear-gradient(rgba(26,58,92,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(26,58,92,0.07) 1px, transparent 1px)", backgroundSize: "36px 36px", backgroundPosition: "10px 10px" }}>
      <Img src={staticFile("casamado.png")} style={{ width: L.v ? 620 : 500, opacity: Math.min(1, logo), transform: `scale(${0.7 + 0.3 * logo}) translateY(${(1 - logo) * 30}px)` }} />
      <div style={{ marginTop: 46, fontSize: L.v ? 46 : 38, fontWeight: 500, color: C.inkSoft, opacity: pre, transform: `translateY(${(1 - pre) * 16}px)` }}>Pide hoy en</div>
      <div style={{ position: "relative", isolation: "isolate", marginTop: 6, fontSize: L.v ? 138 : 122, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1, opacity: url, transform: `translateY(${(1 - url) * 24}px)` }}>
        casamado.cl
        <span style={{ position: "absolute", left: -8, right: -8, bottom: 4, height: 26, background: C.amber, transformOrigin: "0 50%", transform: `scaleX(${bar})`, zIndex: -1 }} />
      </div>
      <div style={{ marginTop: 34, fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 44 : 38, letterSpacing: "0.06em", opacity: phone }}>+569 3466 0081</div>
      <div style={{ position: "absolute", bottom: L.v ? L.bottom - 60 : 64, left: L.pad + 12, right: L.pad + 12, borderTop: `2px solid ${C.ink}`, paddingTop: 22, display: "flex", flexDirection: L.v ? "column" : "row", alignItems: "center", gap: 10, justifyContent: "space-between",
        fontFamily: MONO, fontWeight: 500, fontSize: L.v ? 26 : 20, letterSpacing: "0.08em", color: C.inkSoft, opacity: foot }}>
        <span>DESPACHO GRATIS SOBRE $70.000 · RM</span><span>WEBPAY · ATENCIÓN 24/7</span>
      </div>
    </AbsoluteFill>
  );
};
