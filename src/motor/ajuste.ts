/**
 * Ajuste para manter o acerto perto de 80%: olha as últimas 30 respostas antes de montar a lição.
 *
 * | Acerto recente | Novos por lição | Desafio      | Limite das frases |
 * | acima de 90%   | 3               | 1 em cada 3  | sobe 1 palavra    |
 * | de 70% a 90%   | 2               | 1 em cada 4  | mantém            |
 * | abaixo de 70%  | 0               | 1 em cada 6  | desce 1 palavra   |
 */

export const JANELA_RESPOSTAS = 30;
/** Com menos respostas que isso, o app ainda não sabe o nível e fica na faixa do meio. */
export const MINIMO_RESPOSTAS = 10;
export const LIMITE_FRASE_INICIAL = 5;
export const LIMITE_FRASE_MIN = 3;
export const LIMITE_FRASE_MAX = 14;

export type Faixa = 'alta' | 'media' | 'baixa';

export interface Ajuste {
  /** Acerto nas últimas respostas (0 a 1), ou null se ainda há poucas. */
  taxa: number | null;
  faixa: Faixa;
  novosPorLicao: number;
  /** A cada quantos exercícios entra um desafio (um degrau acima). */
  desafioACada: number;
  /** Limite de palavras por frase para esta lição. */
  limiteFrase: number;
}

const POR_FAIXA: Record<Faixa, { novos: number; desafio: number; passoLimite: number }> = {
  alta: { novos: 3, desafio: 3, passoLimite: 1 },
  media: { novos: 2, desafio: 4, passoLimite: 0 },
  baixa: { novos: 0, desafio: 6, passoLimite: -1 },
};

export function taxaDeAcerto(historico: readonly { acertou: boolean }[]): number | null {
  const recentes = historico.slice(-JANELA_RESPOSTAS);
  if (recentes.length < MINIMO_RESPOSTAS) return null;
  return recentes.filter((r) => r.acertou).length / recentes.length;
}

export function faixaDaTaxa(taxa: number | null): Faixa {
  if (taxa === null) return 'media';
  if (taxa > 0.9) return 'alta';
  if (taxa < 0.7) return 'baixa';
  return 'media';
}

export function calcularAjuste(historico: readonly { acertou: boolean }[], limiteAtual: number): Ajuste {
  const taxa = taxaDeAcerto(historico);
  const faixa = faixaDaTaxa(taxa);
  const regra = POR_FAIXA[faixa];
  const limiteFrase = Math.min(LIMITE_FRASE_MAX, Math.max(LIMITE_FRASE_MIN, limiteAtual + regra.passoLimite));
  return {
    taxa,
    faixa,
    novosPorLicao: regra.novos,
    desafioACada: regra.desafio,
    limiteFrase,
  };
}
