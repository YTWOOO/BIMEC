import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { Platform } from 'react-native';

import { cores } from '@/ui/tema';

import { CANAL_LEMBRETES, CANAL_PALAVRA, TIPO_PALAVRA } from './conteudo';

type OpcoesCanal = Parameters<typeof Notifications.setNotificationChannelAsync>[1];

/** null = ainda não tentou; true = canais do BIMEC criados; false = o sistema recusou (Expo Go). */
let resultadoCanais: boolean | null = null;

/** Se os canais do BIMEC existem. No Expo Go é false: as notificações caem no canal padrão. */
export function canaisCriados(): boolean | null {
  return resultadoCanais;
}

async function criarCanal(id: string, opcoes: OpcoesCanal): Promise<boolean> {
  try {
    await Notifications.setNotificationChannelAsync(id, opcoes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Canais do Android. Importância e som de um canal não mudam depois de criado,
 * então mudanças nesses campos pedem um id de canal novo.
 *
 * Nunca lança erro: o Expo Go (SDK 57 em diante) recusa criar canais do app. Nesse caso
 * as notificações saem no canal padrão do Expo Go ("Miscellaneous"), que toca som;
 * no APK os canais abaixo funcionam normalmente.
 */
export async function configurarCanais(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  const palavra = await criarCanal(CANAL_PALAVRA, {
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

  const lembretes = await criarCanal(CANAL_LEMBRETES, {
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

  const criados = palavra && lembretes;
  if (resultadoCanais === null && !criados) {
    console.log('[BIMEC] O Android não deixou criar os canais (normal no Expo Go). Usando o canal padrão.');
  }
  resultadoCanais = criados;
  return criados;
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
