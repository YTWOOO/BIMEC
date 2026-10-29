import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { PALAVRAS } from '@/conteudo/palavras';
import { useProgresso } from '@/store/progresso';
import type { Perfil } from '@/store/tipos';
import { diaLocal } from '@/util/datas';

import { configurarCanais } from './canais';
import { atualizarPalavraDoDia, configDoPerfil, type ResultadoPalavra } from './palavraDoDia';
import { desligarTarefaDeFundo, ligarTarefaDeFundo } from './tarefa';
import { chaveConfig, palavraDaTroca, trocasParaRegistrar } from './trocas';

/** Marca como vistas as palavras que passaram pela tela de bloqueio desde a última vez. */
function registrarVistas(perfil: Perfil, numeroAtual: number) {
  const config = chaveConfig(configDoPerfil(perfil));
  const numeros = trocasParaRegistrar(numeroAtual, config, perfil.ultimaTrocaRegistrada, PALAVRAS.length);
  const ids = [...new Set(numeros.map((n) => palavraDaTroca(n, PALAVRAS).id))];
  useProgresso.getState().registrarPalavrasVistas(ids, diaLocal(), { numero: numeroAtual, config });
}

/** Põe a palavra certa na tela, agenda a próxima e liga a tarefa de fundo. */
export async function sincronizarPalavraDoDia(forcar = false): Promise<ResultadoPalavra | null> {
  if (Platform.OS !== 'android') return null;
  try {
    await configurarCanais();
    const { perfil } = useProgresso.getState();
    const resultado = await atualizarPalavraDoDia({ perfil, origem: 'app', forcar });
    if (resultado.ativo) {
      await ligarTarefaDeFundo();
      registrarVistas(perfil, resultado.troca.numero);
    } else if (resultado.motivo === 'desligada') {
      await desligarTarefaDeFundo();
    }
    return resultado;
  } catch (erro) {
    console.warn('[BIMEC] Não deu para atualizar a palavra do dia.', erro);
    return null;
  }
}

/** Sincroniza ao abrir o app, ao voltar para ele e quando as configurações mudam. */
export function useSincronizarPalavraDoDia() {
  const hidratado = useProgresso((s) => s.hidratado);
  const ligada = useProgresso((s) => s.perfil.palavraNaTelaDeBloqueio);
  const intervalo = useProgresso((s) => s.perfil.intervaloPalavraHoras);
  const inicio = useProgresso((s) => s.perfil.silencio.inicio);
  const fim = useProgresso((s) => s.perfil.silencio.fim);

  useEffect(() => {
    if (!hidratado || Platform.OS !== 'android') return;
    sincronizarPalavraDoDia();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizarPalavraDoDia();
    });
    return () => assinatura.remove();
  }, [hidratado, ligada, intervalo, inicio, fim]);
}

/** Tocar na notificação abre a tela da palavra, com o app aberto ou fechado. */
export function useAbrirPelaNotificacao() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const abrir = (resposta: Notifications.NotificationResponse | null) => {
      const url = resposta?.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) {
        router.push(url as Parameters<typeof router.push>[0]);
      }
    };

    // App aberto pelo toque na notificação, vindo de fechado.
    const ultima = Notifications.getLastNotificationResponse();
    if (ultima) {
      abrir(ultima);
      Notifications.clearLastNotificationResponse();
    }

    const assinatura = Notifications.addNotificationResponseReceivedListener(abrir);
    return () => assinatura.remove();
  }, []);
}
