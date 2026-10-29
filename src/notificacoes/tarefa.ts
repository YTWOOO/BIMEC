/**
 * Tarefa de fundo que troca a palavra com o app fechado.
 * O Android roda a tarefa mais ou menos a cada 15 minutos (sem hora exata).
 * Este arquivo precisa ser importado no topo do app, porque a tarefa é definida ao carregar.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { atualizarPalavraDoDia } from './palavraDoDia';

export const TAREFA_PALAVRA = 'bimec-trocar-palavra';
export const CHAVE_ULTIMA_TAREFA = 'bimec-tarefa-ultima';

const disponivel = Platform.OS === 'android';

if (disponivel) {
  TaskManager.defineTask(TAREFA_PALAVRA, async () => {
    try {
      await AsyncStorage.setItem(CHAVE_ULTIMA_TAREFA, new Date().toISOString());
      await atualizarPalavraDoDia({ origem: 'tarefa de fundo' });
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function ligarTarefaDeFundo(): Promise<void> {
  if (!disponivel) return;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
  const registrada = await TaskManager.isTaskRegisteredAsync(TAREFA_PALAVRA);
  if (!registrada) {
    await BackgroundTask.registerTaskAsync(TAREFA_PALAVRA, { minimumInterval: 15 });
  }
}

export async function desligarTarefaDeFundo(): Promise<void> {
  if (!disponivel) return;
  const registrada = await TaskManager.isTaskRegisteredAsync(TAREFA_PALAVRA);
  if (registrada) await BackgroundTask.unregisterTaskAsync(TAREFA_PALAVRA);
}

export async function lerEstadoTarefa(): Promise<{
  disponivel: boolean;
  registrada: boolean;
  ultimaExecucao: string | null;
}> {
  if (!disponivel) return { disponivel: false, registrada: false, ultimaExecucao: null };
  const status = await BackgroundTask.getStatusAsync();
  const registrada = await TaskManager.isTaskRegisteredAsync(TAREFA_PALAVRA);
  const ultimaExecucao = await AsyncStorage.getItem(CHAVE_ULTIMA_TAREFA);
  return {
    disponivel: status === BackgroundTask.BackgroundTaskStatus.Available,
    registrada,
    ultimaExecucao,
  };
}

/** Só funciona em modo de desenvolvimento: roda a tarefa agora, sem esperar o sistema. */
export async function rodarTarefaAgora(): Promise<boolean> {
  if (!disponivel) return false;
  return BackgroundTask.triggerTaskWorkerForTestingAsync();
}
