import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from './Texto';
import { alfa, alturaAbas, cores, fontes } from './tema';

/** Barra de abas no estilo prancha: ícones em contorno e rótulos em mono. */
export function BarraAbas({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[estilos.barra, { height: alturaAbas + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focado = state.index === index;
        const rotulo =
          typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
        const cor = focado ? cores.tracoClaro : cores.textoSuave;

        const aoTocar = () => {
          const evento = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focado && !evento.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={aoTocar}
            accessibilityRole="tab"
            accessibilityState={{ selected: focado }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? rotulo}
            style={({ pressed }) => [estilos.aba, pressed && { opacity: 0.7 }]}>
            <View style={[estilos.indicador, focado && estilos.indicadorAtivo]} />
            {options.tabBarIcon?.({ focused: focado, color: cor, size: 22 })}
            <Texto style={[estilos.rotulo, { color: cor }]} numberOfLines={1}>
              {rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: cores.fundoBase,
    borderTopWidth: 1,
    borderTopColor: alfa(cores.traco, 0.35),
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicador: {
    position: 'absolute',
    top: -1,
    width: 28,
    height: 2,
    backgroundColor: 'transparent',
  },
  indicadorAtivo: {
    backgroundColor: cores.tracoClaro,
  },
  rotulo: {
    fontFamily: fontes.monoMedia,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
