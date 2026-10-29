import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Texto } from './Texto';
import { alfa, cores, espaco } from './tema';

type Props = {
  /** Texto no meio da cota, como uma medida de desenho técnico. */
  rotulo?: string;
  cor?: string;
};

/** Divisor horizontal em forma de linha de cota: traços nas pontas e setas. */
export function Cota({ rotulo, cor = alfa(cores.traco, 0.6) }: Props) {
  return (
    <View style={estilos.linha} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[estilos.traco, { backgroundColor: cor }]} />
      <View style={[estilos.setaEsq, { borderRightColor: cor }]} />
      <View style={[estilos.reta, { backgroundColor: cor }]} />
      {rotulo ? (
        <>
          <Texto variante="rotulo" style={estilos.rotulo}>
            {rotulo}
          </Texto>
          <View style={[estilos.reta, { backgroundColor: cor }]} />
        </>
      ) : null}
      <View style={[estilos.setaDir, { borderLeftColor: cor }]} />
      <View style={[estilos.traco, { backgroundColor: cor }]} />
    </View>
  );
}

type PropsVertical = {
  altura?: number;
  cor?: string;
};

/** Ligação vertical tracejada com seta, usada entre as unidades da trilha. */
export function CotaVertical({ altura = 36, cor = alfa(cores.traco, 0.7) }: PropsVertical) {
  return (
    <View style={estilos.vertical} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={16} height={altura}>
        <Line x1={4} y1={0.5} x2={12} y2={0.5} stroke={cor} strokeWidth={1} />
        <Line x1={8} y1={1} x2={8} y2={altura - 6} stroke={cor} strokeWidth={1} strokeDasharray="3 3" />
        <Path d={`M4 ${altura - 7} L8 ${altura - 1} L12 ${altura - 7}`} fill="none" stroke={cor} strokeWidth={1.25} />
      </Svg>
    </View>
  );
}

const SETA = 6;

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: espaco.x2,
  },
  traco: {
    width: 1,
    height: 12,
  },
  reta: {
    flex: 1,
    height: 1,
  },
  setaEsq: {
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderRightWidth: SETA,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  setaDir: {
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: SETA,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  rotulo: {
    paddingHorizontal: espaco.x2,
    fontSize: 10,
  },
  vertical: {
    alignItems: 'center',
  },
});
