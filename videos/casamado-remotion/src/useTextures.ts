import { useEffect, useState } from "react";
import * as THREE from "three";
import { cancelRender, continueRender, delayRender } from "remotion";

export const useTextures = (urls: string[]) => {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(urls.map((u) => loader.loadAsync(u)))
      .then((ts) => {
        ts.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
        setTextures(ts);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    // urls are static per composition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return textures;
};
