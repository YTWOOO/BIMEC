import * as Haptics from 'expo-haptics';
import { Platform, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { Texto, type VarianteTexto } from '@/ui/Texto';
import { alfa, cores } from '@/ui/tema';

import { useDicionario } from './contexto';
import { tokenizar } from './dicionario';

type Props = {
  frase: string;
  variante?: VarianteTexto;
  cor?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Frase em inglês em que cada palavra pode ser tocada para abrir a ficha dela.
 * Não colocar dentro de um Pressable: o toque na palavra e o toque no botão brigariam.
 */
export function FraseTocavel({ frase, variante = 'corpoForte', cor, style }: Props) {
  const { abrir } = useDicionario();
  const trechos = tokenizar(frase);

  return (
    <Texto variante={variante} cor={cor} style={style}>
      {trechos.map((t, i) =>
        t.palavra && t.entrada ? (
          <Text
            key={i}
            suppressHighlighting={false}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
              abrir(t.entrada, t.texto);
            }}
            style={estilos.tocavel}>
            {t.texto}
          </Text>
        ) : (
          <Text key={i}>{t.texto}</Text>
        ),
      )}
    </Texto>
  );
}

const estilos = StyleSheet.create({
  tocavel: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: alfa(cores.tracoClaro, 0.55),
  },
});
