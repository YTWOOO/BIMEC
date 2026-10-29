/**
 * Versões erradas da tradução de uma frase gerada, para o joguinho Inglês → português.
 * Cada versão muda uma coisa só (artigo, preposição, palavra ou quem está onde) e
 * vem com a explicação do erro.
 */
import { MOLDES, PALAVRAS, PREPOSICOES, palavraPorId, preposicaoPorEn } from '@/conteudo';
import type { Molde, Palavra, Preposicao } from '@/conteudo/tipos';

import { embaralhar, type Aleatorio } from './aleatorio';
import { SENTIDO_PREPOSICAO, VIZINHAS } from './distratores';
import { construirFrase, lugarDoMolde, type FraseGerada } from './frases';

export type TipoVariacao = 'artigo' | 'preposicao' | 'palavra' | 'papeis';

export interface VariacaoPt {
  pt: string;
  tipo: TipoVariacao;
  explicacao: string;
}

/** Preposições em que trocar quem está onde não muda o sentido. */
const SIMETRICAS = new Set(['next to', 'between']);

function mesmoTexto(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** A palavra cabe no espaço do molde: tem as etiquetas e as formas que o molde usa. */
function cabe(p: Palavra, molde: Molde, espaco: string, prep: Preposicao | null, original: Palavra): boolean {
  if (!molde.espacos[espaco].tags.every((t) => p.tags.includes(t))) return false;
  if (original.artigo !== null && p.artigo === null) return false;
  if (original.pluralPt !== null && p.pluralPt === null) return false;
  if (prep && espaco === lugarDoMolde(molde) && !prep.requer.some((t) => p.tags.includes(t))) return false;
  return true;
}

function dadosDaFrase(frase: FraseGerada) {
  const molde = MOLDES.find((m) => m.id === frase.moldeId);
  if (!molde) return null;
  const escolhidas: Record<string, Palavra> = {};
  for (const [espaco, id] of Object.entries(frase.palavras)) {
    const p = palavraPorId(id);
    if (!p) return null;
    escolhidas[espaco] = p;
  }
  const prep = frase.preposicao ? (preposicaoPorEn(frase.preposicao) ?? null) : null;
  return { molde, escolhidas, prep };
}

function trocarArtigo(molde: Molde, escolhidas: Record<string, Palavra>, prep: Preposicao | null): VariacaoPt | null {
  const pt = molde.pt.replace(/\{(prep:)?(um|o):/g, (_, p: string | undefined, a: string) => `{${p ?? ''}${a === 'um' ? 'o' : 'um'}:`);
  if (pt === molde.pt) return null;
  return {
    pt: construirFrase({ ...molde, pt }, escolhidas, prep).pt,
    tipo: 'artigo',
    explicacao: 'Repare no artigo: "a" e "an" são "um/uma"; "the" é "o/a".',
  };
}

function trocarPreposicao(molde: Molde, escolhidas: Record<string, Palavra>, prep: Preposicao | null): VariacaoPt[] {
  if (!prep) return [];
  const candidatas = [...(VIZINHAS[prep.en] ?? []), ...(molde.preposicoes ?? [])]
    .filter((en, i, lista) => en !== prep.en && lista.indexOf(en) === i)
    .map((en) => PREPOSICOES.find((p) => p.en === en))
    .filter((p): p is Preposicao => p !== undefined && p.pt !== prep.pt);
  return candidatas.map((outra) => ({
    pt: construirFrase(molde, escolhidas, outra).pt,
    tipo: 'preposicao' as const,
    explicacao: `"${prep.en}" é "${SENTIDO_PREPOSICAO[prep.en]}", não "${SENTIDO_PREPOSICAO[outra.en]}".`,
  }));
}

function trocarPalavras(
  molde: Molde,
  escolhidas: Record<string, Palavra>,
  prep: Preposicao | null,
  aleatorio: Aleatorio,
): VariacaoPt[] {
  const usadas = new Set(Object.values(escolhidas).map((p) => p.id));
  const saida: VariacaoPt[] = [];
  for (const [espaco, original] of Object.entries(escolhidas)) {
    const candidatas = PALAVRAS.filter(
      (p) => !usadas.has(p.id) && p.pt !== original.pt && cabe(p, molde, espaco, prep, original),
    );
    // Palavras do mesmo tema primeiro: confundem mais.
    const ordenadas = [
      ...embaralhar(candidatas.filter((p) => p.tema === original.tema), aleatorio),
      ...embaralhar(candidatas.filter((p) => p.tema !== original.tema), aleatorio),
    ];
    for (const outra of ordenadas.slice(0, 3)) {
      saida.push({
        pt: construirFrase(molde, { ...escolhidas, [espaco]: outra }, prep).pt,
        tipo: 'palavra',
        explicacao: `"${original.en}" é "${original.pt}", não "${outra.pt}".`,
      });
    }
  }
  return saida;
}

function trocarPapeis(molde: Molde, escolhidas: Record<string, Palavra>, prep: Preposicao | null): VariacaoPt | null {
  const lugar = lugarDoMolde(molde);
  const coisa = Object.keys(escolhidas).find((e) => e !== lugar);
  if (!prep || !lugar || !coisa || SIMETRICAS.has(prep.en)) return null;
  const x = escolhidas[coisa];
  const l = escolhidas[lugar];
  if (molde.pt.includes('{dois:') && (x.pluralPt === null || l.pluralPt === null)) return null;
  return {
    pt: construirFrase(molde, { ...escolhidas, [coisa]: l, [lugar]: x }, prep).pt,
    tipo: 'papeis',
    explicacao: `Quem está "${SENTIDO_PREPOSICAO[prep.en]}" é "${x.en}" (${x.pt}), não o contrário.`,
  };
}

/**
 * Até `quantidade` traduções erradas, diferentes entre si e da certa.
 * Pega um erro de cada tipo antes de repetir tipo. Frases fora dos moldes não têm variações.
 */
export function variacoesPt(frase: FraseGerada, aleatorio: Aleatorio, quantidade = 3): VariacaoPt[] {
  const dados = dadosDaFrase(frase);
  if (!dados) return [];
  const { molde, escolhidas, prep } = dados;

  const porTipo: VariacaoPt[][] = [
    [trocarArtigo(molde, escolhidas, prep)].filter((v): v is VariacaoPt => v !== null),
    embaralhar(trocarPreposicao(molde, escolhidas, prep), aleatorio),
    [trocarPapeis(molde, escolhidas, prep)].filter((v): v is VariacaoPt => v !== null),
    trocarPalavras(molde, escolhidas, prep, aleatorio),
  ];

  const escolhidasSaida: VariacaoPt[] = [];
  const vistos = [frase.pt];
  const tentar = (v: VariacaoPt) => {
    if (escolhidasSaida.length >= quantidade || vistos.some((t) => mesmoTexto(t, v.pt))) return;
    vistos.push(v.pt);
    escolhidasSaida.push(v);
  };
  // Primeira volta: um de cada tipo, em ordem sorteada. Depois, o que sobrar.
  const ordemTipos = embaralhar(porTipo, aleatorio);
  for (const lista of ordemTipos) if (lista[0]) tentar(lista[0]);
  for (const lista of ordemTipos) for (const v of lista.slice(1)) tentar(v);
  return escolhidasSaida;
}
