/**
 * Dicionário de toque: qualquer palavra em inglês que aparece no app tem uma ficha
 * com o significado e os contextos em que ela aparece.
 * Os substantivos vêm das palavras do conteúdo; o resto vem do glossário.
 */
import { PALAVRAS } from '@/conteudo';
import glossarioJson from '@/conteudo/glossario.json';
import extrasJson from '@/conteudo/sentidos-extras.json';
import type { Palavra } from '@/conteudo/tipos';
import { artigoIndefinido, numeroDois } from '@/gerador/portugues';

export interface Contexto {
  titulo: string;
  en: string;
  pt: string;
}

export interface EntradaDicionario {
  id: string;
  en: string;
  classe: string;
  significado: string;
  explicacao?: string;
  /** Outras formas que levam a esta ficha ("likes" → "like"). */
  formas?: string[];
  contextos: Contexto[];
  /** Quando é uma palavra do conteúdo, o id dela (para abrir a tela da palavra). */
  palavraId?: string;
}

const GLOSSARIO = glossarioJson as EntradaDicionario[];
const EXTRAS = extrasJson as Record<string, Contexto[]>;

function entradaDaPalavra(p: Palavra): EntradaDicionario {
  const explicacao =
    p.artigo !== null && p.plural && p.pluralPt
      ? `Dá para contar: ${p.artigo} ${p.en} (${artigoIndefinido(p.generoPt)} ${p.pt}), two ${p.plural} (${numeroDois(p.generoPt)} ${p.pluralPt}).`
      : 'Não se conta: não leva a/an e não tem plural.';
  return {
    id: p.id,
    en: p.en,
    classe: 'substantivo',
    significado: p.pt,
    explicacao,
    formas: p.plural && p.plural !== p.en ? [p.plural] : [],
    contextos: [{ titulo: 'Exemplo', en: p.exemplo.en, pt: p.exemplo.pt }, ...(EXTRAS[p.id] ?? [])],
    palavraId: p.id,
  };
}

export const ENTRADAS: EntradaDicionario[] = [...PALAVRAS.map(entradaDaPalavra), ...GLOSSARIO];

const porId = new Map(ENTRADAS.map((e) => [e.id, e]));

/** Chave de busca: minúscula, menos o "I", que é sempre maiúsculo. */
function chave(palavra: string): string {
  return palavra === 'I' ? 'I' : palavra.toLowerCase();
}

const indice = new Map<string, string>();
for (const e of ENTRADAS) {
  indice.set(chave(e.en), e.id);
  for (const f of e.formas ?? []) indice.set(chave(f), e.id);
}

/** Expressões de várias palavras, das mais longas para as mais curtas ("in front of" antes de "next to"). */
const EXPRESSOES = ENTRADAS.filter((e) => e.en.includes(' '))
  .map((e) => ({ id: e.id, palavras: e.en.toLowerCase().split(' ') }))
  .sort((a, b) => b.palavras.length - a.palavras.length);

export function entradaPorId(id: string): EntradaDicionario | undefined {
  return porId.get(id);
}

/** Acha a ficha de uma palavra solta, como aparece na frase. */
export function buscarPalavra(palavra: string): EntradaDicionario | undefined {
  const id = indice.get(chave(palavra)) ?? indice.get(palavra.toLowerCase());
  return id ? porId.get(id) : undefined;
}

export interface Trecho {
  /** Texto exatamente como está na frase. */
  texto: string;
  /** É palavra (dá para tocar) ou só espaço e pontuação. */
  palavra: boolean;
  /** Id da ficha, ou null se a palavra não está no dicionário. */
  entrada: string | null;
}

/**
 * Quebra uma frase em trechos tocáveis.
 * Expressões como "next to" e "in front of" viram um trecho só.
 */
export function tokenizar(frase: string): Trecho[] {
  const partes = frase.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? [];
  const ehPalavra = (t: string) => /^[A-Za-z']+$/.test(t);
  const trechos: Trecho[] = [];
  let i = 0;
  while (i < partes.length) {
    const atual = partes[i];
    if (!ehPalavra(atual)) {
      trechos.push({ texto: atual, palavra: false, entrada: null });
      i++;
      continue;
    }
    const expressao = EXPRESSOES.find(({ palavras }) =>
      palavras.every((p, k) => {
        const parte = partes[i + 2 * k];
        const separador = k === 0 ? ' ' : partes[i + 2 * k - 1];
        return parte !== undefined && parte.toLowerCase() === p && separador === ' ';
      }),
    );
    if (expressao) {
      const fim = i + 2 * (expressao.palavras.length - 1);
      trechos.push({ texto: partes.slice(i, fim + 1).join(''), palavra: true, entrada: expressao.id });
      i = fim + 1;
      continue;
    }
    trechos.push({ texto: atual, palavra: true, entrada: buscarPalavra(atual)?.id ?? null });
    i++;
  }
  return trechos;
}
