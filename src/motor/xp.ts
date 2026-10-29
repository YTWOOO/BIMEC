/**
 * XP de uma lição:
 * - 1 XP por exercício acertado na primeira tentativa (desafio acertado vale 2);
 * - 5 XP por terminar a lição;
 * - mais 5 XP se não errou nenhum exercício.
 * Cards de apresentação não contam como exercício.
 */

export const XP_POR_ACERTO = 1;
export const XP_DESAFIO = 2;
export const XP_TERMINAR = 5;
export const XP_PERFEITA = 5;

export interface RespostaDaLicao {
  /** Acerto na primeira tentativa. */
  acertou: boolean;
  desafio: boolean;
}

export interface XpDaLicao {
  acertos: number;
  terminar: number;
  perfeita: number;
  total: number;
}

export function xpDaLicao(respostas: readonly RespostaDaLicao[]): XpDaLicao {
  const acertos = respostas.reduce((soma, r) => soma + (r.acertou ? (r.desafio ? XP_DESAFIO : XP_POR_ACERTO) : 0), 0);
  const perfeita = respostas.length > 0 && respostas.every((r) => r.acertou) ? XP_PERFEITA : 0;
  return { acertos, terminar: XP_TERMINAR, perfeita, total: acertos + XP_TERMINAR + perfeita };
}

/** Soma XP ao perfil; o XP de hoje zera quando o dia muda. */
export function somarXp<T extends { xp: number; xpHoje: number; diaXpHoje: string | null }>(
  perfil: T,
  xp: number,
  dia: string,
): T {
  const hoje = perfil.diaXpHoje === dia ? perfil.xpHoje : 0;
  return { ...perfil, xp: perfil.xp + xp, xpHoje: hoje + xp, diaXpHoje: dia };
}
