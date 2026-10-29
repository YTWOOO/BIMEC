import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Texto } from './Texto';
import { alfa, cores, espaco, raio } from './tema';

type Props = {
  rotulo: string;
  icone?: ReactNode;
  onPress: () => void;
};

/** Botão baixo com contorno, para ações secundárias (ouvir, devagar, gerar de novo). */
export function BotaoPequeno({ rotulo, icone, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.botao, pressed && { opacity: 0.65 }]}>
      {icone}
      <Texto variante="rotulo" cor={cores.tracoClaro}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x2,
    minHeight: 40,
    paddingHorizontal: espaco.x3,
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.55),
    borderRadius: raio,
    backgroundColor: alfa(cores.traco, 0.06),
  },
});
