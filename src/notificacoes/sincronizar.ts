import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { PALAVRAS } from '@/conteudo/palavras';
import { useProgresso } from '@/store/progresso';
import type { Perfil } from '@/store/tipos';
import { diaLocal } from '@/util/datas';

import { configurarCanais } from './canais';
import { lerDecisoes } from './escolha';
import { atualizarPalavraDoDia, configDoPerfil, type ResultadoPalavra } from './palavraDoDia';
import { desligarTarefaDeFundo, ligarTarefaDeFundo } from './tarefa';
import { chaveConfig, trocasParaRegistrar } from './trocas';

/** Marca como vistas as palavras que passaram pela tela de bloqueio desde a última vez. */
async function registrarVistas(perfil: Perfil, numeroAtual: number) {
  const config = chaveConfig(configDoPerfil(perfil));
  const numeros = trocasParaRegistrar(numeroAtual, config, perfil.ultimaTrocaRegistrada, PALAVRAS.length);
  const decisoes = await lerDecisoes(config);
  const ids = [
    ...new Set(numeros.map((n) => decisoes.porTroca[String(n)]).filter((id): id is string => Boolean(id))),
  ];
  useProgresso.getState().registrarPalavrasVistas(ids, diaLocal(), { numero: numeroAtual, config });
}

/** Põe a palavra certa na tela, agenda a próxima e liga a tarefa de fundo. */
export async function sincronizarPalavraDoDia(forcar = false): Promise<ResultadoPalavra | null> {
  if (Platform.OS !== 'android') return null;
  try {
    await configurarCanais();
    const { perfil, itens } = useProgresso.getState();
    const resultado = await atualizarPalavraDoDia({ perfil, itens, origem: 'app', forcar });
    if (resultado.ativo) {
      await ligarTarefaDeFundo();
      await registrarVistas(perfil, resultado.troca.numero);
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

/**
 * Tocar na notificação abre a tela da palavra, com o app aberto ou fechado.
 * Espera a navegação ficar pronta (com o app fechado, o toque chega antes das telas montarem)
 * e nunca deixa um erro aqui derrubar o app: no pior caso, ele abre no Início.
 */
export function useAbrirPelaNotificacao() {
  const navegacao = useRootNavigationState();
  const pronta = Boolean(navegacao?.key);

  useEffect(() => {
    if (Platform.OS === 'web' || !pronta) return;

    const abrir = (resposta: Notifications.NotificationResponse | null) => {
      try {
        const url = resposta?.notification?.request?.content?.data?.url;
        if (typeof url === 'string' && url.startsWith('/')) {
          router.push(url as Parameters<typeof router.push>[0]);
        }
      } catch (erro) {
        console.warn('[BIMEC] Não deu para abrir a palavra da notificação.', erro);
      }
    };

    // App aberto pelo toque na notificação, vindo de fechado.
    try {
      const ultima = Notifications.getLastNotificationResponse();
      if (ultima) {
        Notifications.clearLastNotificationResponse();
        abrir(ultima);
      }
    } catch (erro) {
      console.warn('[BIMEC] Não deu para ler a notificação tocada.', erro);
    }

    const assinatura = Notifications.addNotificationResponseReceivedListener(abrir);
    return () => assinatura.remove();
  }, [pronta]);
}
