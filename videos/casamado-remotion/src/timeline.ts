import { Easing, interpolate } from "remotion";
import { PRODUCTS, STATIONS, STATION_LEN, STATION_MOVE, T } from "./constants";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 = blueprint (navy), 1 = lit model (paper)
export const lightMix = (f: number) => interpolate(f, [58, 98], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

export const wallRise = (i: number, f: number) =>
  interpolate(f, [52 + i * 1.6, 82 + i * 1.6], [0.02, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

export const furnitureRise = (i: number, f: number) =>
  interpolate(f, [70 + i * 1.5, 92 + i * 1.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

// Frame at which each product lands; -1 = never dropped in this scene.
export const dropFrame = (key: string) => {
  const i = STATIONS.findIndex((s) => s.items.indexOf(key) >= 0);
  const j = STATIONS[i].items.indexOf(key);
  return T.tourStart + i * STATION_LEN + STATION_MOVE + 2 + j * 5;
};
export const DROP_LEN = 18;

export const dropY = (key: string, f: number) => {
  const t = interpolate(f, [dropFrame(key), dropFrame(key) + DROP_LEN], [0, 1], clamp);
  return 2.8 * (1 - Easing.bounce(t));
};
export const squash = (key: string, f: number) => {
  const land = dropFrame(key) + DROP_LEN * 0.36;
  return 1 - 0.12 * Math.max(0, 1 - Math.abs(f - land) / 3);
};
export const productVisible = (key: string, f: number) => f >= dropFrame(key);

export const chipFrame = (i: number) => T.tourStart + i * STATION_LEN + STATION_MOVE + 14;

export const PRODUCT_KEYS = PRODUCTS.map((p) => p.key);
