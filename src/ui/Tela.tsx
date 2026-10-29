import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Grade } from './Grade';
import { cores, espaco } from './tema';

type Props = {
  children: ReactNode;
  /** Tela dentro das abas: a barra de abas já cuida da área segura de baixo. */
  comAbas?: boolean;
};

/** Moldura padrão de toda tela: fundo de prancha, área segura e rolagem. */
export function Tela({ children, comAbas = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={estilos.raiz}>
      <Grade />
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          {
            paddingTop: insets.top + espaco.x4,
            paddingBottom: (comAbas ? 0 : insets.bottom) + espaco.x6,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    paddingHorizontal: espaco.x4,
    gap: espaco.x4,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
