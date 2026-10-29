import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';

import { useIdSvg } from './idSvg';
import { cores, grade } from './tema';

/**
 * Fundo de prancha: degradê azul-marinho com grade fina (16 px)
 * e grade forte (80 px). Fica parado atrás do conteúdo.
 */
export function Grade() {
  const { passoFino: f, passoForte: F } = grade;
  const id = useIdSvg('grade');
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={`${id}-fundo`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={cores.fundoTopo} />
          <Stop offset="0.55" stopColor={cores.fundo} />
          <Stop offset="1" stopColor={cores.fundoBase} />
        </LinearGradient>
        <Pattern id={`${id}-fina`} width={f} height={f} patternUnits="userSpaceOnUse">
          <Path
            d={`M ${f} 0 L 0 0 0 ${f}`}
            fill="none"
            stroke={cores.grade}
            strokeWidth={0.5}
            strokeOpacity={grade.opacidadeFina}
          />
        </Pattern>
        <Pattern id={`${id}-forte`} width={F} height={F} patternUnits="userSpaceOnUse">
          <Path
            d={`M ${F} 0 L 0 0 0 ${F}`}
            fill="none"
            stroke={cores.grade}
            strokeWidth={1}
            strokeOpacity={grade.opacidadeForte}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}-fundo)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-fina)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-forte)`} />
    </Svg>
  );
}
