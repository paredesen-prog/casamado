import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export const RUBIK = "Rubik";
export const MONO = "DM Mono";

const loaded = Promise.all([
  loadFont({ family: RUBIK, url: staticFile("fonts/rubik-latin.woff2"), weight: "400 700" }),
  loadFont({ family: MONO, url: staticFile("fonts/dmmono-400-latin.woff2"), weight: "400" }),
  loadFont({ family: MONO, url: staticFile("fonts/dmmono-500-latin.woff2"), weight: "500" }),
]).then(() => Promise.all([
  document.fonts.load(`600 40px ${RUBIK}`),
  document.fonts.load(`500 40px ${MONO}`),
]));

export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    loaded.then(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};
