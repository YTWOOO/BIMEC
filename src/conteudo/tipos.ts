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
