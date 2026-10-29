import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Texto } from './Texto';
import { alfa, cores, espaco, fontes, raio } from './tema';

type Props = {
  titulo: string;
  onPress?: () => void;
  variante?: 'principal' | 'contorno' | 'perigo';
  desativado?: boolean;
};

function vibrar() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function Botao({ titulo, onPress, variante = 'principal', desativado = false }: Props) {
  const corTexto =
    variante === 'principal' ? cores.fundo : variante === 'perigo' ? cores.erro : cores.tracoClaro;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desativado }}
      disabled={desativado}
      onPress={() => {
        vibrar();
        onPress?.();
      }}
      style={({ pressed }) => [
        estilos.base,
        variante === 'principal' && estilos.principal,
        variante === 'contorno' && estilos.contorno,
        variante === 'perigo' && estilos.perigo,
        pressed && estilos.pressionado,
        desativado && estilos.desativado,
      ]}>
      <View style={estilos.conteudo}>
        <Texto style={[estilos.texto, { color: corTexto }]}>{titulo}</Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: raio,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: espaco.x5,
  },
  principal: {
    backgroundColor: cores.traco,
    borderColor: cores.tracoClaro,
  },
  contorno: {
    backgroundColor: alfa(cores.traco, 0.08),
    borderColor: alfa(cores.traco, 0.7),
  },
  perigo: {
    backgroundColor: alfa(cores.erro, 0.06),
    borderColor: alfa(cores.erro, 0.6),
  },
  pressionado: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  desativado: {
    opacity: 0.45,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.x2,
  },
  texto: {
    fontFamily: fontes.monoForte,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
});
