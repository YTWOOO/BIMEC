import type { Palavra } from '../tipos';

import casa from './casa.json';
import comida from './comida.json';

/** Todas as palavras, na ordem de ensino (tema por tema). */
export const PALAVRAS: Palavra[] = [...(comida as Palavra[]), ...(casa as Palavra[])];

const porId = new Map(PALAVRAS.map((p) => [p.id, p]));

export function palavraPorId(id: string): Palavra | undefined {
  return porId.get(id);
}
