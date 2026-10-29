/**
 * Distratores: versões erradas de uma frase, usadas nas opções dos joguinhos.
 * Cada distrator vem com a explicação do erro, mostrada quando o Ícaro escolhe ele.
 */
import { PALAVRAS } from '@/conteudo';
import type { Palavra } from '@/conteudo/tipos';

import { embaralhar, sortear, type Aleatorio } from './aleatorio';
import type { FraseGerada } from './frases';
import { capitalizar } from './portugues';

export type TipoDistrator = 'artigo' | 'preposicao' | 'ordem' | 'palavra';

export interface Distrator {
  en: string;
  tipo: TipoDistrator;
  explicacao: string;
}

/** O que cada preposição quer dizer, para explicar a troca. */
export const SENTIDO_PREPOSICAO: Record<string, string> = {
  inside: 'dentro de',
  in: 'dentro de / em',
  on: 'em cima de / encostado em',
  under: 'embaixo de',
  'next to': 'ao lado de',
  behind: 'atrás de',
  'in front of': 'na frente de',
};

/** Preposições que costumam ser confundidas entre si. */
export const VIZINHAS: Record<string, string[]> = {
  inside: ['on', 'under'],
  in: ['on', 'under'],
  on: ['in', 'under'],
  under: ['on', 'behind'],
  'next to': ['behind', 'in front of'],
  behind: ['in front of', 'next to'],
  'in front of': ['behind', 'next to'],
};

const REGEX_ARTIGO = /\b(a|an|A|An)\s+(\w+)/;

function trocarArtigo(frase: FraseGerada): Distrator | null {
  const m = frase.en.match(REGEX_ARTIGO);
  if (!m || m.index === undefined) return null;
  const [inteiro, artigo, substantivo] = m;
  const certo = artigo.toLowerCase();
  const errado = certo === 'an' ? 'a' : 'an';
  const erradoComCaixa = artigo[0] === artigo[0].toUpperCase() ? capitalizar(errado) : errado;
  const en = frase.en.slice(0, m.index) + `${erradoComCaixa} ${substantivo}` + frase.en.slice(m.index + inteiro.length);
  const som = certo === 'an' ? 'vogal' : 'consoante';
  return {
    en,
    tipo: 'artigo',
    explicacao: `"${substantivo}" começa com som de ${som}, então é "${certo} ${substantivo}".`,
  };
}

function trocarPreposicao(frase: FraseGerada): Distrator | null {
  const certa = frase.preposicao;
  if (!certa) return null;
  const errada = VIZINHAS[certa]?.[0];
  if (!errada) return null;
  const en = frase.en.replace(` ${certa} `, ` ${errada} `);
  if (en === frase.en) return null;
  return {
    en,
    tipo: 'preposicao',
    explicacao: `"${certa}" é "${SENTIDO_PREPOSICAO[certa]}"; "${errada}" seria "${SENTIDO_PREPOSICAO[errada]}".`,
  };
}

function trocarOrdem(frase: FraseGerada): Distrator | null {
  const pontuacao = frase.en.match(/[.?!]$/)?.[0] ?? '';
  const palavras = frase.en.replace(/[.?!]$/, '').split(' ');
  const i = palavras.findIndex((p, k) => /^(a|an|the)$/i.test(p) && k + 1 < palavras.length);
  if (i < 0) return null;
  const artigo = palavras[i];
  const substantivo = palavras[i + 1];
  const trocadas = [...palavras];
  trocadas[i] = substantivo.toLowerCase();
  trocadas[i + 1] = artigo.toLowerCase();
  const en = capitalizar(trocadas.join(' ')) + pontuacao;
  if (en === frase.en) return null;
  return {
    en,
    tipo: 'ordem',
    explicacao: `Em inglês o artigo vem antes da palavra: "${artigo.toLowerCase()} ${substantivo.toLowerCase()}".`,
  };
}

/** Troca a primeira palavra por outra do mesmo tema, com o mesmo artigo: a frase fica certa, mas diz outra coisa. */
function trocarPalavra(frase: FraseGerada, aleatorio: Aleatorio, palavras: Palavra[]): Distrator | null {
  const id = frase.palavras.X ?? Object.values(frase.palavras)[0];
  const original = palavras.find((p) => p.id === id);
  if (!original) return null;
  const usadas = new Set(Object.values(frase.palavras));
  const parecidas = palavras.filter(
    (p) =>
      !usadas.has(p.id) &&
      p.tema === original.tema &&
      p.artigo === original.artigo &&
      p.tags.every((t) => original.tags.includes(t)) &&
      original.tags.every((t) => p.tags.includes(t)),
  );
  if (parecidas.length === 0) return null;
  const outra = sortear(parecidas, aleatorio);
  const regex = new RegExp(`\\b${original.en}\\b`, 'i');
  const regexPlural = original.plural ? new RegExp(`\\b${original.plural}\\b`, 'i') : null;
  let en = frase.en;
  if (regexPlural && regexPlural.test(en) && outra.plural) en = en.replace(regexPlural, outra.plural);
  else en = en.replace(regex, outra.en);
  if (en === frase.en) return null;
  return {
    en: capitalizar(en),
    tipo: 'palavra',
    explicacao: `A frase fala de "${original.en}" (${original.pt}), não de "${outra.en}" (${outra.pt}).`,
  };
}

/** Até `quantidade` distratores diferentes entre si e da frase certa. */
export function gerarDistratores(
  frase: FraseGerada,
  aleatorio: Aleatorio,
  quantidade = 3,
  palavras: Palavra[] = PALAVRAS,
): Distrator[] {
  const candidatos = [
    trocarArtigo(frase),
    trocarPreposicao(frase),
    trocarOrdem(frase),
    trocarPalavra(frase, aleatorio, palavras),
  ].filter((d): d is Distrator => d !== null);

  const unicos: Distrator[] = [];
  const vistos = new Set([frase.en.toLowerCase()]);
  for (const d of candidatos) {
    const chave = d.en.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.add(chave);
      unicos.push(d);
    }
  }
  return embaralhar(unicos, aleatorio).slice(0, quantidade);
}

/** Blocos a mais para o joguinho "Blocos sobrando": o artigo errado e uma preposição vizinha. */
export function blocosExtras(frase: FraseGerada): string[] {
  const extras: string[] = [];
  if (frase.blocosEn.includes('an')) extras.push('a');
  else if (frase.blocosEn.includes('a')) extras.push('an');
  if (frase.preposicao) {
    const vizinha = VIZINHAS[frase.preposicao]?.[0];
    if (vizinha) extras.push(...vizinha.split(' ').filter((b) => !frase.blocosEn.includes(b)));
  }
  if (extras.length === 0) extras.push(frase.blocosEn.includes('the') ? 'a' : 'the');
  return extras;
}
