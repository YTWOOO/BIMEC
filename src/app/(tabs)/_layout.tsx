import { Tabs } from 'expo-router/js-tabs';

import { BarraAbas } from '@/ui/BarraAbas';
import { IconeConfig, IconeEstatisticas, IconeInicio, IconeRevisao } from '@/ui/Icones';
import { cores } from '@/ui/tema';

export default function LayoutAbas() {
  return (
    <Tabs
      tabBar={(props) => <BarraAbas {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: cores.fundo },
        animation: 'fade',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <IconeInicio cor={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="revisao"
        options={{
          title: 'Revisão',
          tabBarIcon: ({ color }) => <IconeRevisao cor={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="estatisticas"
        options={{
          title: 'Números',
          tabBarAccessibilityLabel: 'Estatísticas',
          tabBarIcon: ({ color }) => <IconeEstatisticas cor={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'Ajustes',
          tabBarAccessibilityLabel: 'Configurações',
          tabBarIcon: ({ color }) => <IconeConfig cor={String(color)} />,
        }}
      />
    </Tabs>
  );
}
