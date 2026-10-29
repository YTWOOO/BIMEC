// Precisa vir antes de tudo: silencia o aviso de push do Expo Go e define a tarefa de fundo.
import '@/util/silenciarAvisos';
import '@/notificacoes/tarefa';

import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { configurarComportamentoEmPrimeiroPlano } from '@/notificacoes/canais';
import { useAbrirPelaNotificacao, useSincronizarPalavraDoDia } from '@/notificacoes/sincronizar';
import { alfa, cores } from '@/ui/tema';

SplashScreen.preventAutoHideAsync().catch(() => {});
configurarComportamentoEmPrimeiroPlano();

/** Mantém a palavra da tela de bloqueio em dia e abre a palavra tocada na notificação. */
function Sincronizacao() {
  useSincronizarPalavraDoDia();
  useAbrirPelaNotificacao();
  return null;
}

const temaNavegacao = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: cores.traco,
    background: cores.fundo,
    card: cores.fundoBase,
    text: cores.texto,
    border: alfa(cores.traco, 0.35),
    notification: cores.ofensiva,
  },
};

export default function LayoutRaiz() {
  const [fontesProntas, erroFontes] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  const pronto = fontesProntas || erroFontes !== null;

  useEffect(() => {
    if (pronto) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [pronto]);

  if (!pronto) {
    return null;
  }

  return (
    <GestureHandlerRootView style={estilos.raiz}>
      <ThemeProvider value={temaNavegacao}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: cores.fundo },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="palavra/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <Sincronizacao />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
});
