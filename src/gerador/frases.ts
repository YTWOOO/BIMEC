/**
 * Gerador de frases: escolhe um molde, preenche os espaços com palavras
 * compatíveis e monta a frase em inglês e em português.
 */
import { MOLDES, PALAVRAS, PREPOSICOES } from '@/conteudo';
import type { Espaco, Etiqueta, Molde, Palavra, Preposicao } from '@/conteudo/tipos';

import { criarAleatorio, embaralhar, sortear, sortearComPeso, type Aleatorio } from './aleatorio';
import {
  artigoDefinido,
  artigoIndefinido,
  capitalizar,
  juntarComPreposicao,
  numeroDois,
} from './portugues';

export interface FraseGerada {
  /** Identifica a combinação: molde, palavras e preposição. */
  id: string;
  moldeId: string;
  estrutura: string;
  en: string;
  pt: string;
  /** Espaço do molde → id da palavra. */
  palavras: Record<string, string>;
  /** Preposição usada (em inglês), quando o molde tem uma. */
  preposicao: string | null;
  /** Palavras da frase em inglês, sem pontuação, para montar com blocos. */
  blocosEn: string[];
  blocosPt: string[];
}

type Forma = 'sozinha' | 'um' | 'o' | 'dois' | 'prep-um' | 'prep-o';

interface Marca {
  texto: string;
  espaco: string;
  forma: Forma;
}

const REGEX_MARCA = /\{([^}]+)\}/g;

function lerMarcas(modelo: string): Marca[] {
  const marcas: Marca[] = [];
  for (const m of modelo.matchAll(REGEX_MARCA)) {
    const partes = m[1].split(':');
    let forma: Forma;
    let espaco: string;
    if (partes.length === 1) {
      forma = 'sozinha';
      espaco = partes[0];
    } else if (partes.length === 2) {
      forma = partes[0] as Forma;
      espaco = partes[1];
    } else {
      forma = `prep-${partes[1]}` as Forma;
      espaco = partes[2];
    }
    marcas.push({ texto: m[0], espaco, forma });
  }
  return marcas;
}

function textoEn(m: Marca, p: Palavra, prep: Preposicao | null): string {
  switch (m.forma) {
    case 'sozinha':
      return p.en;
    case 'um':
      return `${p.artigo} ${p.en}`;
    case 'o':
      return `the ${p.en}`;
    case 'dois':
      return `two ${p.plural}`;
    case 'prep-um':
      return `${prep?.en} ${p.artigo} ${p.en}`;
    case 'prep-o':
      return `${prep?.en} the ${p.en}`;
  }
}

function textoPt(m: Marca, p: Palavra, prep: Preposicao | null): string {
  switch (m.forma) {
    case 'sozinha':
      return p.pt;
    case 'um':
      return `${artigoIndefinido(p.generoPt)} ${p.pt}`;
    case 'o':
      return `${artigoDefinido(p.generoPt)} ${p.pt}`;
    case 'dois':
      return `${numeroDois(p.generoPt)} ${p.pluralPt}`;
    case 'prep-um':
      return juntarComPreposicao(prep?.pt ?? '', artigoIndefinido(p.generoPt), p.pt);
    case 'prep-o':
      return juntarComPreposicao(prep?.pt ?? '', artigoDefinido(p.generoPt), p.pt);
  }
}

/** Formas que pedem palavra contável (com a/an e plural). */
function precisaContavel(formas: Forma[]): boolean {
  return formas.some((f) => f === 'um' || f === 'dois' || f === 'prep-um');
}

function serve(p: Palavra, espaco: Espaco, formas: Forma[], algumaDe: Etiqueta[] | null): boolean {
  if (!espaco.tags.every((t) => p.tags.includes(t))) return false;
  if (precisaContavel(formas) && (p.artigo === null || p.plural === null || p.pluralPt === null)) return false;
  if (algumaDe && !algumaDe.some((t) => p.tags.includes(t))) return false;
  return true;
}

function montar(modelo: string, marcas: Marca[], escolhidas: Record<string, Palavra>, prep: Preposicao | null, lingua: 'en' | 'pt'): string {
  let texto = modelo;
  for (const m of marcas) {
    const p = escolhidas[m.espaco];
    texto = texto.replace(m.texto, lingua === 'en' ? textoEn(m, p, prep) : textoPt(m, p, prep));
  }
  return capitalizar(texto);
}

function blocos(frase: string): string[] {
  return frase
    .replace(/[.?!]$/, '')
    .split(' ')
    .map((b) => (b === 'I' ? b : b.toLowerCase()));
}

export interface OpcoesFrase {
  palavras?: Palavra[];
  preposicoes?: Preposicao[];
  /** Ids de palavras que devem aparecer mais (ex.: revisão vencida). */
  preferidas?: ReadonlySet<string>;
  /** Id de uma palavra que precisa estar na frase. */
  obrigatoria?: string;
}

/** Gera uma frase de um molde. Devolve null se nenhuma combinação servir. */
export function gerarFrase(molde: Molde, aleatorio: Aleatorio, opcoes: OpcoesFrase = {}): FraseGerada | null {
  const palavras = opcoes.palavras ?? PALAVRAS;
  const todasPreps = opcoes.preposicoes ?? PREPOSICOES;
  const marcasEn = lerMarcas(molde.en);
  const marcasPt = lerMarcas(molde.pt);

  const formasPorEspaco: Record<string, Forma[]> = {};
  for (const m of [...marcasEn, ...marcasPt]) {
    (formasPorEspaco[m.espaco] ??= []).push(m.forma);
  }
  const espacoDoLugar = Object.keys(formasPorEspaco).find((e) =>
    formasPorEspaco[e].some((f) => f.startsWith('prep')),
  );

  const prepsDoMolde = molde.preposicoes
    ? todasPreps.filter((p) => molde.preposicoes?.includes(p.en))
    : [];
  const tentativasPrep: (Preposicao | null)[] = espacoDoLugar ? embaralhar(prepsDoMolde, aleatorio) : [null];

  for (const prep of tentativasPrep) {
    const escolhidas: Record<string, Palavra> = {};
    const usadas = new Set<string>();
    // O lugar primeiro: é o espaço mais restrito.
    const ordem = Object.keys(molde.espacos).sort((a, b) =>
      a === espacoDoLugar ? -1 : b === espacoDoLugar ? 1 : 0,
    );
    let deuCerto = true;
    for (const nome of ordem) {
      const algumaDe = nome === espacoDoLugar && prep ? prep.requer : null;
      const candidatas = palavras.filter(
        (p) => !usadas.has(p.id) && serve(p, molde.espacos[nome], formasPorEspaco[nome] ?? [], algumaDe),
      );
      if (candidatas.length === 0) {
        deuCerto = false;
        break;
      }
      const obrigatoria =
        opcoes.obrigatoria && !usadas.has(opcoes.obrigatoria)
          ? candidatas.find((p) => p.id === opcoes.obrigatoria)
          : undefined;
      const escolhida = obrigatoria ?? sortearComPeso(candidatas, aleatorio, opcoes.preferidas);
      escolhidas[nome] = escolhida;
      usadas.add(escolhida.id);
    }
    if (!deuCerto) continue;
    if (opcoes.obrigatoria && !usadas.has(opcoes.obrigatoria)) continue;

    const en = montar(molde.en, marcasEn, escolhidas, prep, 'en');
    const pt = montar(molde.pt, marcasPt, escolhidas, prep, 'pt');
    const ids = Object.fromEntries(Object.entries(escolhidas).map(([k, p]) => [k, p.id]));
    const chave = Object.entries(ids)
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
    return {
      id: `${molde.id}|${chave}${prep ? `|${prep.en}` : ''}`,
      moldeId: molde.id,
      estrutura: molde.estrutura,
      en,
      pt,
      palavras: ids,
      preposicao: prep?.en ?? null,
      blocosEn: blocos(en),
      blocosPt: blocos(pt),
    };
  }
  return null;
}

export interface OpcoesGerar extends OpcoesFrase {
  semente?: number;
  moldes?: Molde[];
  /** Só moldes desta estrutura. */
  estrutura?: string;
  /** Só moldes com nivelMin até este degrau. */
  nivelMax?: number;
}

/** Gera várias frases diferentes. */
export function gerarFrases(quantidade: number, opcoes: OpcoesGerar = {}): FraseGerada[] {
  const aleatorio = criarAleatorio(opcoes.semente ?? Date.now());
  const moldes = (opcoes.moldes ?? MOLDES).filter(
    (m) =>
      (!opcoes.estrutura || m.estrutura === opcoes.estrutura) &&
      (opcoes.nivelMax === undefined || m.nivelMin <= opcoes.nivelMax),
  );
  if (moldes.length === 0) return [];

  const frases: FraseGerada[] = [];
  const vistas = new Set<string>();
  let tentativas = 0;
  while (frases.length < quantidade && tentativas < quantidade * 20) {
    tentativas++;
    const frase = gerarFrase(sortear(moldes, aleatorio), aleatorio, opcoes);
    if (frase && !vistas.has(frase.id)) {
      vistas.add(frase.id);
      frases.push(frase);
    }
  }
  return frases;
}

/** Frase com uma palavra obrigatória, de no máximo `limite` palavras. Null se nenhum molde servir. */
export function gerarFraseComPalavra(
  palavraId: string,
  aleatorio: Aleatorio,
  opcoes: OpcoesFrase & { limite?: number; moldes?: Molde[] } = {},
): FraseGerada | null {
  for (const molde of embaralhar(opcoes.moldes ?? MOLDES, aleatorio)) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const frase = gerarFrase(molde, aleatorio, { ...opcoes, obrigatoria: palavraId });
      if (!frase) break;
      if (opcoes.limite === undefined || frase.blocosEn.length <= opcoes.limite) return frase;
    }
  }
  return null;
}

/** A frase de exemplo da própria palavra, no formato de frase gerada. */
export function fraseDoExemplo(palavra: Palavra): FraseGerada {
  return {
    id: `exemplo|${palavra.id}`,
    moldeId: 'exemplo',
    estrutura: 'exemplo',
    en: palavra.exemplo.en,
    pt: palavra.exemplo.pt,
    palavras: { X: palavra.id },
    preposicao: null,
    blocosEn: blocos(palavra.exemplo.en),
    blocosPt: blocos(palavra.exemplo.pt),
  };
}
