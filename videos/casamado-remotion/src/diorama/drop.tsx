import React, { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/** Frame at which the products of the surrounding room start falling in (null = always shown). */
export const DropCtx = createContext<number | null>(null);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const DROP_STEP = 5;
export const DROP_LEN = 16;

export const useDrop = (d = 0) => {
  const start = useContext(DropCtx);
  const frame = useCurrentFrame();
  if (start === null) return { show: true, y: 0, sx: 1, sy: 1 };
  const t = frame - (start + d * DROP_STEP);
  if (t < 0) return { show: false, y: 0, sx: 1, sy: 1 };
  const p = interpolate(t, [0, DROP_LEN], [0, 1], { ...clamp, easing: Easing.bounce });
  const sq = t >= DROP_LEN && t < DROP_LEN + 6 ? Math.sin(((t - DROP_LEN) / 6) * Math.PI) * 0.14 : 0;
  return { show: true, y: (1 - p) * 2.6, sx: 1 + sq * 0.5, sy: 1 - sq };
};

/** Wraps anything (origin at its base) so it falls in with the room's products. */
export const Drop: React.FC<{ d?: number; p?: [number, number, number]; children: React.ReactNode }> = ({ d = 0, p = [0, 0, 0], children }) => {
  const a = useDrop(d);
  if (!a.show) return null;
  return (
    <group position={[p[0], p[1] + a.y, p[2]]} scale={[a.sx, a.sy, a.sx]}>
      {children}
    </group>
  );
};
