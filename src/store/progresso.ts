import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { apresentar, facilDemais, novoItem, registrarResposta, type DadosResposta } from '@/motor/srs';
import { somarXp } from '@/motor/xp';
import { somarMinutos } from '@/util/datas';

import {
  CHAVE_ARMAZENAMENTO,
  VERSAO_ESQUEMA,
  dadosIniciais,
  mesclarComPadrao,
  migrar,
  novoItemPalavra,
} from './padrao';
import type { DadosSalvos, IntervaloPalavra, Perfil, TipoItem } from './tipos';

/** Quantas respostas o histórico guarda. */
export const LIMITE_HISTORICO = 200;

type Acoes = {
  definirMetaDiaria: (xp: number) => void;
  definirIntervaloPalavra: (horas: IntervaloPalavra) => void;
  moverSilencio: (ponta: 'inicio' | 'fim', minutos: number) => void;
  moverLembrete: (minutos: number) => void;
  definirPalavraNaTela: (ligada: boolean) => void;
  /**
   * Marca palavras como vistas (cria o item se ainda não existe).
   * `marca` atualiza a última troca registrada, quando vem da tela de bloqueio.
   */
  registrarPalavrasVistas: (
    ids: string[],
    dia: string,
    marca?: NonNullable<Perfil['ultimaTrocaRegistrada']>,
  ) => void;
  /** Card de apresentação visto: o item entra no degrau 1. */
  apresentarItem: (itemId: string, tipo: TipoItem, hoje: string) => void;
  /** Resposta de um exercício: atualiza o item pelo motor e guarda no histórico. */
  responder: (itemId: string, tipo: TipoItem, resposta: DadosResposta & { joguinho: string }) => void;
  /** Botão "fácil demais". */
  marcarFacilDemais: (itemId: string, tipo: TipoItem, hoje: string) => void;
  /** Guarda o limite de palavras por frase que o ajuste calculou. */
  definirLimiteFrase: (limite: number) => void;
  /** XP de uma lição terminada. */
  ganharXp: (xp: number, dia: string) => void;
  /** Apaga todo o progresso e volta às configurações padrão. */
  resetar: () => void;
};

export type EstadoProgresso = DadosSalvos & Acoes & { hidratado: boolean };

export { CHAVE_ARMAZENAMENTO };

export const useProgresso = create<EstadoProgresso>()(
  persist(
    (set) => ({
      ...dadosIniciais(),
      hidratado: false,

      definirMetaDiaria: (xp) => set((s) => ({ perfil: { ...s.perfil, metaDiariaXp: xp } })),

      definirIntervaloPalavra: (horas) =>
        set((s) => ({ perfil: { ...s.perfil, intervaloPalavraHoras: horas } })),

      moverSilencio: (ponta, minutos) =>
        set((s) => ({
          perfil: {
            ...s.perfil,
            silencio: { ...s.perfil.silencio, [ponta]: somarMinutos(s.perfil.silencio[ponta], minutos) },
          },
        })),

      moverLembrete: (minutos) =>
        set((s) => ({
          perfil: { ...s.perfil, horarioLembrete: somarMinutos(s.perfil.horarioLembrete, minutos) },
        })),

      definirPalavraNaTela: (ligada) =>
        set((s) => ({ perfil: { ...s.perfil, palavraNaTelaDeBloqueio: ligada } })),

      registrarPalavrasVistas: (ids, dia, marca) =>
        set((s) => {
          const itens = { ...s.itens };
          for (const id of ids) {
            const atual = itens[id];
            if (!atual) {
              itens[id] = novoItemPalavra(id, dia);
            } else if (atual.vistoEm === null) {
              itens[id] = { ...atual, vistoEm: dia };
            }
          }
          return {
            itens,
            perfil: marca ? { ...s.perfil, ultimaTrocaRegistrada: marca } : s.perfil,
          };
        }),

      apresentarItem: (itemId, tipo, hoje) =>
        set((s) => ({
          itens: { ...s.itens, [itemId]: apresentar(s.itens[itemId] ?? novoItem(itemId, tipo), hoje) },
        })),

      responder: (itemId, tipo, { joguinho, ...resposta }) =>
        set((s) => ({
          itens: {
            ...s.itens,
            [itemId]: registrarResposta(s.itens[itemId] ?? novoItem(itemId, tipo), resposta),
          },
          historico: [
            ...s.historico,
            { itemId, joguinho, acertou: resposta.acertou, ms: Math.round(resposta.ms), data: new Date().toISOString() },
          ].slice(-LIMITE_HISTORICO),
        })),

      marcarFacilDemais: (itemId, tipo, hoje) =>
        set((s) => ({
          itens: { ...s.itens, [itemId]: facilDemais(s.itens[itemId] ?? novoItem(itemId, tipo), hoje) },
        })),

      definirLimiteFrase: (limite) => set((s) => ({ perfil: { ...s.perfil, limiteFrase: limite } })),

      ganharXp: (xp, dia) => set((s) => ({ perfil: somarXp(s.perfil, xp, dia) })),

      resetar: () => set({ ...dadosIniciais() }),
    }),
    {
      name: CHAVE_ARMAZENAMENTO,
      version: VERSAO_ESQUEMA,
      storage: createJSONStorage(() => AsyncStorage),
      // Só os dados vão para o armazenamento; ações e "hidratado" ficam de fora.
      partialize: (s): DadosSalvos => ({ perfil: s.perfil, itens: s.itens, historico: s.historico }),
      migrate: (salvo, versao) => migrar(salvo, versao) as unknown as EstadoProgresso,
      merge: (salvo, atual) => ({ ...atual, ...mesclarComPadrao(salvo) }),
      onRehydrateStorage: () => () => {
        useProgresso.setState({ hidratado: true });
      },
    },
  ),
);
