import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alfa, cores, espaco, raio } from './tema';

type Props = {
  children: ReactNode;
  /** Borda e cantos mais fortes, para o item atual. */
  destaque?: boolean;
  /** Borda tracejada e apagada, para o que está bloqueado. */
  tracejada?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Card no estilo folha de desenho: borda fina e marcas nos quatro cantos. */
export function Prancha({ children, destaque = false, tracejada = false, style }: Props) {
  const corCanto = destaque ? cores.tracoClaro : alfa(cores.tracoClaro, 0.7);
  return (
    <View
      style={[
        estilos.base,
        destaque && estilos.destaque,
        tracejada && estilos.tracejada,
        style,
      ]}>
      {!tracejada && (
        <>
          <View style={[estilos.canto, estilos.cantoSE, { borderColor: corCanto }]} />
          <View style={[estilos.canto, estilos.cantoSD, { borderColor: corCanto }]} />
          <View style={[estilos.canto, estilos.cantoIE, { borderColor: corCanto }]} />
          <View style={[estilos.canto, estilos.cantoID, { borderColor: corCanto }]} />
        </>
      )}
      {children}
    </View>
  );
}

const TAM = 10;
const ESP = 2;

const estilos = StyleSheet.create({
  base: {
    backgroundColor: alfa(cores.fundoCard, 0.88),
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.35),
    borderRadius: raio,
    padding: espaco.x4,
  },
  destaque: {
    borderColor: cores.traco,
    backgroundColor: alfa(cores.fundoCard, 0.96),
    boxShadow: `0 0 14px ${alfa(cores.traco, 0.35)}`,
  },
  tracejada: {
    borderStyle: 'dashed',
    borderColor: alfa(cores.textoSuave, 0.45),
    backgroundColor: alfa(cores.fundoCard, 0.45),
  },
  canto: {
    position: 'absolute',
    width: TAM,
    height: TAM,
  },
  cantoSE: { top: -ESP, left: -ESP, borderTopWidth: ESP, borderLeftWidth: ESP },
  cantoSD: { top: -ESP, right: -ESP, borderTopWidth: ESP, borderRightWidth: ESP },
  cantoIE: { bottom: -ESP, left: -ESP, borderBottomWidth: ESP, borderLeftWidth: ESP },
  cantoID: { bottom: -ESP, right: -ESP, borderBottomWidth: ESP, borderRightWidth: ESP },
});
