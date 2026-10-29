import type { ItemProgresso } from './tipos';

/** Nível mostrado no Início: soma dos degraus ÷ 20, arredondado para baixo, + 1. */
export function nivelAtual(itens: Record<string, ItemProgresso>): number {
  const soma = Object.values(itens).reduce((total, item) => total + item.degrau, 0);
  return Math.floor(soma / 20) + 1;
}

/** Itens com revisão marcada para hoje ou antes. */
export function contarVencidos(itens: Record<string, ItemProgresso>, hoje: string): number {
  return Object.values(itens).filter(
    (item) => item.proximaRevisao !== null && item.proximaRevisao <= hoje,
  ).length;
}

export function resumoPalavras(itens: Record<string, ItemProgresso>) {
  const palavras = Object.values(itens).filter((item) => item.tipo === 'palavra');
  return {
    vistas: palavras.filter((p) => p.vistoEm !== null).length,
    dominadas: palavras.filter((p) => p.degrau >= 5).length,
    emProgresso: palavras.filter((p) => p.degrau >= 1 && p.degrau <= 4).length,
  };
}

/** XP de hoje: zera sozinho quando o dia muda. */
export function xpDeHoje(perfil: { xpHoje: number; diaXpHoje: string | null }, hoje: string): number {
  return perfil.diaXpHoje === hoje ? perfil.xpHoje : 0;
}
