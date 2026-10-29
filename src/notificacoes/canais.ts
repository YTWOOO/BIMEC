import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { Platform } from 'react-native';

import { cores } from '@/ui/tema';

import { CANAL_LEMBRETES, CANAL_PALAVRA, TIPO_PALAVRA } from './conteudo';

/**
 * Canais do Android. Importância e som de um canal não mudam depois de criado,
 * então mudanças nesses campos pedem um id de canal novo.
 */
export async function configurarCanais(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CANAL_PALAVRA, {
    name: 'Palavra do dia',
    description: 'A palavra que fica fixa na tela de bloqueio e troca sozinha.',
    importance: AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
    enableLights: false,
    showBadge: false,
    lightColor: cores.traco,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
    name: 'Lembretes',
    description: 'Lembrete diário e aviso de ofensiva em risco.',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 150, 250],
    showBadge: true,
    lightColor: cores.traco,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  });
}

/** Com o app aberto: a palavra entra só na lista, sem banner e sem som. */
export function configurarComportamentoEmPrimeiroPlano(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async (notificacao) => {
      const ehPalavra = notificacao.request.content.data?.tipo === TIPO_PALAVRA;
      return {
        shouldShowBanner: !ehPalavra,
        shouldShowList: true,
        shouldPlaySound: !ehPalavra,
        shouldSetBadge: false,
      };
    },
  });
}
