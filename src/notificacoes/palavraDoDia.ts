import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Palavra } from '@/conteudo/tipos';
import { CHAVE_ARMAZENAMENTO, mesclarComPadrao } from '@/store/padrao';
import type { DadosSalvos, ItemProgresso, Perfil } from '@/store/tipos';
import { cores } from '@/ui/tema';

import { CANAL_PALAVRA, ID_PALAVRA_DO_DIA, textoDaPalavra } from './conteudo';
import { palavraDecidida } from './escolha';
import { calcularTroca, chaveConfig, type ConfigTrocas, type Troca } from './trocas';

/** Onde fica registrada a última atualização (para a área de teste). */
export const CHAVE_ULTIMA_PALAVRA = 'bimec-palavra-ultima';

export interface RegistroPalavra {
  numero: number;
  palavraId: string;
  proxima: string;
  atualizadoEm: string;
  origem: string;
}

export type ResultadoPalavra =
  | { ativo: true; troca: Troca; palavra: Palavra }
  | { ativo: false; motivo: 'desligada' | 'sem-permissao' | 'plataforma' };

export function configDoPerfil(perfil: Perfil): ConfigTrocas {
  return { intervaloHoras: perfil.intervaloPalavraHoras, silencio: perfil.silencio };
}

/** Troca que vale agora (número, início e hora da próxima). */
export function trocaAgora(perfil: Perfil, agora: Date = new Date()): Troca {
  return calcularTroca(agora, configDoPerfil(perfil));
}

/** Lê os dados direto do armazenamento: funciona também na tarefa de fundo, sem tela. */
export async function lerDadosSalvos(): Promise<DadosSalvos> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);
    const json = bruto ? JSON.parse(bruto) : null;
    return mesclarComPadrao(json?.state);
  } catch {
    return mesclarComPadrao(null);
  }
}

export async function lerPerfilSalvo(): Promise<Perfil> {
  return (await lerDadosSalvos()).perfil;
}

/** Palavra de uma troca, decidida pelo motor (1 nova a cada 3, revisões nas outras). */
export async function palavraDaTroca(
  perfil: Perfil,
  numero: number,
  itens?: Record<string, ItemProgresso>,
): Promise<Palavra> {
  return palavraDecidida(numero, chaveConfig(configDoPerfil(perfil)), async () => itens ?? (await lerDadosSalvos()).itens);
}

function conteudo(p: Palavra): Notifications.NotificationContentInput {
  return {
    ...textoDaPalavra(p),
    sticky: true,
    autoDismiss: false,
    color: cores.traco,
    sound: false,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
  };
}

/**
 * Mostra a palavra da troca atual e agenda a próxima troca.
 * As duas usam o mesmo identificador: no Android, a notificação nova substitui a antiga.
 */
export async function atualizarPalavraDoDia(
  opcoes: {
    perfil?: Perfil;
    itens?: Record<string, ItemProgresso>;
    agora?: Date;
    origem?: string;
    forcar?: boolean;
  } = {},
): Promise<ResultadoPalavra> {
  if (Platform.OS !== 'android') return { ativo: false, motivo: 'plataforma' };

  const perfil = opcoes.perfil ?? (await lerPerfilSalvo());
  if (!perfil.palavraNaTelaDeBloqueio) {
    await desligarPalavraDoDia();
    return { ativo: false, motivo: 'desligada' };
  }

  const permissao = await Notifications.getPermissionsAsync();
  if (!permissao.granted) return { ativo: false, motivo: 'sem-permissao' };

  const agora = opcoes.agora ?? new Date();
  const troca = trocaAgora(perfil, agora);
  const palavra = await palavraDaTroca(perfil, troca.numero, opcoes.itens);
  const proximaPalavra = await palavraDaTroca(perfil, troca.numero + 1, opcoes.itens);

  const presentes = await Notifications.getPresentedNotificationsAsync();
  const mostrada = presentes.find((n) => n.request.identifier === ID_PALAVRA_DO_DIA);
  const jaEstaNaTela = mostrada?.request.content.data?.palavraId === palavra.id;

  if (opcoes.forcar || !jaEstaNaTela) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_PALAVRA_DO_DIA,
      content: conteudo(palavra),
      trigger: { channelId: CANAL_PALAVRA },
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: ID_PALAVRA_DO_DIA,
    content: conteudo(proximaPalavra),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: troca.proxima,
      channelId: CANAL_PALAVRA,
    },
  });

  const registro: RegistroPalavra = {
    numero: troca.numero,
    palavraId: palavra.id,
    proxima: troca.proxima.toISOString(),
    atualizadoEm: agora.toISOString(),
    origem: opcoes.origem ?? 'app',
  };
  await AsyncStorage.setItem(CHAVE_ULTIMA_PALAVRA, JSON.stringify(registro));

  return { ativo: true, troca, palavra };
}

/** Tira a palavra da tela e cancela a próxima troca. */
export async function desligarPalavraDoDia(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.cancelScheduledNotificationAsync(ID_PALAVRA_DO_DIA);
  await Notifications.dismissNotificationAsync(ID_PALAVRA_DO_DIA);
  await AsyncStorage.removeItem(CHAVE_ULTIMA_PALAVRA);
}

/**
 * Teste manual: agenda a próxima palavra para daqui a 1 minuto.
 * Serve para ver, com o celular bloqueado, se a notificação troca ou empilha.
 */
export async function agendarTrocaDeTeste(perfil: Perfil): Promise<Palavra> {
  const troca = trocaAgora(perfil);
  const proxima = await palavraDaTroca(perfil, troca.numero + 1);
  await Notifications.scheduleNotificationAsync({
    identifier: ID_PALAVRA_DO_DIA,
    content: conteudo(proxima),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 60 * 1000),
      channelId: CANAL_PALAVRA,
    },
  });
  return proxima;
}

export async function lerRegistroPalavra(): Promise<RegistroPalavra | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_ULTIMA_PALAVRA);
    return bruto ? (JSON.parse(bruto) as RegistroPalavra) : null;
  } catch {
    return null;
  }
}
