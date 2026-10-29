import { StyleSheet, View } from 'react-native';

import { alfa, cores } from './tema';

type Props = {
  /** De 0 a 1. */
  fracao: number;
  cor?: string;
  /** Quantas marquinhas de régua desenhar no trilho. */
  marcas?: number;
};

/** Barra fina com marcas de régua, como uma escala de desenho. */
export function BarraProgresso({ fracao, cor = cores.tracoClaro, marcas = 8 }: Props) {
  const f = Math.max(0, Math.min(1, fracao));
  return (
    <View
      style={estilos.trilho}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(f * 100) }}>
      <View style={[estilos.preenchido, { width: `${f * 100}%`, backgroundColor: cor }]} />
      <View style={estilos.marcas} pointerEvents="none">
        {Array.from({ length: marcas + 1 }, (_, i) => (
          <View key={i} style={estilos.marca} />
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    height: 6,
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.45),
    borderRadius: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  preenchido: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  marcas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marca: {
    width: 1,
    height: '100%',
    backgroundColor: alfa(cores.fundo, 0.6),
  },
});
