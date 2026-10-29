/**
 * Conteúdo de exemplo da etapa 1, só para mostrar o visual.
 * A palavra vira conteúdo real na etapa 2 e a trilha real entra na etapa 7.
 */

export const palavraExemplo = {
  en: 'apple',
  pt: 'maçã',
  categoria: 'Comida e bebida',
  exemplo: {
    en: 'An apple inside a book.',
    pt: 'Uma maçã dentro de um livro.',
  },
};

export type EstadoUnidade = 'concluida' | 'atual' | 'bloqueada';

export interface UnidadeExemplo {
  numero: number;
  tipo: 'Estrutura' | 'Tema';
  titulo: string;
  licoesFeitas: number;
  licoesTotal: number;
  estado: EstadoUnidade;
}

export const unidadesExemplo: UnidadeExemplo[] = [
  { numero: 1, tipo: 'Estrutura', titulo: 'Artigos: a, an, the', licoesFeitas: 8, licoesTotal: 8, estado: 'concluida' },
  { numero: 2, tipo: 'Tema', titulo: 'Comida e bebida', licoesFeitas: 3, licoesTotal: 8, estado: 'atual' },
  { numero: 3, tipo: 'Estrutura', titulo: 'Preposições de lugar', licoesFeitas: 0, licoesTotal: 8, estado: 'bloqueada' },
  { numero: 4, tipo: 'Tema', titulo: 'Casa e objetos', licoesFeitas: 0, licoesTotal: 8, estado: 'bloqueada' },
];
