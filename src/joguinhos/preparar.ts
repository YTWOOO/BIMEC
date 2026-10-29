/**
 * Transforma um exercício do motor (item + joguinho) numa pergunta pronta para a tela:
 * o que aparece no topo, as opções, a resposta certa e a explicação de cada erro.
 * Tudo puro e com sorteio controlado, para os testes darem sempre o mesmo resultado.
 */
import { CONTRACOES, ESTRUTURAS, MOLDES, PALAVRAS, PREPOSICOES, palavraPorId } from '@/conteudo';
import type { Contracao, Molde, Palavra } from '@/conteudo/tipos';
import { embaralhar, type Aleatorio } from '@/gerador/aleatorio';
import { SENTIDO_PREPOSICAO, VIZINHAS, gerarDistratores } from '@/gerador/distratores';
import { fraseDoExemplo, gerarFrase, gerarFraseComPalavra, lugarDoMolde, type FraseGerada } from '@/gerador/frases';
import { capitalizar } from '@/gerador/portugues';
import { variacoesPt } from '@/gerador/variacoes';
import { idDoItem, separarId } from '@/motor/itens';
import type { Joguinho } from '@/motor/joguinhos';
import type { Exercicio } from '@/motor/licao';

import {
  POSICOES,
  type Lacuna,
  type Opcao,
  type Pergunta,
  type PerguntaCard,
  type PerguntaCompletar,
  type PerguntaEscolha,
  type PerguntaOnde,
  type PerguntaPares,
  type Posicao,
  type Trecho,
} from './tipos';

/** Joguinhos que já existem no app. Os dos degraus 3 a 5 chegam na etapa 6. */
export const JOGUINHOS_PRONTOS: ReadonlySet<Joguinho> = new Set<Joguinho>([
  'card-novo',
  'en-pt',
  'pares',
  'onde-esta',
  'pt-en',
  'completar',
  'ouvir-escolher',
]);

/** Pares de posições que viram o mesmo desenho: nunca aparecem juntas. */
const GEMEAS: Partial<Record<Posicao, Posicao>> = { in: 'inside', inside: 'in' };

/** O que cada posição quer dizer, para explicar o "Onde está?". */
export const SENTIDO_POSICAO: Record<Posicao, string> = {
  ...(SENTIDO_PREPOSICAO as Record<Exclude<Posicao, 'between'>, string>),
  between: 'entre',
};

type SemId = Omit<Opcao, 'id'>;

function mesmo(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Junta a certa com as erradas (sem textos repetidos), embaralha e dá um id para cada. */
function montarOpcoes(certa: SemId, erradas: SemId[], aleatorio: Aleatorio): { opcoes: Opcao[]; certa: string } {
  const unicas: SemId[] = [certa];
  for (const e of erradas) if (!unicas.some((u) => mesmo(u.texto, e.texto))) unicas.push(e);
  const embaralhadas = embaralhar(unicas, aleatorio);
  const opcoes = embaralhadas.map((o, i) => ({ ...o, id: `o${i}` }));
  return { opcoes, certa: opcoes[embaralhadas.indexOf(certa)].id };
}

/** Outras palavras para servir de opção errada: do mesmo tema primeiro, sem textos repetidos. */
function outrasPalavras(p: Palavra, quantidade: number, aleatorio: Aleatorio): Palavra[] {
  const candidatas = PALAVRAS.filter((o) => o.id !== p.id && !mesmo(o.en, p.en) && !mesmo(o.pt, p.pt));
  const ordenadas = [
    ...embaralhar(candidatas.filter((o) => o.tema === p.tema), aleatorio),
    ...embaralhar(candidatas.filter((o) => o.tema !== p.tema), aleatorio),
  ];
  const saida: Palavra[] = [];
  for (const o of ordenadas) {
    if (saida.length >= quantidade) break;
    if (saida.some((s) => mesmo(s.en, o.en) || mesmo(s.pt, o.pt))) continue;
    saida.push(o);
  }
  return saida;
}

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Acha uma palavra inteira (ou expressão) no texto, sem diferenciar maiúsculas. */
function acharPalavra(texto: string, alvo: string): { inicio: number; fim: number } | null {
  const m = new RegExp(`(^|[\\s(])(${escapar(alvo)})(?=[\\s.,!?)]|$)`, 'i').exec(texto);
  if (!m) return null;
  const inicio = m.index + m[1].length;
  return { inicio, fim: inicio + m[2].length };
}

// ---------------------------------------------------------------------------
// Cards de apresentação

function padraoDoMolde(molde: Molde, lingua: 'en' | 'pt'): string {
  const preps = (molde.preposicoes ?? []).map((en) => PREPOSICOES.find((p) => p.en === en)).filter((p) => p !== undefined);
  const nomes = [...new Set(preps.map((p) => (lingua === 'en' ? p.en : p.pt)))];
  const prep = nomes.length > 0 ? `${nomes.slice(0, 3).join('/')}${nomes.length > 3 ? '…' : ''}` : '';
  const texto = (lingua === 'en' ? molde.en : molde.pt).replace(/\{([^}]+)\}/g, (_, marca: string) => {
    const partes = marca.split(':');
    const forma = partes.length === 1 ? 'sozinha' : partes.length === 2 ? partes[0] : `prep-${partes[1]}`;
    const en: Record<string, string> = {
      sozinha: '___',
      um: 'a/an ___',
      o: 'the ___',
      dois: 'two ___s',
      'prep-um': `${prep} a/an ___`,
      'prep-o': `${prep} the ___`,
    };
    const pt: Record<string, string> = {
      sozinha: '___',
      um: 'um/uma ___',
      o: 'o/a ___',
      dois: 'dois/duas ___',
      'prep-um': `${prep} um/uma ___`,
      'prep-o': `${prep} o/a ___`,
    };
    return (lingua === 'en' ? en : pt)[forma] ?? '___';
  });
  // Espaço fixo antes do "___": "a/an ___" não quebra a linha no meio.
  return capitalizar(texto).replace(/ ___/g, '\u00a0___');
}

function cardDoMolde(ex: Exercicio, molde: Molde, aleatorio: Aleatorio): PerguntaCard {
  const estrutura = ESTRUTURAS.find((e) => e.id === molde.estrutura);
  const exemplos: { en: string; pt: string }[] = [];
  for (let i = 0; i < 8 && exemplos.length < 2; i++) {
    const f = gerarFrase(molde, aleatorio);
    if (f && !exemplos.some((e) => e.en === f.en)) exemplos.push({ en: f.en, pt: f.pt });
  }
  return {
    tipo: 'card',
    exercicio: ex,
    enunciado: 'Estrutura nova',
    resposta: {},
    card: {
      tipo: 'molde',
      nome: estrutura?.nome ?? molde.estrutura,
      resumo: estrutura?.resumo ?? '',
      padraoEn: padraoDoMolde(molde, 'en'),
      padraoPt: padraoDoMolde(molde, 'pt'),
      exemplos,
    },
  };
}

/** O pedaço do inglês que a contração vira no exemplo ("in the", "of the", "his"). */
export function trechoDaContracao(c: Contracao): string | null {
  for (const alternativa of c.en.split(' / ')) {
    const achou = acharPalavra(c.exemplo.en, alternativa);
    if (achou) return c.exemplo.en.slice(achou.inicio, achou.fim).toLowerCase();
  }
  return null;
}

function notaDaContracao(c: Contracao): string {
  return `${c.pt} = ${c.partes.join(' + ')} = ${trechoDaContracao(c) ?? c.en}`;
}

// ---------------------------------------------------------------------------
// Escolher uma opção

function enPtPalavra(ex: Exercicio, p: Palavra, aleatorio: Aleatorio): PerguntaEscolha {
  const erradas = outrasPalavras(p, 3, aleatorio).map((o) => ({
    texto: o.pt,
    lingua: 'pt' as const,
    explicacao: `"${o.pt}" é "${o.en}". "${p.en}" é "${p.pt}".`,
  }));
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: 'O que quer dizer?',
    en: p.en,
    ...montarOpcoes({ texto: p.pt, lingua: 'pt' }, erradas, aleatorio),
    resposta: { en: p.en, pt: p.pt },
  };
}

function ptEnPalavra(ex: Exercicio, p: Palavra, aleatorio: Aleatorio): PerguntaEscolha {
  const erradas = outrasPalavras(p, 3, aleatorio).map((o) => ({
    texto: o.en,
    lingua: 'en' as const,
    explicacao: `"${o.en}" é "${o.pt}". "${p.pt}" é "${p.en}".`,
  }));
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: 'Como se diz em inglês?',
    pt: p.pt,
    ...montarOpcoes({ texto: p.en, lingua: 'en' }, erradas, aleatorio),
    resposta: { en: p.en, pt: p.pt },
  };
}

function enPtFrase(ex: Exercicio, frase: FraseGerada, aleatorio: Aleatorio): PerguntaEscolha | null {
  const variacoes = variacoesPt(frase, aleatorio, 3);
  if (variacoes.length === 0) return null;
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: 'Qual é a tradução?',
    en: frase.en,
    ...montarOpcoes(
      { texto: frase.pt, lingua: 'pt' },
      variacoes.map((v) => ({ texto: v.pt, lingua: 'pt' as const, explicacao: v.explicacao })),
      aleatorio,
    ),
    resposta: { en: frase.en, pt: frase.pt },
  };
}

function ptEnFrase(ex: Exercicio, frase: FraseGerada, aleatorio: Aleatorio): PerguntaEscolha | null {
  const distratores = gerarDistratores(frase, aleatorio, 3);
  if (distratores.length === 0) return null;
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: 'Como se diz em inglês?',
    pt: frase.pt,
    ...montarOpcoes(
      { texto: frase.en, lingua: 'en' },
      distratores.map((d) => ({ texto: d.en, lingua: 'en' as const, explicacao: d.explicacao })),
      aleatorio,
    ),
    resposta: { en: frase.en, pt: frase.pt },
  };
}

function ouvirEscolher(ex: Exercicio, frase: FraseGerada, aleatorio: Aleatorio): PerguntaEscolha | null {
  const distratores = gerarDistratores(frase, aleatorio, 2);
  if (distratores.length === 0) return null;
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: 'Qual frase você ouviu?',
    audio: frase.en,
    ...montarOpcoes(
      { texto: frase.en, lingua: 'en' },
      distratores.map((d) => ({ texto: d.en, lingua: 'en' as const, explicacao: d.explicacao })),
      aleatorio,
    ),
    resposta: { en: frase.en, pt: frase.pt },
  };
}

/** Contrações parecidas primeiro (mesma preposição), para a escolha fazer pensar. */
function outrasContracoes(c: Contracao, aleatorio: Aleatorio): Contracao[] {
  const outras = CONTRACOES.filter((o) => o.id !== c.id && !mesmo(o.pt, c.pt));
  return [
    ...embaralhar(outras.filter((o) => o.partes[0] === c.partes[0]), aleatorio),
    ...embaralhar(outras.filter((o) => o.partes[0] !== c.partes[0]), aleatorio),
  ];
}

function enPtContracao(ex: Exercicio, c: Contracao, aleatorio: Aleatorio): PerguntaEscolha | null {
  const achou = acharPalavra(c.exemplo.pt, c.pt);
  if (!achou) return null;
  const erradas = outrasContracoes(c, aleatorio)
    .slice(0, 3)
    .map((o) => ({
      texto: o.pt,
      lingua: 'pt' as const,
      explicacao: `"${o.pt}" é ${o.partes.join(' + ')}. Aqui é ${c.partes.join(' + ')} = "${c.pt}".`,
    }));
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: 'Complete em português',
    en: c.exemplo.en,
    ptComLacuna: [c.exemplo.pt.slice(0, achou.inicio), c.exemplo.pt.slice(achou.fim)],
    ...montarOpcoes({ texto: c.pt, lingua: 'pt' }, erradas, aleatorio),
    resposta: { en: c.exemplo.en, pt: c.exemplo.pt, nota: notaDaContracao(c) },
  };
}

function ptEnContracao(ex: Exercicio, c: Contracao, aleatorio: Aleatorio): PerguntaEscolha {
  const outrosSentidos = [...new Set(CONTRACOES.map((o) => o.en))].filter((en) => en !== c.en);
  const erradas = embaralhar(outrosSentidos, aleatorio)
    .slice(0, 3)
    .map((en) => {
      const donos = CONTRACOES.filter((o) => o.en === en).map((o) => `"${o.pt}"`);
      return {
        texto: en,
        lingua: 'en' as const,
        explicacao: `"${en}" é ${donos.join(', ')}. "${c.pt}" é ${c.partes.join(' + ')} = "${c.en}".`,
      };
    });
  return {
    tipo: 'escolha',
    exercicio: ex,
    enunciado: `Como se diz "${c.pt}" em inglês?`,
    pt: c.exemplo.pt,
    ...montarOpcoes({ texto: c.en, lingua: 'en' }, erradas, aleatorio),
    resposta: { en: c.exemplo.en, pt: c.exemplo.pt, nota: notaDaContracao(c) },
  };
}

// ---------------------------------------------------------------------------
// Ligar pares

function paresDaPalavra(ex: Exercicio, p: Palavra, aleatorio: Aleatorio): PerguntaPares | null {
  const outras = outrasPalavras(p, 4, aleatorio);
  if (outras.length < 2) return null;
  const pares = [p, ...outras].map((w) => ({ id: w.id, en: w.en, pt: w.pt }));
  const ids = pares.map((par) => par.id);
  return {
    tipo: 'pares',
    exercicio: ex,
    enunciado: 'Ligue os pares',
    pares,
    ordemEn: embaralhar(ids, aleatorio),
    ordemPt: embaralhar(ids, aleatorio),
    alvo: p.id,
    resposta: { en: p.en, pt: p.pt },
  };
}

// ---------------------------------------------------------------------------
// Onde está?

function ondeEsta(ex: Exercicio, frase: FraseGerada, aleatorio: Aleatorio): PerguntaOnde | null {
  const certa = frase.preposicao as Posicao | null;
  const molde = MOLDES.find((m) => m.id === frase.moldeId);
  if (!certa || !POSICOES.includes(certa) || !molde) return null;
  const espacoLugar = lugarDoMolde(molde);
  const espacoCoisa = Object.keys(frase.palavras).find((e) => e !== espacoLugar);
  const coisa = espacoCoisa ? palavraPorId(frase.palavras[espacoCoisa]) : undefined;
  const lugar = espacoLugar ? palavraPorId(frase.palavras[espacoLugar]) : undefined;
  if (!coisa || !lugar) return null;

  const fora = new Set<Posicao>([certa, ...(GEMEAS[certa] ? [GEMEAS[certa]] : [])]);
  const vizinhas = (VIZINHAS[certa] ?? []) as Posicao[];
  const candidatas = [
    ...vizinhas,
    ...embaralhar(POSICOES.filter((p) => !vizinhas.includes(p)), aleatorio),
  ];
  const erradas: Posicao[] = [];
  for (const p of candidatas) {
    if (erradas.length >= 3) break;
    if (fora.has(p) || erradas.includes(p)) continue;
    erradas.push(p);
    const gemea = GEMEAS[p];
    if (gemea) fora.add(gemea);
  }
  return {
    tipo: 'onde',
    exercicio: ex,
    enunciado: 'Onde está?',
    en: frase.en,
    coisa: coisa.en,
    lugar: lugar.en,
    opcoes: embaralhar([certa, ...erradas], aleatorio),
    certa,
    resposta: { en: frase.en, pt: frase.pt },
  };
}

// ---------------------------------------------------------------------------
// Completar a frase

interface Vao {
  inicio: number;
  fim: number;
  lacuna: Lacuna;
}

function proximaPalavra(texto: string, depoisDe: number): string {
  return texto.slice(depoisDe).match(/^\s+([A-Za-z']+)/)?.[1] ?? '';
}

function explicarArtigo(certa: string, escolhida: string, substantivo: string): string {
  const sub = substantivo.toLowerCase();
  const palavra = PALAVRAS.find((p) => p.en === sub || p.plural === sub);
  const indefinida = (a: string) => a === 'a' || a === 'an';
  if (certa === 'a' && escolhida === 'an') return `"${sub}" começa com som de consoante, então é "a ${sub}".`;
  if (certa === 'an' && escolhida === 'a') return `"${sub}" começa com som de vogal, então é "an ${sub}".`;
  if (indefinida(certa)) return `"the" é "o/a". Em português está "um/uma", então é "${certa}".`;
  if (palavra && palavra.artigo === null) return `"${sub}" não se conta: não leva "a" nem "an". Aqui é "the".`;
  if (palavra && palavra.plural === sub && palavra.plural !== palavra.en) {
    return `"${sub}" está no plural, e "a/an" é para uma coisa só. Aqui é "the".`;
  }
  return '"a" e "an" são "um/uma". Em português está "o/a", então é "the".';
}

function lacunaDeArtigo(frase: string, inicio: number, fim: number): Lacuna {
  const certa = frase.slice(inicio, fim).toLowerCase();
  const substantivo = proximaPalavra(frase, fim);
  const opcoes = ['a', 'an', 'the'];
  return {
    certa,
    opcoes,
    explicacoes: Object.fromEntries(opcoes.filter((o) => o !== certa).map((o) => [o, explicarArtigo(certa, o, substantivo)])),
    maiuscula: inicio === 0,
  };
}

function lacunaDePreposicao(certa: string, inicio: number, molde: Molde | undefined, aleatorio: Aleatorio): Lacuna | null {
  const prep = PREPOSICOES.find((p) => p.en === certa);
  if (!prep) return null;
  const gemea = GEMEAS[certa as Posicao];
  const candidatas = [
    ...(VIZINHAS[certa] ?? []),
    ...embaralhar([...(molde?.preposicoes ?? []), ...PREPOSICOES.map((p) => p.en)], aleatorio),
  ]
    .filter((en, i, lista) => lista.indexOf(en) === i && en !== certa && en !== gemea)
    .filter((en) => PREPOSICOES.find((p) => p.en === en)?.pt !== prep.pt)
    .slice(0, 2);
  if (candidatas.length === 0) return null;
  return {
    certa,
    opcoes: embaralhar([certa, ...candidatas], aleatorio),
    explicacoes: Object.fromEntries(
      candidatas.map((o) => [
        o,
        `"${certa}" é "${SENTIDO_PREPOSICAO[certa]}"; "${o}" seria "${SENTIDO_PREPOSICAO[o]}".`,
      ]),
    ),
    maiuscula: inicio === 0,
  };
}

function lacunaDePalavra(frase: string, alvo: Palavra, aleatorio: Aleatorio): Vao | null {
  const formas = [alvo.plural, alvo.en].filter((f): f is string => Boolean(f));
  for (const forma of formas) {
    const achou = acharPalavra(frase, forma);
    if (!achou) continue;
    const plural = forma === alvo.plural && alvo.plural !== alvo.en;
    const outras = outrasPalavras(alvo, 6, aleatorio)
      .filter((o) => !plural || o.plural)
      .slice(0, 2);
    if (outras.length === 0) return null;
    const certa = forma.toLowerCase();
    const textoDe = (o: Palavra) => (plural ? (o.plural as string) : o.en);
    return {
      ...achou,
      lacuna: {
        certa,
        opcoes: embaralhar([certa, ...outras.map(textoDe)], aleatorio),
        explicacoes: Object.fromEntries(
          outras.map((o) => [textoDe(o), `"${textoDe(o)}" é "${plural ? o.pluralPt : o.pt}". Aqui é "${certa}".`]),
        ),
        maiuscula: achou.inicio === 0,
      },
    };
  }
  return null;
}

function trechosDe(frase: string, vaos: Vao[]): { trechos: Trecho[]; lacunas: Lacuna[] } {
  const ordenados = [...vaos].sort((a, b) => a.inicio - b.inicio);
  const trechos: Trecho[] = [];
  let pos = 0;
  ordenados.forEach((v, i) => {
    if (v.inicio > pos) trechos.push({ tipo: 'texto', texto: frase.slice(pos, v.inicio) });
    trechos.push({ tipo: 'lacuna', indice: i });
    pos = v.fim;
  });
  if (pos < frase.length) trechos.push({ tipo: 'texto', texto: frase.slice(pos) });
  return { trechos, lacunas: ordenados.map((v) => v.lacuna) };
}

/**
 * Lacunas de uma frase: a preposição (se tiver) e um artigo; sem preposição, até dois artigos.
 * Para uma palavra, o artigo escolhido é o dela; sem artigo nem preposição, a lacuna é a própria palavra.
 */
function completarFrase(ex: Exercicio, frase: FraseGerada, alvo: Palavra | null, aleatorio: Aleatorio): PerguntaCompletar | null {
  const en = frase.en;
  const molde = MOLDES.find((m) => m.id === frase.moldeId);
  const vaos: Vao[] = [];

  let prepVao: { inicio: number; fim: number } | null = null;
  if (frase.preposicao) {
    const achou = acharPalavra(en, frase.preposicao);
    const lacuna = achou ? lacunaDePreposicao(frase.preposicao, achou.inicio, molde, aleatorio) : null;
    if (achou && lacuna) {
      prepVao = achou;
      vaos.push({ ...achou, lacuna });
    }
  }

  const artigos = [...en.matchAll(/\b(a|an|the)\b/gi)]
    .map((m) => ({ inicio: m.index, fim: m.index + m[0].length }))
    .filter((a) => !prepVao || a.fim <= prepVao.inicio || a.inicio >= prepVao.fim);

  let escolhidos = artigos;
  if (alvo) {
    const formas = [alvo.en, alvo.plural].filter((f): f is string => Boolean(f)).map((f) => f.toLowerCase());
    const doAlvo = artigos.filter((a) => formas.includes(proximaPalavra(en, a.fim).toLowerCase()));
    escolhidos = doAlvo.length > 0 ? doAlvo : artigos;
  }
  const quantos = prepVao ? 1 : 2;
  for (const a of escolhidos.slice(0, quantos)) vaos.push({ ...a, lacuna: lacunaDeArtigo(en, a.inicio, a.fim) });

  if (vaos.length === 0 && alvo) {
    const vao = lacunaDePalavra(en, alvo, aleatorio);
    if (vao) vaos.push(vao);
  }
  if (vaos.length === 0) return null;

  return {
    tipo: 'completar',
    exercicio: ex,
    enunciado: 'Complete a frase',
    ...trechosDe(en, vaos),
    pt: frase.pt,
    resposta: { en: frase.en, pt: frase.pt },
  };
}

function completarContracao(ex: Exercicio, c: Contracao, aleatorio: Aleatorio): PerguntaCompletar | null {
  const trecho = trechoDaContracao(c);
  const achou = trecho ? acharPalavra(c.exemplo.en, trecho) : null;
  if (!trecho || !achou) return null;
  const irmas = c.en.split(' / ').filter((t) => t !== trecho);
  const todas = [...new Set(CONTRACOES.flatMap((o) => o.en.split(' / ')))];
  const erradas = [...irmas, ...embaralhar(todas.filter((t) => t !== trecho && !irmas.includes(t)), aleatorio)].slice(0, 3);
  const explicacao = `Aqui "${c.pt}" é ${c.partes.join(' + ')} = "${trecho}".`;
  return {
    tipo: 'completar',
    exercicio: ex,
    enunciado: 'Complete a frase',
    ...trechosDe(c.exemplo.en, [
      {
        ...achou,
        lacuna: {
          certa: trecho,
          opcoes: embaralhar([trecho, ...erradas], aleatorio),
          explicacoes: Object.fromEntries(erradas.map((e) => [e, explicacao])),
          maiuscula: achou.inicio === 0,
        },
      },
    ]),
    pt: c.exemplo.pt,
    resposta: { en: c.exemplo.en, pt: c.exemplo.pt, nota: c.nota ?? notaDaContracao(c) },
  };
}

// ---------------------------------------------------------------------------
// Entrada

function paraPalavra(ex: Exercicio, p: Palavra, aleatorio: Aleatorio): Pergunta {
  const frase = () => ex.frase ?? gerarFraseComPalavra(p.id, aleatorio, { limite: 8 }) ?? fraseDoExemplo(p);
  switch (ex.joguinho) {
    case 'card-novo':
      return { tipo: 'card', exercicio: ex, enunciado: 'Palavra nova', resposta: { en: p.en, pt: p.pt }, card: { tipo: 'palavra', palavraId: p.id } };
    case 'en-pt':
      return enPtPalavra(ex, p, aleatorio);
    case 'pares':
      return paresDaPalavra(ex, p, aleatorio) ?? enPtPalavra(ex, p, aleatorio);
    case 'completar':
      return completarFrase(ex, frase(), p, aleatorio) ?? ptEnPalavra(ex, p, aleatorio);
    case 'ouvir-escolher':
      return ouvirEscolher(ex, frase(), aleatorio) ?? ptEnPalavra(ex, p, aleatorio);
    default:
      return ptEnPalavra(ex, p, aleatorio);
  }
}

function paraMolde(ex: Exercicio, molde: Molde, aleatorio: Aleatorio): Pergunta {
  if (ex.joguinho === 'card-novo') return cardDoMolde(ex, molde, aleatorio);
  const frase = ex.frase ?? gerarFrase(molde, aleatorio);
  if (!frase) return cardDoMolde(ex, molde, aleatorio);
  const enPt = () => enPtFrase(ex, frase, aleatorio);
  const completar = () => completarFrase(ex, frase, null, aleatorio);
  const ptEn = () => ptEnFrase(ex, frase, aleatorio);
  const tentativas: Record<string, (() => Pergunta | null)[]> = {
    'en-pt': [enPt, completar, ptEn],
    'onde-esta': [() => ondeEsta(ex, frase, aleatorio), enPt, completar],
    completar: [completar, enPt, ptEn],
    'ouvir-escolher': [() => ouvirEscolher(ex, frase, aleatorio), completar, enPt],
    'pt-en': [ptEn, enPt, completar],
  };
  for (const tentar of tentativas[ex.joguinho] ?? [completar, enPt, ptEn]) {
    const pergunta = tentar();
    if (pergunta) return pergunta;
  }
  return cardDoMolde(ex, molde, aleatorio);
}

function paraContracao(ex: Exercicio, c: Contracao, aleatorio: Aleatorio): Pergunta {
  switch (ex.joguinho) {
    case 'card-novo':
      return {
        tipo: 'card',
        exercicio: ex,
        enunciado: 'Contração nova',
        resposta: { en: c.exemplo.en, pt: c.exemplo.pt },
        card: { tipo: 'contracao', contracaoId: c.id, trechoEn: trechoDaContracao(c) ?? c.en },
      };
    case 'pt-en':
      return ptEnContracao(ex, c, aleatorio);
    case 'completar':
      return completarContracao(ex, c, aleatorio) ?? enPtContracao(ex, c, aleatorio) ?? ptEnContracao(ex, c, aleatorio);
    default:
      return enPtContracao(ex, c, aleatorio) ?? ptEnContracao(ex, c, aleatorio);
  }
}

/** Pergunta de um exercício. Null só se o item saiu do conteúdo. */
export function prepararPergunta(ex: Exercicio, aleatorio: Aleatorio): Pergunta | null {
  const { tipo, id } = separarId(ex.itemId);
  if (tipo === 'palavra') {
    const p = palavraPorId(id);
    return p ? paraPalavra(ex, p, aleatorio) : null;
  }
  if (tipo === 'molde') {
    const molde = MOLDES.find((m) => m.id === id);
    return molde ? paraMolde(ex, molde, aleatorio) : null;
  }
  const c = CONTRACOES.find((x) => x.id === id);
  return c ? paraContracao(ex, c, aleatorio) : null;
}

/** Mesma pergunta com as opções em outra ordem, para quando ela volta no fim da lição. */
export function reembaralhar(p: Pergunta, aleatorio: Aleatorio): Pergunta {
  switch (p.tipo) {
    case 'escolha':
      return { ...p, opcoes: embaralhar(p.opcoes, aleatorio) };
    case 'onde':
      return { ...p, opcoes: embaralhar(p.opcoes, aleatorio) };
    case 'pares':
      return { ...p, ordemEn: embaralhar(p.ordemEn, aleatorio), ordemPt: embaralhar(p.ordemPt, aleatorio) };
    default:
      return p;
  }
}

/** Um exercício de cada joguinho pronto, para conferir todos de uma vez (Área de teste). */
export function exerciciosDaGaleria(aleatorio: Aleatorio): Exercicio[] {
  const molde = (id: string) => MOLDES.find((m) => m.id === id) as Molde;
  const ex = (itemId: string, joguinho: Joguinho, frase: FraseGerada | null = null): Exercicio => ({
    itemId,
    tipoItem: separarId(itemId).tipo,
    joguinho,
    degrau: joguinho === 'card-novo' ? 0 : 1,
    desafio: false,
    frase,
  });
  const fraseMolde = (id: string) => gerarFrase(molde(id), aleatorio);
  return [
    ex('apple', 'card-novo'),
    ex('apple', 'en-pt'),
    ex('apple', 'pares'),
    ex(idDoItem('molde', 'coisa-prep-um'), 'card-novo'),
    ex(idDoItem('molde', 'o-esta-prep-o'), 'onde-esta', fraseMolde('o-esta-prep-o')),
    ex(idDoItem('molde', 'isto-e'), 'en-pt', fraseMolde('isto-e')),
    ex('table', 'pt-en'),
    ex('book', 'completar', gerarFraseComPalavra('book', aleatorio, { limite: 9 })),
    ex(idDoItem('molde', 'tem-um-prep-o'), 'completar', fraseMolde('tem-um-prep-o')),
    ex(idDoItem('molde', 'coisa-prep-um'), 'ouvir-escolher', fraseMolde('coisa-prep-um')),
    ex(idDoItem('contracao', 'naquele'), 'card-novo'),
    ex(idDoItem('contracao', 'no'), 'en-pt'),
    ex(idDoItem('contracao', 'na'), 'pt-en'),
    ex(idDoItem('contracao', 'num'), 'completar'),
  ];
}
