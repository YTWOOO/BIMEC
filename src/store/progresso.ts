import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { somarMinutos } from '@/util/datas';

import { VERSAO_ESQUEMA, dadosIniciais, mesclarComPadrao, migrar } from './padrao';
import type { DadosSalvos, IntervaloPalavra } from './tipos';

type Acoes = {
  definirMetaDiaria: (xp: number) => void;
  definirIntervaloPalavra: (horas: IntervaloPalavra) => void;
  moverSilencio: (ponta: 'inicio' | 'fim', minutos: number) => void;
  moverLembrete: (minutos: number) => void;
  /** Apaga todo o progresso e volta às configurações padrão. */
  resetar: () => void;
};

export type EstadoProgresso = DadosSalvos & Acoes & { hidratado: boolean };

export const CHAVE_ARMAZENAMENTO = 'bimec-progresso';

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
