/** Formato do conteúdo. Ver a seção "Conteúdo" do plano. */

export type ClassePalavra = 'substantivo' | 'verbo' | 'adjetivo' | 'adverbio' | 'outro';

/**
 * Etiquetas que dizem onde a palavra cabe num molde de frase.
 * - objeto: coisa que dá para pegar ou mover
 * - pequeno: cabe dentro de outra coisa
 * - recipiente: cabe coisa dentro (inside, in)
 * - superficie: dá para pôr coisa em cima (on)
 * - lugar: cômodo ou lugar (in the kitchen)
 * - comida: algo que se come ou se bebe
 * - contavel / incontavel: aceita ou não a/an e plural
 */
export type Etiqueta =
  | 'objeto'
  | 'pequeno'
  | 'recipiente'
  | 'superficie'
  | 'lugar'
  | 'pessoa'
  | 'animal'
  | 'comida'
  | 'contavel'
  | 'incontavel';

export interface Palavra {
  id: string;
  en: string;
  pt: string;
  tema: string;
  classe: ClassePalavra;
  /** Escrito à mão, nunca calculado ("an hour", "a university"). null para incontáveis. */
  artigo: 'a' | 'an' | null;
  plural: string | null;
  generoPt: 'm' | 'f';
  pluralPt: string | null;
  tags: Etiqueta[];
  exemplo: { en: string; pt: string };
}

export interface Tema {
  id: string;
  nome: string;
}

export interface Estrutura {
  id: string;
  nome: string;
  /** Explicação curta mostrada antes dos exercícios da estrutura. */
  resumo: string;
}

/**
 * Preposição de lugar usada nos moldes.
 * `requer`: a palavra do lugar precisa ter pelo menos uma destas etiquetas.
 */
export interface Preposicao {
  en: string;
  /** Forma em português antes do artigo ("dentro de", "em"). A contração é feita pelo gerador. */
  pt: string;
  requer: Etiqueta[];
}

/** Espaço de um molde, preenchido por uma palavra. */
export interface Espaco {
  /** A palavra precisa ter todas estas etiquetas. */
  tags: Etiqueta[];
}

/**
 * Molde de frase. Os textos usam marcações trocadas pelo gerador:
 * - {X}          palavra sozinha (apple / maçã)
 * - {um:X}       artigo indefinido (an apple / uma maçã)
 * - {o:X}        artigo definido (the apple / a maçã)
 * - {dois:X}     plural com número (two apples / duas maçãs)
 * - {prep:um:X}  preposição + indefinido (inside a book / dentro de um livro)
 * - {prep:o:X}   preposição + definido (on the table / na mesa)
 */
export interface Molde {
  id: string;
  estrutura: string;
  /** Degrau mínimo do item para este molde aparecer. */
  nivelMin: number;
  en: string;
  pt: string;
  espacos: Record<string, Espaco>;
  /** Preposições que o molde pode usar, quando tem {prep:...}. */
  preposicoes?: string[];
}

export interface Contracao {
  id: string;
  /** A contração em português ("naquele"). */
  pt: string;
  /** As duas partes ("em", "aquele"). */
  partes: [string, string];
  /** Tradução da contração ("in that"). */
  en: string;
  exemplo: { pt: string; en: string };
  /** Observação para o aluno, quando tem pegadinha. */
  nota?: string;
}

export type TipoUnidade = 'estrutura' | 'tema';

export interface Unidade {
  id: string;
  numero: number;
  tipo: TipoUnidade;
  /** Id da estrutura ou do tema. */
  alvo: string;
  titulo: string;
  licoes: number;
}
