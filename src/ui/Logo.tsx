import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { NOME_APP } from '@/config';

import { Texto } from './Texto';
import { cores, espaco, fontes } from './tema';

/** Duas peças que se encaixam, desenhadas só no traço. */
export function MarcaBimec({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 28 28">
      <Path
        d="M2 3 H13 V9 H17 V15 H13 V25 H2 Z"
        fill="none"
        stroke={cores.traco}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M15 3 H26 V25 H15 V17 H19 V7 H15 Z"
        fill="none"
        stroke={cores.tracoClaro}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Logo() {
  return (
    <View style={estilos.linha} accessibilityRole="header" accessibilityLabel={NOME_APP}>
      <MarcaBimec />
      <Texto style={estilos.nome}>{NOME_APP.toUpperCase()}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x2 + 2,
  },
  nome: {
    fontFamily: fontes.monoForte,
    fontSize: 16,
    letterSpacing: 3,
    color: cores.texto,
  },
});
