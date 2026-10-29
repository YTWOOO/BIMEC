/**
 * Montagem de uma lição de 12 exercícios:
 * 1. Até 6 itens vencidos para revisão, os mais atrasados primeiro.
 * 2. Itens em progresso (degraus 1 a 4) até completar o espaço.
 * 3. Itens novos conforme o ajuste (cada novo ocupa 2 passos: card + exercício).
 * 4. Cada exercício usa um joguinho do degrau do item; alguns vêm um degrau acima, como desafio.
 * 5. O mesmo joguinho nunca aparece 3 vezes seguidas.
 */
import { MOLDES, PALAVRAS } from '@/conteudo';
import { criarAleatorio, type Aleatorio } from '@/gerador/aleatorio';
import { fraseDoExemplo, gerarFrase, gerarFraseComPalavra, type FraseGerada } from '@/gerador/frases';
import type { ItemProgresso, TipoItem } from '@/store/tipos';

import { calcularAjuste, type Ajuste } from './ajuste';
import { estruturaDoItem, separarId, type ItemDaLicao } from './itens';
import { escolherJoguinho, precisaFrase, type Joguinho } from './joguinhos';
import { DEGRAU_MAX, estaVencido } from './srs';

export const TAMANHO_LICAO = 12;
export const MAX_REVISOES = 6;
/** Uma lição precisa de pelo menos tantos itens diferentes, senão fica repetitiva. */
export const MIN_ITENS = 4;

export interface Exercicio {
  itemId: string;
  tipoItem: TipoItem;
  joguinho: Joguinho;
  /** Degrau do joguinho (o do item, ou um acima quando é desafio). */
  degrau: number;
  desafio: boolean;
  /** Frase usada pelo joguinho, quando ele precisa de uma. */
  frase: FraseGerada | null;
}

export interface Licao {
  id: string;
  exercicios: Exercicio[];
  ajuste: Ajuste;
  /** Itens apresentados pela primeira vez nesta lição. */
  novos: string[];
  /** Itens que entraram por estarem vencidos. */
  revisoes: string[];
}

export interface OpcoesLicao {
  /** Itens que podem entrar (de uma unidade, ou todos). */
  pool: ItemDaLicao[];
  itens: Record<string, ItemProgresso>;
  historico: readonly { acertou: boolean }[];
  limiteFrase: number;
  hoje: string;
  licaoId: string;
  semente: number;
}

interface Passo {
  item: ItemDaLicao;
  card: boolean;
  novo: boolean;
}

function degrauDe(itens: Record<string, ItemProgresso>, id: string): number {
  return itens[id]?.degrau ?? 0;
}

/** Ordena por data de revisão (mais atrasada primeiro) e depois pelo degrau mais baixo. */
function porUrgencia(itens: Record<string, ItemProgresso>) {
  return (a: ItemDaLicao, b: ItemDaLicao) => {
    const ra = itens[a.id]?.proximaRevisao ?? '9999-12-31';
    const rb = itens[b.id]?.proximaRevisao ?? '9999-12-31';
    if (ra !== rb) return ra < rb ? -1 : 1;
    return degrauDe(itens, a.id) - degrauDe(itens, b.id);
  };
}

function fraseDoExercicio(item: ItemDaLicao, joguinho: Joguinho, limite: number, aleatorio: Aleatorio): FraseGerada | null {
  if (!precisaFrase(joguinho, item.tipo)) return null;
  const { id } = separarId(item.id);
  const semLimite = joguinho === 'frases-longas';

  if (item.tipo === 'molde') {
    const molde = MOLDES.find((m) => m.id === id);
    if (!molde) return null;
    let melhor: FraseGerada | null = null;
    for (let i = 0; i < 6; i++) {
      const frase = gerarFrase(molde, aleatorio);
      if (!frase) continue;
      if (semLimite) {
        if (!melhor || frase.blocosEn.length > melhor.blocosEn.length) melhor = frase;
      } else if (frase.blocosEn.length <= limite) {
        return frase;
      } else if (!melhor || frase.blocosEn.length < melhor.blocosEn.length) {
        melhor = frase;
      }
    }
    return melhor;
  }

  const palavra = PALAVRAS.find((p) => p.id === id);
  if (!palavra) return null;
  return gerarFraseComPalavra(id, aleatorio, { limite: semLimite ? undefined : limite }) ?? fraseDoExemplo(palavra);
}

/** O card de cada item vem antes de qualquer exercício dele. */
function cardsAntes(lista: Exercicio[]): boolean {
  const vistos = new Set<string>();
  const comCard = new Set(lista.filter((e) => e.joguinho === 'card-novo').map((e) => e.itemId));
  for (const e of lista) {
    if (e.joguinho === 'card-novo') vistos.add(e.itemId);
    else if (comCard.has(e.itemId) && !vistos.has(e.itemId)) return false;
  }
  return true;
}

function ehTripla(lista: Exercicio[], i: number): boolean {
  return i >= 2 && lista[i].joguinho === lista[i - 1].joguinho && lista[i - 1].joguinho === lista[i - 2].joguinho;
}

/**
 * Quando um degrau só tem um joguinho possível, a escolha sozinha não evita três iguais seguidos.
 * Aqui o terceiro troca de lugar com um exercício mais à frente, sem tirar o card da frente do item.
 */
function evitarTriplas(exercicios: Exercicio[]): Exercicio[] {
  const lista = [...exercicios];
  for (let i = 2; i < lista.length; i++) {
    if (!ehTripla(lista, i)) continue;
    for (let j = i + 1; j < lista.length; j++) {
      if (lista[j].joguinho === lista[i].joguinho) continue;
      const tentativa = [...lista];
      [tentativa[i], tentativa[j]] = [tentativa[j], tentativa[i]];
      const semTriplaNova = !tentativa.some((_, k) => ehTripla(tentativa, k) && k <= j && k !== i);
      if (cardsAntes(tentativa) && semTriplaNova) {
        lista.splice(0, lista.length, ...tentativa);
        break;
      }
    }
  }
  return lista;
}

export function montarLicao(opcoes: OpcoesLicao): Licao {
  const { pool, itens, hoje } = opcoes;
  const aleatorio = criarAleatorio(opcoes.semente);
  const ajuste = calcularAjuste(opcoes.historico, opcoes.limiteFrase);

  const comecados = pool.filter((i) => degrauDe(itens, i.id) >= 1);
  const naoComecados = pool.filter((i) => degrauDe(itens, i.id) === 0);

  const vencidos = comecados
    .filter((i) => estaVencido(itens[i.id], hoje))
    .sort(porUrgencia(itens))
    .slice(0, MAX_REVISOES);
  const idsVencidos = new Set(vencidos.map((i) => i.id));
  const emProgresso = comecados
    .filter((i) => !idsVencidos.has(i.id) && degrauDe(itens, i.id) < DEGRAU_MAX)
    .sort(porUrgencia(itens));
  const dominados = comecados
    .filter((i) => !idsVencidos.has(i.id) && degrauDe(itens, i.id) >= DEGRAU_MAX)
    .sort(porUrgencia(itens));

  let conhecidos = [...vencidos, ...emProgresso];

  let quantosNovos = ajuste.novosPorLicao;
  if (conhecidos.length + quantosNovos < MIN_ITENS) quantosNovos = MIN_ITENS - conhecidos.length;
  const novos = naoComecados.slice(0, quantosNovos);

  // Sem itens suficientes, entram os já dominados, como manutenção.
  if (conhecidos.length + novos.length < MIN_ITENS) {
    conhecidos = [...conhecidos, ...dominados.slice(0, MIN_ITENS - conhecidos.length - novos.length)];
  }

  const espacoConhecidos = Math.max(0, TAMANHO_LICAO - 2 * novos.length);
  const conhecidosUsados = conhecidos.slice(0, espacoConhecidos);

  // Ordem: um conhecido para aquecer, depois cada novo (card + exercício) seguido de dois conhecidos.
  const passos: Passo[] = [];
  let k = 0;
  if (conhecidosUsados.length > 0) passos.push({ item: conhecidosUsados[k++], card: false, novo: false });
  for (const n of novos) {
    passos.push({ item: n, card: true, novo: true }, { item: n, card: false, novo: true });
    for (let j = 0; j < 2 && k < conhecidosUsados.length; j++) {
      passos.push({ item: conhecidosUsados[k++], card: false, novo: false });
    }
  }
  while (k < conhecidosUsados.length) passos.push({ item: conhecidosUsados[k++], card: false, novo: false });

  // Completa até 12 com exercícios a mais dos mesmos itens, sem repetir o item seguido.
  const participantes = [...novos.map((i) => ({ item: i, novo: true })), ...conhecidosUsados.map((i) => ({ item: i, novo: false }))];
  let volta = 0;
  while (passos.length < TAMANHO_LICAO && participantes.length > 0) {
    const p = participantes[volta % participantes.length];
    volta++;
    if (participantes.length > 1 && passos.at(-1)?.item.id === p.item.id) continue;
    passos.push({ item: p.item, card: false, novo: p.novo });
  }

  // Joguinho, desafio e frase de cada passo.
  const exercicios: Exercicio[] = [];
  const ultimos: Joguinho[] = [];
  const usadosPorItem = new Map<string, Joguinho[]>();
  let contadorDesafio = 0;

  for (const passo of passos.slice(0, TAMANHO_LICAO)) {
    const { item } = passo;
    let degrau: number;
    let desafio = false;
    if (passo.card) {
      degrau = 0;
    } else if (passo.novo) {
      degrau = 1;
    } else {
      degrau = Math.max(1, degrauDe(itens, item.id));
      contadorDesafio++;
      if (contadorDesafio % ajuste.desafioACada === 0 && degrau < DEGRAU_MAX) {
        degrau += 1;
        desafio = true;
      }
    }

    const joguinho = escolherJoguinho(
      item.tipo,
      degrau,
      aleatorio,
      ultimos,
      usadosPorItem.get(item.id) ?? [],
      estruturaDoItem(item.id),
    );
    ultimos.push(joguinho);
    usadosPorItem.set(item.id, [...(usadosPorItem.get(item.id) ?? []), joguinho]);

    exercicios.push({
      itemId: item.id,
      tipoItem: item.tipo,
      joguinho,
      degrau,
      desafio,
      frase: fraseDoExercicio(item, joguinho, ajuste.limiteFrase, aleatorio),
    });
  }

  return {
    id: opcoes.licaoId,
    exercicios: evitarTriplas(exercicios),
    ajuste,
    novos: novos.map((i) => i.id),
    revisoes: vencidos.filter((i) => conhecidosUsados.includes(i)).map((i) => i.id),
  };
}
