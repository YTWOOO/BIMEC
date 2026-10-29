import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { configurarCanais } from './canais';

export type EstadoPermissao = 'concedida' | 'perguntar' | 'negada' | 'indisponivel';

export async function lerPermissao(): Promise<EstadoPermissao> {
  if (Platform.OS !== 'android') return 'indisponivel';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'concedida';
  return p.canAskAgain ? 'perguntar' : 'negada';
}

/** No Android 13+, o pedido só aparece se já existir um canal criado. */
export async function pedirPermissao(): Promise<EstadoPermissao> {
  if (Platform.OS !== 'android') return 'indisponivel';
  await configurarCanais();
  const p = await Notifications.requestPermissionsAsync();
  if (p.granted) return 'concedida';
  return p.canAskAgain ? 'perguntar' : 'negada';
}
