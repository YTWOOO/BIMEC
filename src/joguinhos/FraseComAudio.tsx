import { Pressable, StyleSheet, View } from 'react-native';

import { FraseTocavel } from '@/dicionario/FraseTocavel';
import { IconeSom, IconeTartaruga } from '@/ui/Icones';
import type { VarianteTexto } from '@/ui/Texto';
import { alfa, cores, espaco } from '@/ui/tema';
import { falar } from '@/util/audio';

type Props = {
  en: string;
  variante?: VarianteTexto;
  /** Mostra também o botão de velocidade lenta. */
  devagar?: boolean;
};

/** Frase em inglês com palavras tocáveis e os botões de áudio ao lado (fora da frase). */
export function FraseComAudio({ en, variante = 'subtitulo', devagar = false }: Props) {
  return (
    <View style={estilos.linha}>
      <View style={estilos.frase}>
        <FraseTocavel frase={en} variante={variante} />
      </View>
      <BotaoSom aoTocar={() => falar(en)} rotulo={`Ouvir "${en}"`} />
      {devagar && <BotaoSom aoTocar={() => falar(en, true)} rotulo="Ouvir devagar" lento />}
    </View>
  );
}

export function BotaoSom({
  aoTocar,
  rotulo,
  lento = false,
  grande = false,
}: {
  aoTocar: () => void;
  rotulo: string;
  lento?: boolean;
  grande?: boolean;
}) {
  const tamanho = grande ? 72 : 40;
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
      style={({ pressed }) => [
        estilos.botao,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
        grande && estilos.grande,
        pressed && { opacity: 0.6 },
      ]}>
      {lento ? <IconeTartaruga tamanho={grande ? 32 : 20} /> : <IconeSom tamanho={grande ? 34 : 20} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x2,
  },
  frase: {
    flex: 1,
  },
  botao: {
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.55),
    backgroundColor: alfa(cores.traco, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
  },
  grande: {
    borderWidth: 1.5,
    borderColor: cores.tracoClaro,
    backgroundColor: alfa(cores.traco, 0.18),
    boxShadow: `0 0 14px ${alfa(cores.traco, 0.35)}`,
  },
});
