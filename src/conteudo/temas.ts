import type { Tema } from './tipos';

/** Os 10 temas do plano, na ordem de ensino. */
export const TEMAS: Tema[] = [
  { id: 'comida', nome: 'Comida e bebida' },
  { id: 'casa', nome: 'Casa e objetos' },
  { id: 'pessoas', nome: 'Pessoas e família' },
  { id: 'corpo', nome: 'Corpo e roupas' },
  { id: 'lugares', nome: 'Lugares e cidade' },
  { id: 'viagem', nome: 'Viagem e transporte' },
  { id: 'escola', nome: 'Escola e trabalho' },
  { id: 'tecnologia', nome: 'Tecnologia' },
  { id: 'tempo', nome: 'Tempo e natureza' },
  { id: 'acoes', nome: 'Ações do dia a dia' },
];

export function nomeDoTema(id: string): string {
  return TEMAS.find((t) => t.id === id)?.nome ?? id;
}
