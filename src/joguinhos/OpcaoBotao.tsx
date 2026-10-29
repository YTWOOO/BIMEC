import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco, fontes, raio } from '@/ui/tema';

export type EstadoOpcao = 'normal' | 'escolhida' | 'certa' | 'errada' | 'apagada';

type Props = {
  estado: EstadoOpcao;
  onPress: () => void;
  desativado?: boolean;
  rotulo: string;
  /** Texto da opção; ou um desenho, no lugar do texto. */
  texto?: string;
  lingua?: 'en' | 'pt';
  children?: ReactNode;
  compacto?: boolean;
  testID?: string;
};

const BORDA: Record<EstadoOpcao, string> = {
  normal: alfa(cores.traco, 0.45),
  escolhida: cores.tracoClaro,
  certa: cores.acerto,
  errada: cores.erro,
  apagada: alfa(cores.traco, 0.2),
};

const FUNDO: Record<EstadoOpcao, string> = {
  normal: alfa(cores.fundoCard, 0.9),
  escolhida: alfa(cores.traco, 0.22),
  certa: alfa(cores.acerto, 0.14),
  errada: alfa(cores.erro, 0.12),
  apagada: alfa(cores.fundoCard, 0.5),
};

/** Opção de resposta: muda de cor quando é escolhida e depois da correção. */
export function OpcaoBotao({ estado, onPress, desativado, rotulo, texto, lingua = 'pt', children, compacto, testID }: Props) {
  const corTexto = estado === 'apagada' ? cores.textoSuave : estado === 'certa' ? cores.acerto : estado === 'errada' ? cores.erro : cores.texto;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: estado === 'escolhida', disabled: desativado }}
      style={({ pressed }) => [
        estilos.base,
        compacto && estilos.compacto,
        { borderColor: BORDA[estado], backgroundColor: FUNDO[estado] },
        estado === 'escolhida' && estilos.escolhida,
        pressed && !desativado && estilos.pressionado,
      ]}>
      {children ??
        (texto !== undefined && (
          <Texto variante="corpo" cor={corTexto} style={[estilos.texto, lingua === 'en' && estilos.textoEn]}>
            {texto}
          </Texto>
        ))}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: raio,
    paddingHorizontal: espaco.x4,
    paddingVertical: espaco.x3,
    justifyContent: 'center',
  },
  compacto: {
    minHeight: 44,
    paddingHorizontal: espaco.x3,
    paddingVertical: espaco.x2,
    alignItems: 'center',
  },
  escolhida: {
    boxShadow: `0 0 10px ${alfa(cores.traco, 0.4)}`,
  },
  pressionado: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  texto: {
    fontSize: 16,
    lineHeight: 22,
  },
  textoEn: {
    fontFamily: fontes.monoMedia,
  },
});
