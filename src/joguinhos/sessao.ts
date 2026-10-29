/**
 * Sessão de uma lição: monta a lição pelo motor com o progresso salvo,
 * prepara as perguntas e, no fim, resume o resultado.
 */
import { UNIDADES, palavraPorId } from '@/conteudo';
import type { Unidade } from '@/conteudo/tipos';
import { criarAleatorio } from '@/gerador/aleatorio';
import { itensDaUnidade } from '@/motor/itens';
import { montarLicao } from '@/motor/licao';
import { xpDaLicao, type XpDaLicao } from '@/motor/xp';
import { useProgresso } from '@/store/progresso';
import { diaLocal } from '@/util/datas';

import type { EstadoFila } from './fila';
import { JOGUINHOS_PRONTOS, exerciciosDaGaleria, prepararPergunta } from './preparar';
import type { Pergunta } from './tipos';

/** Lição especial com um exercício de cada joguinho, que não salva nada. */
export const ID_GALERIA = 'galeria';

export interface Sessao {
  licaoId: string;
  titulo: string;
  hoje: string;
  /** Falso na galeria: as respostas não mexem no progresso. */
  salvar: boolean;
  perguntas: Pergunta[];
  /** Itens apresentados pela primeira vez nesta lição. */
  novos: string[];
  /** Limite de palavras por frase que o ajuste calculou (para salvar no perfil). */
  limiteFrase: number | null;
}

export function unidadeDaPalavra(palavraId: string): Unidade | undefined {
  const p = palavraPorId(palavraId);
  return p ? UNIDADES.find((u) => u.tipo === 'tema' && u.alvo === p.tema) : undefined;
}

function preparar(exercicios: Parameters<typeof prepararPergunta>[0][], semente: number): Pergunta[] {
  const aleatorio = criarAleatorio(semente + 1);
  return exercicios.map((e) => prepararPergunta(e, aleatorio)).filter((p): p is Pergunta => p !== null);
}

/** Monta a sessão de uma unidade (ou da galeria). Null se a unidade não existe. */
export function criarSessao(id: string, opcoes: { foco?: string; semente?: number } = {}): Sessao | null {
  const semente = opcoes.semente ?? Math.floor(Math.random() * 2 ** 31);
  const hoje = diaLocal();

  if (id === ID_GALERIA) {
    return {
      licaoId: `${ID_GALERIA}-${semente}`,
      titulo: 'Todos os joguinhos',
      hoje,
      salvar: false,
      perguntas: preparar(exerciciosDaGaleria(criarAleatorio(semente)), semente),
      novos: [],
      limiteFrase: null,
    };
  }

  const unidade = UNIDADES.find((u) => u.id === id);
  if (!unidade) return null;
  const { itens, historico, perfil } = useProgresso.getState();
  const licaoId = `${unidade.id}-${semente}`;
  const licao = montarLicao({
    pool: itensDaUnidade(unidade),
    itens,
    historico,
    limiteFrase: perfil.limiteFrase,
    hoje,
    licaoId,
    semente,
    foco: opcoes.foco,
    disponiveis: JOGUINHOS_PRONTOS,
  });
  return {
    licaoId,
    titulo: unidade.titulo,
    hoje,
    salvar: true,
    perguntas: preparar(licao.exercicios, semente),
    novos: licao.novos,
    limiteFrase: licao.ajuste.limiteFrase,
  };
}

export interface ResultadoLicao {
  xp: XpDaLicao;
  /** Exercícios que contam (sem os cards). */
  exercicios: number;
  acertosDePrimeira: number;
  novos: string[];
}

export function resumirSessao(sessao: Sessao, fila: EstadoFila): ResultadoLicao {
  const respostas = sessao.perguntas
    .map((p, i) => ({ p, primeira: fila.primeira[i] }))
    .filter(({ p }) => p.tipo !== 'card')
    .map(({ p, primeira }) => ({ acertou: primeira === true, desafio: p.exercicio.desafio }));
  return {
    xp: xpDaLicao(respostas),
    exercicios: respostas.length,
    acertosDePrimeira: respostas.filter((r) => r.acertou).length,
    novos: sessao.novos,
  };
}
