import { StyleSheet, Text, type TextProps } from 'react-native';

import { cores, fontes } from './tema';

export type VarianteTexto =
  | 'titulo'
  | 'subtitulo'
  | 'corpo'
  | 'corpoForte'
  | 'suave'
  | 'rotulo'
  | 'numero'
  | 'destaque';

type Props = TextProps & {
  variante?: VarianteTexto;
  cor?: string;
};

export function Texto({ variante = 'corpo', cor, style, ...resto }: Props) {
  return (
    <Text
      {...resto}
      style={[estilos[variante], cor ? { color: cor } : null, style]}
    />
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: fontes.sansForte,
    fontSize: 26,
    lineHeight: 32,
    color: cores.texto,
  },
  subtitulo: {
    fontFamily: fontes.sansForte,
    fontSize: 18,
    lineHeight: 24,
    color: cores.texto,
  },
  corpo: {
    fontFamily: fontes.sans,
    fontSize: 15,
    lineHeight: 22,
    color: cores.texto,
  },
  corpoForte: {
    fontFamily: fontes.sansForte,
    fontSize: 15,
    lineHeight: 22,
    color: cores.texto,
  },
  suave: {
    fontFamily: fontes.sans,
    fontSize: 13,
    lineHeight: 19,
    color: cores.textoSuave,
  },
  rotulo: {
    fontFamily: fontes.monoMedia,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: cores.textoSuave,
  },
  numero: {
    fontFamily: fontes.monoForte,
    fontSize: 28,
    lineHeight: 34,
    color: cores.texto,
  },
  destaque: {
    fontFamily: fontes.monoForte,
    fontSize: 32,
    lineHeight: 40,
    color: cores.texto,
  },
});
