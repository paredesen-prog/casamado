import { Composition } from "remotion";
import { FPS, SIZE, T } from "./constants";
import { Diorama } from "./diorama/Diorama";
import { Main } from "./Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="CasamadoPromo" component={Main} fps={FPS} durationInFrames={T.total} width={SIZE} height={SIZE} />
      <Composition id="DioramaOficina" component={Diorama} fps={FPS} durationInFrames={150} width={SIZE} height={SIZE} />
    </>
  );
};
