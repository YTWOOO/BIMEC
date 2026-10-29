/**
 * Itens que o motor ensina: palavras, moldes de frase e contrações.
 * Palavras usam o próprio id ("apple"); moldes e contrações levam prefixo
 * ("molde:coisa-prep-um", "contracao:naquele") para não haver choque de ids.
 */
import { CONTRACOES, MOLDES, PALAVRAS } from '@/conteudo';
import type { Unidade } from '@/conteudo/tipos';
import type { TipoItem } from '@/store/tipos';

export interface ItemDaLicao {
  id: string;
  tipo: TipoItem;
}

export function idDoItem(tipo: TipoItem, id: string): string {
  return tipo === 'palavra' ? id : `${tipo}:${id}`;
}

export function separarId(itemId: string): { tipo: TipoItem; id: string } {
  if (itemId.startsWith('molde:')) return { tipo: 'molde', id: itemId.slice(6) };
  if (itemId.startsWith('contracao:')) return { tipo: 'contracao', id: itemId.slice(10) };
  return { tipo: 'palavra', id: itemId };
}

const palavrasComoItens: ItemDaLicao[] = PALAVRAS.map((p) => ({ id: p.id, tipo: 'palavra' }));
const moldesComoItens: ItemDaLicao[] = MOLDES.map((m) => ({ id: idDoItem('molde', m.id), tipo: 'molde' }));
const contracoesComoItens: ItemDaLicao[] = CONTRACOES.map((c) => ({ id: idDoItem('contracao', c.id), tipo: 'contracao' }));

/** Todo o conteúdo, na ordem de ensino. */
export function todosOsItens(): ItemDaLicao[] {
  return [...palavrasComoItens, ...moldesComoItens, ...contracoesComoItens];
}

/** Itens de uma unidade: palavras do tema, ou moldes (e contrações, nas preposições) da estrutura. */
export function itensDaUnidade(unidade: Unidade): ItemDaLicao[] {
  if (unidade.tipo === 'tema') {
    return palavrasComoItens.filter((i) => PALAVRAS.find((p) => p.id === i.id)?.tema === unidade.alvo);
  }
  const moldes = moldesComoItens.filter(
    (i) => MOLDES.find((m) => idDoItem('molde', m.id) === i.id)?.estrutura === unidade.alvo,
  );
  return unidade.alvo === 'preposicoes-lugar' ? [...moldes, ...contracoesComoItens] : moldes;
}

export function estruturaDoItem(itemId: string): string | undefined {
  const { tipo, id } = separarId(itemId);
  if (tipo !== 'molde') return undefined;
  return MOLDES.find((m) => m.id === id)?.estrutura;
}
