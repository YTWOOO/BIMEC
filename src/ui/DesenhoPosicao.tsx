/**
 * Os 8 desenhos de posição do "Onde está?", em vista de frente, como num desenho técnico.
 * A bolinha é a coisa; o móvel (tampo, corpo e pés) é o lugar. O que fica escondido
 * aparece tracejado, como as linhas ocultas de uma planta.
 * Os desenhos não dependem das palavras: servem para qualquer coisa e qualquer lugar.
 */
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Posicao } from '@/joguinhos/tipos';

import { alfa, cores } from './tema';

const LARGURA = 120;
const ALTURA = 96;
const CHAO = 80;

const tracoMovel = { stroke: cores.tracoClaro, strokeWidth: 1.5, strokeLinejoin: 'round' } as const;

/** Móvel com tampo, corpo e dois pés. `x` é a esquerda do corpo; `largura` a do corpo. */
function Movel({ x = 30, largura = 48, gaveta = true }: { x?: number; largura?: number; gaveta?: boolean }) {
  const pe = Math.max(4, largura * 0.11);
  return (
    <G>
      <Rect x={x + 3} y={60} width={pe} height={CHAO - 60} fill={cores.fundoCard} {...tracoMovel} />
      <Rect x={x + largura - 3 - pe} y={60} width={pe} height={CHAO - 60} fill={cores.fundoCard} {...tracoMovel} />
      <Rect x={x} y={26} width={largura} height={34} fill={cores.fundoCard} {...tracoMovel} />
      <Rect x={x - 4} y={22} width={largura + 8} height={4} fill={cores.fundoCard} {...tracoMovel} />
      {gaveta && (
        <Line x1={x + 6} y1={43} x2={x + largura - 6} y2={43} stroke={alfa(cores.tracoClaro, 0.35)} strokeWidth={1} />
      )}
    </G>
  );
}

function Bola({ cx, cy, r = 9, oculta = false }: { cx: number; cy: number; r?: number; oculta?: boolean }) {
  if (oculta) {
    return (
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={cores.ofensiva}
        strokeWidth={1.5}
        strokeDasharray="3 2.5"
      />
    );
  }
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={alfa(cores.ofensiva, 0.9)} stroke={cores.ofensiva} strokeWidth={1.5} />
      <Path
        d={`M ${cx - r * 0.55} ${cy - r * 0.15} A ${r * 0.6} ${r * 0.6} 0 0 1 ${cx - r * 0.05} ${cy - r * 0.6}`}
        stroke={alfa(cores.fundo, 0.55)}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

/** Linha do chão com as marquinhas de corte embaixo, como o símbolo de terreno. */
function Chao() {
  const marcas = Array.from({ length: 12 }, (_, i) => 10 + i * 9);
  return (
    <G>
      <Line x1={4} y1={CHAO} x2={LARGURA - 4} y2={CHAO} stroke={alfa(cores.traco, 0.75)} strokeWidth={1} />
      {marcas.map((x) => (
        <Line key={x} x1={x} y1={CHAO + 1} x2={x - 5} y2={CHAO + 6} stroke={alfa(cores.traco, 0.4)} strokeWidth={1} />
      ))}
    </G>
  );
}

function Sombra({ cx, y = CHAO, rx = 10 }: { cx: number; y?: number; rx?: number }) {
  return <Ellipse cx={cx} cy={y} rx={rx} ry={2.2} fill={alfa(cores.fundoBase, 0.8)} />;
}

function Cena({ posicao }: { posicao: Posicao }) {
  switch (posicao) {
    case 'on':
      return (
        <>
          <Movel />
          <Bola cx={54} cy={13} />
        </>
      );
    case 'under':
      return (
        <>
          <Movel />
          <Sombra cx={54} />
          <Bola cx={54} cy={71} />
        </>
      );
    case 'next to':
      return (
        <>
          <Movel x={22} />
          <Sombra cx={96} />
          <Bola cx={96} cy={71} />
        </>
      );
    case 'in front of':
      return (
        <>
          <Movel />
          <Sombra cx={50} y={86} rx={15} />
          <Bola cx={50} cy={70} r={15} />
        </>
      );
    case 'behind':
      return (
        <>
          <Bola cx={80} cy={21} r={10} />
          <Movel />
          <Bola cx={80} cy={21} r={10} oculta />
        </>
      );
    case 'in':
    case 'inside':
      return (
        <>
          <Movel gaveta={false} />
          <Bola cx={54} cy={42} r={10} oculta />
          <Circle cx={54} cy={42} r={10} fill={alfa(cores.ofensiva, 0.18)} />
        </>
      );
    case 'between':
      return (
        <>
          <Movel x={10} largura={30} />
          <Movel x={80} largura={30} />
          <Sombra cx={60} />
          <Bola cx={60} cy={71} />
        </>
      );
  }
}

type Props = {
  posicao: Posicao;
  largura?: number;
};

export function DesenhoPosicao({ posicao, largura = 140 }: Props) {
  return (
    <Svg width={largura} height={(largura * ALTURA) / LARGURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
      <Chao />
      <Cena posicao={posicao} />
    </Svg>
  );
}
