import type { Estrutura } from './tipos';

/** As 12 estruturas do plano, na ordem de ensino. */
export const ESTRUTURAS: Estrutura[] = [
  {
    id: 'artigos',
    nome: 'Artigos: a, an, the',
    resumo: '"a" e "an" são "um/uma"; "an" vem antes de som de vogal. "the" é "o/a/os/as".',
  },
  { id: 'to-be', nome: 'Verbo to be', resumo: 'am, is, are: ser e estar.' },
  { id: 'pronomes', nome: 'Pronomes', resumo: 'I, you, he… / my, your… / me, him…' },
  { id: 'demonstrativos', nome: 'Demonstrativos', resumo: 'this, that, these, those.' },
  {
    id: 'preposicoes-lugar',
    nome: 'Preposições de lugar',
    resumo: 'Onde a coisa está: in, inside, on, under, next to, behind, in front of.',
  },
  { id: 'there-is', nome: 'There is / There are', resumo: '"Tem" ou "há" alguma coisa em algum lugar.' },
  { id: 'plural', nome: 'Plural, some e any', resumo: 'Mais de um, e quantidades.' },
  { id: 'conectores', nome: 'Conectores', resumo: 'and, but, or, because, so.' },
  { id: 'possessivo', nome: "Possessivo: 's e of", resumo: "Ana's book = o livro da Ana." },
  { id: 'presente-simples', nome: 'Presente simples', resumo: 'O que acontece sempre.' },
  { id: 'presente-continuo', nome: 'Presente contínuo', resumo: 'O que está acontecendo agora.' },
  { id: 'perguntas', nome: 'Perguntas', resumo: 'what, where, who, when, why, how.' },
];

export function nomeDaEstrutura(id: string): string {
  return ESTRUTURAS.find((e) => e.id === id)?.nome ?? id;
}
