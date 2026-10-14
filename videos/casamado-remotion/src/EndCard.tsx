import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./constants";
import { MONO, RUBIK } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 6, fps, config: { damping: 13, stiffness: 110 } });
  const pre = spring({ frame: frame - 26, fps, config: { damping: 16 } });
  const url = spring({ frame: frame - 34, fps, config: { damping: 14 } });
  const bar = interpolate(frame, [46, 62], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const phone = interpolate(frame, [58, 70], [0, 1], clamp);
  const foot = interpolate(frame, [72, 86], [0, 1], clamp);
  return (
    <AbsoluteFill style={{
      backgroundColor: C.paper,
      backgroundImage: "linear-gradient(rgba(26,58,92,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(26,58,92,0.07) 1px, transparent 1px)",
      backgroundSize: "36px 36px", backgroundPosition: "10px 10px", alignItems: "center", fontFamily: RUBIK, color: C.ink,
    }}>
      <Img src={staticFile("casamado.png")} style={{ marginTop: 150, width: 500, opacity: Math.min(1, logo), transform: `scale(${0.7 + 0.3 * logo}) translateY(${(1 - logo) * 30}px)` }} />
      <div style={{ marginTop: 46, fontSize: 38, fontWeight: 500, color: C.inkSoft, opacity: pre, transform: `translateY(${(1 - pre) * 16}px)` }}>Pide hoy en</div>
      <div style={{ position: "relative", isolation: "isolate", marginTop: 6, fontSize: 122, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1, opacity: url, transform: `translateY(${(1 - url) * 24}px)` }}>
        casamado.cl
        <span style={{ position: "absolute", left: -8, right: -8, bottom: 4, height: 26, background: C.amber, transformOrigin: "0 50%", transform: `scaleX(${bar})`, zIndex: -1 }} />
      </div>
      <div style={{ marginTop: 34, fontFamily: MONO, fontWeight: 500, fontSize: 38, letterSpacing: "0.06em", opacity: phone }}>+569 3466 0081</div>
      <div style={{ position: "absolute", bottom: 64, left: 84, right: 84, borderTop: `2px solid ${C.ink}`, paddingTop: 22, display: "flex", justifyContent: "space-between",
        fontFamily: MONO, fontWeight: 500, fontSize: 20, letterSpacing: "0.08em", color: C.inkSoft, opacity: foot }}>
        <span>DESPACHO GRATIS SOBRE $70.000 · RM</span><span>WEBPAY · ATENCIÓN 24/7</span>
      </div>
    </AbsoluteFill>
  );
};
