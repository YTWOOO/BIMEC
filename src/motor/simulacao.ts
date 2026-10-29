/**
 * Simulação de uso: um aluno fictício faz uma lição por dia.
 * Serve para conferir se o motor se comporta como o plano descreve
 * (novos entrando, degraus subindo, acerto perto de 80%).
 */
import { criarAleatorio } from '@/gerador/aleatorio';
import type { ItemProgresso, Resposta } from '@/store/tipos';
import { somarDias } from '@/util/datas';

import { LIMITE_FRASE_INICIAL, type Faixa } from './ajuste';
import { todosOsItens, type ItemDaLicao } from './itens';
import { montarLicao, type Licao } from './licao';
import { apresentar, novoItem, registrarResposta } from './srs';

export interface ResumoDia {
  dia: number;
  data: string;
  exercicios: number;
  respostas: number;
  acertos: number;
  novos: number;
  revisoes: number;
  faixa: Faixa;
  limiteFrase: number;
}

export interface ResultadoSimulacao {
  dias: ResumoDia[];
  licoes: Licao[];
  itens: Record<string, ItemProgresso>;
  historico: Resposta[];
}

export interface OpcoesSimulacao {
  dias?: number;
  semente?: number;
  pool?: ItemDaLicao[];
  /** Chance base de acertar um exercício do degrau 1. */
  habilidade?: number;
  inicio?: string;
}

export function simular(opcoes: OpcoesSimulacao = {}): ResultadoSimulacao {
  const dias = opcoes.dias ?? 30;
  const semente = opcoes.semente ?? 1;
  const pool = opcoes.pool ?? todosOsItens();
  const habilidade = opcoes.habilidade ?? 0.9;
  const inicio = opcoes.inicio ?? '2026-11-01';
  const aleatorio = criarAleatorio(semente);

  const itens: Record<string, ItemProgresso> = {};
  const historico: Resposta[] = [];
  const resumo: ResumoDia[] = [];
  const licoes: Licao[] = [];
  let limiteFrase = LIMITE_FRASE_INICIAL;

  for (let d = 0; d < dias; d++) {
    const hoje = somarDias(inicio, d);
    const licao = montarLicao({
      pool,
      itens,
      historico,
      limiteFrase,
      hoje,
      licaoId: `sim-${d}`,
      semente: semente * 1000 + d,
    });
    licoes.push(licao);
    limiteFrase = licao.ajuste.limiteFrase;

    let respostas = 0;
    let acertos = 0;
    for (const ex of licao.exercicios) {
      const atual = itens[ex.itemId] ?? novoItem(ex.itemId, ex.tipoItem);
      if (ex.joguinho === 'card-novo') {
        itens[ex.itemId] = apresentar(atual, hoje);
        continue;
      }
      // Quanto mais alto o degrau, mais difícil; quanto mais o item foi praticado, mais fácil.
      const chance = Math.min(
        0.97,
        Math.max(0.35, habilidade - 0.08 * (ex.degrau - 1) + 0.03 * Math.min(atual.acertos, 6) - (ex.desafio ? 0.08 : 0)),
      );
      const acertou = aleatorio() < chance;
      const ms = acertou ? 2500 + aleatorio() * 6000 : 9000;
      itens[ex.itemId] = registrarResposta(atual, { acertou, ms, usouDica: false, licaoId: licao.id, hoje });
      historico.push({ itemId: ex.itemId, joguinho: ex.joguinho, acertou, ms, data: hoje });
      respostas++;
      if (acertou) acertos++;
    }

    resumo.push({
      dia: d + 1,
      data: hoje,
      exercicios: licao.exercicios.length,
      respostas,
      acertos,
      novos: licao.novos.length,
      revisoes: licao.revisoes.length,
      faixa: licao.ajuste.faixa,
      limiteFrase: licao.ajuste.limiteFrase,
    });
  }

  return { dias: resumo, licoes, itens, historico };
}
