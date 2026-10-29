import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconeVoltar } from './Icones';
import { Texto } from './Texto';
import { cores } from './tema';

function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Barra do topo das telas fora das abas: botão Voltar à esquerda e algo opcional à direita. */
export function BarraTopo({ direita }: { direita?: ReactNode }) {
  return (
    <View style={estilos.barra}>
      <Pressable
        onPress={voltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={10}
        style={({ pressed }) => [estilos.voltar, pressed && { opacity: 0.6 }]}>
        <IconeVoltar tamanho={22} />
        <Texto variante="rotulo" cor={cores.tracoClaro}>
          Voltar
        </Texto>
      </Pressable>
      {direita}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
  },
});
