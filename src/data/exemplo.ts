/**
 * Trilha de exemplo, só para mostrar o visual.
 * A trilha real entra na etapa 7.
 */

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
