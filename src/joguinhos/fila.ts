/**
 * Fila de uma lição: um exercício por vez e, quando o Ícaro erra, o exercício
 * volta no fim da mesma lição (no máximo MAX_VOLTAS vezes, para a lição sempre acabar).
 */

export const MAX_VOLTAS = 2;

export interface Rodada {
  /** Posição do exercício na lista original. */
  indice: number;
  /** 0 na primeira vez; 1, 2… quando volta depois de um erro. */
  volta: number;
}

export interface EstadoFila {
  rodadas: Rodada[];
  posicao: number;
  /** Resultado da primeira tentativa de cada exercício (null = ainda não respondido). */
  primeira: (boolean | null)[];
  /** Exercício resolvido: acertado em alguma volta, card visto ou voltas esgotadas. */
  resolvido: boolean[];
}

export function criarFila(quantidade: number): EstadoFila {
  return {
    rodadas: Array.from({ length: quantidade }, (_, indice) => ({ indice, volta: 0 })),
    posicao: 0,
    primeira: Array.from({ length: quantidade }, () => null),
    resolvido: Array.from({ length: quantidade }, () => false),
  };
}

export function rodadaAtual(estado: EstadoFila): Rodada | null {
  return estado.rodadas[estado.posicao] ?? null;
}

/** É a primeira vez que este exercício é respondido nesta lição. */
export function ehPrimeiraTentativa(estado: EstadoFila): boolean {
  const atual = rodadaAtual(estado);
  return atual !== null && estado.primeira[atual.indice] === null;
}

/** Guarda a resposta da rodada atual. Errou: o exercício entra de novo no fim da fila. */
export function registrar(estado: EstadoFila, acertou: boolean): EstadoFila {
  const atual = rodadaAtual(estado);
  if (!atual) return estado;
  const primeira = [...estado.primeira];
  if (primeira[atual.indice] === null) primeira[atual.indice] = acertou;
  const resolvido = [...estado.resolvido];
  let rodadas = estado.rodadas;
  if (acertou || atual.volta >= MAX_VOLTAS) {
    resolvido[atual.indice] = true;
  } else {
    rodadas = [...rodadas, { indice: atual.indice, volta: atual.volta + 1 }];
  }
  return { ...estado, rodadas, primeira, resolvido };
}

export function avancar(estado: EstadoFila): EstadoFila {
  return { ...estado, posicao: estado.posicao + 1 };
}

export function terminou(estado: EstadoFila): boolean {
  return estado.posicao >= estado.rodadas.length;
}

/** Fração da barra de progresso: exercícios resolvidos sobre o total. */
export function progresso(estado: EstadoFila): number {
  if (estado.resolvido.length === 0) return 1;
  return estado.resolvido.filter(Boolean).length / estado.resolvido.length;
}
