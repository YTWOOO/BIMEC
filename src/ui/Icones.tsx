import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { cores, linha } from './tema';

export type PropsIcone = {
  tamanho?: number;
  cor?: string;
};

/** Todos os ícones são só contorno, traço de 1,5, sem preenchimento. */
function base(tamanho: number) {
  return { width: tamanho, height: tamanho, viewBox: '0 0 24 24' } as const;
}

function traco(cor: string) {
  return {
    stroke: cor,
    strokeWidth: linha.media,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
}

export function IconeInicio({ tamanho = 24, cor = cores.texto }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path d="M3 11 L12 4 L21 11 V20 H14 V14 H10 V20 H3 Z" {...traco(cor)} />
    </Svg>
  );
}

export function IconeRevisao({ tamanho = 24, cor = cores.texto }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path d="M20 12 A8 8 0 1 1 17.66 6.34" {...traco(cor)} />
      <Path d="M20 4 V9 H15" {...traco(cor)} />
      <Path d="M12 8 V12 L15 14" {...traco(cor)} />
    </Svg>
  );
}

export function IconeEstatisticas({ tamanho = 24, cor = cores.texto }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Rect x={4} y={12} width={3.5} height={8} {...traco(cor)} />
      <Rect x={10.25} y={5} width={3.5} height={15} {...traco(cor)} />
      <Rect x={16.5} y={9} width={3.5} height={11} {...traco(cor)} />
      <Line x1={2} y1={20.5} x2={22} y2={20.5} {...traco(cor)} />
    </Svg>
  );
}

export function IconeConfig({ tamanho = 24, cor = cores.texto }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Line x1={3} y1={7} x2={13} y2={7} {...traco(cor)} />
      <Line x1={19} y1={7} x2={21} y2={7} {...traco(cor)} />
      <Circle cx={16} cy={7} r={2.5} {...traco(cor)} />
      <Line x1={3} y1={17} x2={6} y2={17} {...traco(cor)} />
      <Line x1={12} y1={17} x2={21} y2={17} {...traco(cor)} />
      <Circle cx={9} cy={17} r={2.5} {...traco(cor)} />
    </Svg>
  );
}

export function IconeChama({ tamanho = 24, cor = cores.ofensiva }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path
        d="M12 3 C13 7 17.5 9 17.5 14 A5.5 5.5 0 0 1 6.5 14 C6.5 11.5 7.6 9.8 9 8.8 C9 11 10 12.3 11.3 12.3 C11.3 9 10.2 6 12 3 Z"
        {...traco(cor)}
      />
    </Svg>
  );
}

export function IconeRaio({ tamanho = 24, cor = cores.tracoClaro }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" {...traco(cor)} />
    </Svg>
  );
}

export function IconeLivro({ tamanho = 24, cor = cores.tracoClaro }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path d="M3 5 H9 A3 3 0 0 1 12 8 V20 A2 2 0 0 0 10 18 H3 Z" {...traco(cor)} />
      <Path d="M21 5 H15 A3 3 0 0 0 12 8 V20 A2 2 0 0 1 14 18 H21 Z" {...traco(cor)} />
    </Svg>
  );
}

export function IconeCadeado({ tamanho = 24, cor = cores.textoSuave }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Rect x={5} y={11} width={14} height={10} rx={1.5} {...traco(cor)} />
      <Path d="M8 11 V8 A4 4 0 0 1 16 8 V11" {...traco(cor)} />
    </Svg>
  );
}

export function IconeCheck({ tamanho = 24, cor = cores.acerto }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path d="M5 12.5 L10 17 L19 7" {...traco(cor)} />
    </Svg>
  );
}

export function IconeSom({ tamanho = 24, cor = cores.tracoClaro }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" {...traco(cor)} />
      <Path d="M16 9 A4 4 0 0 1 16 15" {...traco(cor)} />
      <Path d="M18.5 6.5 A7.5 7.5 0 0 1 18.5 17.5" {...traco(cor)} />
    </Svg>
  );
}

export function IconeAlvo({ tamanho = 24, cor = cores.tracoClaro }: PropsIcone) {
  return (
    <Svg {...base(tamanho)}>
      <Circle cx={12} cy={12} r={8.5} {...traco(cor)} />
      <Circle cx={12} cy={12} r={4.5} {...traco(cor)} />
      <Line x1={12} y1={1.5} x2={12} y2={5} {...traco(cor)} />
      <Line x1={12} y1={19} x2={12} y2={22.5} {...traco(cor)} />
      <Line x1={1.5} y1={12} x2={5} y2={12} {...traco(cor)} />
      <Line x1={19} y1={12} x2={22.5} y2={12} {...traco(cor)} />
    </Svg>
  );
}
