import { StyleSheet, View } from 'react-native';

import { Texto } from './Texto';
import { alfa, cores, espaco } from './tema';

type Props = {
  /** Partes do carimbo, separadas por "·". Ex.: ["Unidade 03", "Preposições", "Nível 2"]. */
  partes: string[];
  cor?: string;
};

/** Carimbo de prancha: rótulo em mono, maiúsculo, dentro de uma moldura fina. */
export function Carimbo({ partes, cor = cores.textoSuave }: Props) {
  return (
    <View style={[estilos.caixa, { borderColor: alfa(cor, 0.5) }]}>
      <Texto variante="rotulo" cor={cor} style={estilos.texto} numberOfLines={1}>
        {partes.join('  ·  ')}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
    borderWidth: 1,
    paddingHorizontal: espaco.x2,
    paddingVertical: 2,
    borderRadius: 2,
  },
  texto: {
    fontSize: 10,
    lineHeight: 14,
  },
});
