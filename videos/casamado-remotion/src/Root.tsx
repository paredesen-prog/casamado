import { Composition } from "remotion";
import { FPS, SIZE, T } from "./constants";
import { Main } from "./Main";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="CasamadoPromo" component={Main} fps={FPS} durationInFrames={T.total} width={SIZE} height={SIZE} />
  );
};
