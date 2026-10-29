import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useIdSvg } from './idSvg';
import { Texto } from './Texto';
import { cores, espaco, fontes } from './tema';

type Props = {
  texto: string;
};

/** Título sobre uma faixa azul com borda de pincel. */
export function FaixaPincel({ texto }: Props) {
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 });
  const id = useIdSvg('pincel');

  const medir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== tamanho.largura || height !== tamanho.altura) {
      setTamanho({ largura: width, altura: height });
    }
  };

  return (
    <View style={estilos.faixa} onLayout={medir} accessibilityRole="header">
      {tamanho.largura > 0 && (
        <Svg
          style={estilos.fundo}
          width={tamanho.largura}
          height={tamanho.altura}
          viewBox="0 0 300 40"
          preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={cores.tracoEscuro} />
              <Stop offset="0.7" stopColor={cores.traco} />
              <Stop offset="1" stopColor={cores.tracoClaro} stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
          <Path
            d="M7 5 C42 1 92 4 142 2 S242 1 291 4 L297 11 L290 17 L298 24 L292 32 C242 39 162 36 112 38 S32 40 9 36 L3 29 L9 21 L2 13 Z"
            fill={`url(#${id})`}
          />
          <Path d="M18 9 C80 7 160 8 250 6" stroke={cores.tracoClaro} strokeOpacity={0.35} strokeWidth={1} fill="none" />
          <Path d="M30 32 C100 33 170 31 270 33" stroke={cores.fundo} strokeOpacity={0.25} strokeWidth={1.5} fill="none" />
        </Svg>
      )}
      <Texto variante="rotulo" cor={cores.texto} style={estilos.texto}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.x5,
    paddingVertical: espaco.x2 + 2,
  },
  fundo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  texto: {
    fontFamily: fontes.monoForte,
    fontSize: 12,
    letterSpacing: 2,
  },
});
