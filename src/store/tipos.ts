/** Tipos dos dados salvos no celular. Ver a seção "Arquitetura técnica" do plano. */

export type TipoItem = 'palavra' | 'molde' | 'contracao';

/** Progresso de um item (palavra, molde de frase ou contração). */
export interface ItemProgresso {
  id: string;
  tipo: TipoItem;
  /** Degrau na escada de dificuldade, de 0 a 5. */
  degrau: number;
  acertosSeguidos: number;
  intervaloDias: number;
  /** Começa em 2,3 e fica entre 1,3 e 2,8. */
  facilidade: number;
  /** Data (AAAA-MM-DD) da próxima revisão, ou null se nunca foi praticado. */
  proximaRevisao: string | null;
  /** Data (AAAA-MM-DD) em que o item foi visto pela primeira vez. */
  vistoEm: string | null;
  acertos: number;
  erros: number;
}

export const INTERVALOS_PALAVRA = [1, 2, 3, 4, 6] as const;
export type IntervaloPalavra = (typeof INTERVALOS_PALAVRA)[number];

export const METAS_DIARIAS = [10, 20, 30, 50] as const;

export interface Perfil {
  xp: number;
  /** XP ganho no dia de diaXpHoje. */
  xpHoje: number;
  diaXpHoje: string | null;
  ofensiva: number;
  ultimoDiaPraticado: string | null;
  metaDiariaXp: number;
  /** "HH:MM" */
  horarioLembrete: string;
  intervaloPalavraHoras: IntervaloPalavra;
  /** Período sem troca da palavra na tela de bloqueio, "HH:MM". */
  silencio: { inicio: string; fim: string };
  /** Categorias ligadas. Lista vazia quer dizer todas. */
  categoriasAtivas: string[];
  nivelamentoFeito: boolean;
}

export interface Resposta {
  itemId: string;
  joguinho: string;
  acertou: boolean;
  ms: number;
  /** Data e hora ISO. */
  data: string;
}

export interface DadosSalvos {
  perfil: Perfil;
  itens: Record<string, ItemProgresso>;
  historico: Resposta[];
}
