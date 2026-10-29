/**
 * Qual palavra vai para a tela de bloqueio em cada troca.
 * - 1 troca a cada 3 traz uma palavra nova (a próxima ainda não vista, na ordem do conteúdo).
 * - As outras trazem revisão: uma das 5 palavras vistas mais urgentes.
 *
 * A escolha de cada troca é guardada, para que o app, a tarefa de fundo e a
 * notificação agendada mostrem sempre a mesma palavra para a mesma troca.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PALAVRAS, palavraPorId } from '@/conteudo';
import type { Palavra } from '@/conteudo/tipos';
import type { ItemProgresso } from '@/store/tipos';

export const CHAVE_DECISOES = 'bimec-palavras-decididas';
export const NOVA_A_CADA = 3;
/** Quantas trocas ficam guardadas. */
const MEMORIA = 40;

export interface Decisoes {
  config: string;
  porTroca: Record<string, string>;
}

function urgencia(itens: Record<string, ItemProgresso>, p: Palavra): string {
  const item = itens[p.id];
  return item?.proximaRevisao ?? item?.vistoEm ?? '0000-00-00';
}

/** Escolha pura: não lê nem grava nada. */
export function escolherPalavraDaTroca(
  numero: number,
  itens: Record<string, ItemProgresso>,
  palavras: Palavra[] = PALAVRAS,
  jaDecididas: ReadonlySet<string> = new Set(),
  anterior?: string,
): Palavra {
  const vista = (p: Palavra) => (itens[p.id]?.vistoEm ?? null) !== null || jaDecididas.has(p.id);
  const novas = palavras.filter((p) => !vista(p));
  const vistas = palavras.filter(vista);
  const vezDeNova = ((numero % NOVA_A_CADA) + NOVA_A_CADA) % NOVA_A_CADA === 0;

  if ((vezDeNova || vistas.length === 0) && novas.length > 0) return novas[0];

  const candidatas = vistas
    .filter((p) => p.id !== anterior)
    .sort((a, b) => {
      const ua = urgencia(itens, a);
      const ub = urgencia(itens, b);
      if (ua !== ub) return ua < ub ? -1 : 1;
      return (itens[a.id]?.degrau ?? 0) - (itens[b.id]?.degrau ?? 0);
    })
    .slice(0, 5);
  if (candidatas.length === 0) return novas[0] ?? palavras[0];
  return candidatas[((numero % candidatas.length) + candidatas.length) % candidatas.length];
}

export async function lerDecisoes(config: string): Promise<Decisoes> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_DECISOES);
    const salvo = bruto ? (JSON.parse(bruto) as Decisoes) : null;
    if (salvo && salvo.config === config && salvo.porTroca) return salvo;
  } catch {
    // Arquivo corrompido: começa do zero.
  }
  return { config, porTroca: {} };
}

/**
 * Palavra de uma troca. Se já foi decidida, devolve a mesma; senão decide agora e guarda.
 * `obterItens` só é chamado quando precisa decidir.
 */
export async function palavraDecidida(
  numero: number,
  config: string,
  obterItens: () => Record<string, ItemProgresso> | Promise<Record<string, ItemProgresso>>,
): Promise<Palavra> {
  const decisoes = await lerDecisoes(config);
  const ja = decisoes.porTroca[String(numero)];
  const jaPalavra = ja ? palavraPorId(ja) : undefined;
  if (jaPalavra) return jaPalavra;

  const itens = await obterItens();
  const decididas = new Set(Object.values(decisoes.porTroca));
  const palavra = escolherPalavraDaTroca(numero, itens, PALAVRAS, decididas, decisoes.porTroca[String(numero - 1)]);

  const porTroca = { ...decisoes.porTroca, [String(numero)]: palavra.id };
  const guardadas = Object.keys(porTroca)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, MEMORIA);
  const enxuto = Object.fromEntries(guardadas.map((n) => [String(n), porTroca[String(n)]]));
  await AsyncStorage.setItem(CHAVE_DECISOES, JSON.stringify({ config, porTroca: enxuto }));
  return palavra;
}
