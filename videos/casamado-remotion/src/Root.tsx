import { Composition } from "remotion";
import { FPS, SIZE, T } from "./constants";
import { Diorama } from "./diorama/Diorama";
import { Edificio } from "./diorama/Edificio";
import { E } from "./diorama/edificioTimeline";
import { Main } from "./Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="CasamadoPromo" component={Main} fps={FPS} durationInFrames={T.total} width={SIZE} height={SIZE} />
      <Composition id="CasamadoEdificio" component={Edificio} defaultProps={{ film: true }} fps={FPS} durationInFrames={E.total} width={SIZE} height={SIZE} />
      <Composition id="CasamadoEdificioVertical" component={Edificio} defaultProps={{ film: true }} fps={FPS} durationInFrames={E.total} width={1080} height={1920} />
      <Composition id="DioramaEdificio" component={Edificio} fps={FPS} durationInFrames={150} width={SIZE} height={SIZE} />
      <Composition id="DioramaOficina" component={Diorama} fps={FPS} durationInFrames={150} width={SIZE} height={SIZE} />
    </>
  );
};
