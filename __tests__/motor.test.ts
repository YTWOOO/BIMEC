import { beforeEach, describe, expect, it } from '@jest/globals';

import { UNIDADES } from '@/conteudo';
import { calcularAjuste } from '@/motor/ajuste';
import { idDoItem, itensDaUnidade, separarId, todosOsItens } from '@/motor/itens';
import { joguinhosPossiveis, precisaFrase } from '@/motor/joguinhos';
import { MAX_REVISOES, TAMANHO_LICAO, montarLicao } from '@/motor/licao';
import { simular } from '@/motor/simulacao';
import {
  FACILIDADE_MAX,
  FACILIDADE_MIN,
  INTERVALO_MAX,
  apresentar,
  estaVencido,
  facilDemais,
  novoItem,
  proximoIntervalo,
  registrarResposta,
  type DadosResposta,
} from '@/motor/srs';
import { useProgresso } from '@/store/progresso';
import type { ItemProgresso } from '@/store/tipos';

const HOJE = '2026-11-01';

function responder(item: ItemProgresso, acertou: boolean, licaoId: string, extra: Partial<DadosResposta> = {}) {
  return registrarResposta(item, { acertou, ms: 3000, usouDica: false, licaoId, hoje: HOJE, ...extra });
}

describe('srs: subir e descer', () => {
  const base = apresentar(novoItem('apple', 'palavra'), HOJE);

  it('o card leva do degrau 0 ao 1 e deixa o item para hoje', () => {
    expect(base.degrau).toBe(1);
    expect(base.vistoEm).toBe(HOJE);
    expect(estaVencido(base, HOJE)).toBe(true);
  });

  it('sobe com 2 acertos seguidos em lições diferentes', () => {
    const a = responder(base, true, 'L1');
    expect(a.degrau).toBe(1);
    expect(a.acertosSeguidos).toBe(1);
    const b = responder(a, true, 'L2');
    expect(b.degrau).toBe(2);
    expect(b.acertosSeguidos).toBe(0);
  });

  it('dois acertos na mesma lição não sobem', () => {
    const a = responder(base, true, 'L1');
    const b = responder(a, true, 'L1');
    expect(b.degrau).toBe(1);
    expect(b.acertos).toBe(2);
    expect(b.intervaloDias).toBe(a.intervaloDias);
  });

  it('errar desce 1, zera os acertos e volta para amanhã', () => {
    let i = base;
    for (const l of ['L1', 'L2', 'L3', 'L4']) i = responder(i, true, l);
    expect(i.degrau).toBe(3);
    const e = responder(i, false, 'L5');
    expect(e.degrau).toBe(2);
    expect(e.acertosSeguidos).toBe(0);
    expect(e.intervaloDias).toBe(1);
    expect(e.proximaRevisao).toBe('2026-11-02');
    expect(e.facilidade).toBeCloseTo(i.facilidade - 0.2);
  });

  it('nunca desce abaixo do degrau 1', () => {
    expect(responder(base, false, 'L1').degrau).toBe(1);
  });

  it('errar de novo na mesma lição não desce mais um degrau', () => {
    let i = base;
    for (const l of ['L1', 'L2', 'L3', 'L4']) i = responder(i, true, l);
    const e1 = responder(i, false, 'L5');
    const e2 = responder(e1, false, 'L5');
    expect(e2.degrau).toBe(e1.degrau);
    expect(e2.erros).toBe(2);
  });

  it('para no degrau 5', () => {
    let i = base;
    for (let n = 0; n < 20; n++) i = responder(i, true, `L${n}`);
    expect(i.degrau).toBe(5);
  });

  it('fácil demais pula 2 degraus e manda para 7 dias', () => {
    const f = facilDemais(base, HOJE);
    expect(f.degrau).toBe(3);
    expect(f.intervaloDias).toBe(7);
    expect(f.proximaRevisao).toBe('2026-11-08');
    expect(facilDemais({ ...base, degrau: 4 }, HOJE).degrau).toBe(5);
  });
});

describe('srs: intervalos e facilidade', () => {
  it('1 dia, 3 dias, depois vezes a facilidade', () => {
    expect(proximoIntervalo(0, 2.3)).toBe(1);
    expect(proximoIntervalo(1, 2.3)).toBe(3);
    expect(proximoIntervalo(3, 2.3)).toBe(7);
    expect(proximoIntervalo(7, 2.5)).toBe(18);
    expect(proximoIntervalo(100, 2.8)).toBe(INTERVALO_MAX);
  });

  it('acerto rápido e sem dica aumenta a facilidade; lento ou com dica, não', () => {
    const base = apresentar(novoItem('egg', 'palavra'), HOJE);
    expect(responder(base, true, 'L1', { ms: 2000 }).facilidade).toBeCloseTo(2.35);
    expect(responder(base, true, 'L1', { ms: 9000 }).facilidade).toBeCloseTo(2.3);
    expect(responder(base, true, 'L1', { ms: 2000, usouDica: true }).facilidade).toBeCloseTo(2.3);
  });

  it('facilidade fica entre 1,3 e 2,8', () => {
    let i = apresentar(novoItem('egg', 'palavra'), HOJE);
    for (let n = 0; n < 30; n++) i = responder(i, false, `E${n}`);
    expect(i.facilidade).toBe(FACILIDADE_MIN);
    for (let n = 0; n < 60; n++) i = responder(i, true, `A${n}`, { ms: 1000 });
    expect(i.facilidade).toBe(FACILIDADE_MAX);
    expect(i.intervaloDias).toBeLessThanOrEqual(INTERVALO_MAX);
  });
});

describe('ajuste para 80%', () => {
  const respostas = (acertos: number, total: number) =>
    Array.from({ length: total }, (_, i) => ({ acertou: i < acertos }));

  it('com poucas respostas fica no meio', () => {
    const a = calcularAjuste(respostas(3, 5), 5);
    expect(a.taxa).toBeNull();
    expect(a.faixa).toBe('media');
    expect(a.novosPorLicao).toBe(2);
    expect(a.limiteFrase).toBe(5);
  });

  it('acima de 90%: 3 novos, desafio 1 em 3, frase maior', () => {
    const a = calcularAjuste(respostas(29, 30), 5);
    expect(a).toMatchObject({ faixa: 'alta', novosPorLicao: 3, desafioACada: 3, limiteFrase: 6 });
  });

  it('entre 70% e 90%: mantém', () => {
    expect(calcularAjuste(respostas(24, 30), 7)).toMatchObject({ faixa: 'media', novosPorLicao: 2, desafioACada: 4, limiteFrase: 7 });
  });

  it('abaixo de 70%: nenhum novo, desafio 1 em 6, frase menor', () => {
    expect(calcularAjuste(respostas(15, 30), 5)).toMatchObject({ faixa: 'baixa', novosPorLicao: 0, desafioACada: 6, limiteFrase: 4 });
  });

  it('o limite das frases fica entre 3 e 14', () => {
    expect(calcularAjuste(respostas(30, 30), 14).limiteFrase).toBe(14);
    expect(calcularAjuste(respostas(0, 30), 3).limiteFrase).toBe(3);
  });

  it('olha só as últimas 30 respostas', () => {
    const antigas = respostas(0, 50);
    const recentes = respostas(30, 30);
    expect(calcularAjuste([...antigas, ...recentes], 5).faixa).toBe('alta');
  });
});

describe('itens e joguinhos', () => {
  it('ids de moldes e contrações levam prefixo', () => {
    expect(idDoItem('molde', 'isto-e')).toBe('molde:isto-e');
    expect(separarId('contracao:naquele')).toEqual({ tipo: 'contracao', id: 'naquele' });
    expect(separarId('apple')).toEqual({ tipo: 'palavra', id: 'apple' });
  });

  it('todo o conteúdo vira item: 60 palavras, 8 moldes, 10 contrações', () => {
    expect(todosOsItens()).toHaveLength(78);
  });

  it('unidades têm itens', () => {
    for (const u of UNIDADES) expect(itensDaUnidade(u).length).toBeGreaterThan(0);
    const prep = itensDaUnidade(UNIDADES.find((u) => u.alvo === 'preposicoes-lugar')!);
    expect(prep.some((i) => i.tipo === 'contracao')).toBe(true);
  });

  it('"Onde está?" só para preposições de lugar', () => {
    expect(joguinhosPossiveis('molde', 1, 'preposicoes-lugar')).toContain('onde-esta');
    expect(joguinhosPossiveis('molde', 1, 'artigos')).not.toContain('onde-esta');
  });

  it('todo degrau de todo tipo tem pelo menos um joguinho', () => {
    for (const tipo of ['palavra', 'molde', 'contracao'] as const) {
      for (let d = 0; d <= 5; d++) expect(joguinhosPossiveis(tipo, d, 'artigos').length).toBeGreaterThan(0);
    }
  });

  it('quais joguinhos precisam de frase', () => {
    expect(precisaFrase('card-novo', 'molde')).toBe(false);
    expect(precisaFrase('en-pt', 'palavra')).toBe(false);
    expect(precisaFrase('montar-blocos', 'palavra')).toBe(true);
    expect(precisaFrase('desmontar', 'contracao')).toBe(false);
  });
});

describe('montar lição', () => {
  const pool = itensDaUnidade(UNIDADES.find((u) => u.alvo === 'comida')!);

  it('primeira lição: 12 passos, 4 novos, cada card antes do exercício do item', () => {
    const l = montarLicao({ pool, itens: {}, historico: [], limiteFrase: 5, hoje: HOJE, licaoId: 'L1', semente: 1 });
    expect(l.exercicios).toHaveLength(TAMANHO_LICAO);
    expect(l.novos).toHaveLength(4);
    for (const id of l.novos) {
      const indices = l.exercicios.map((e, i) => (e.itemId === id ? i : -1)).filter((i) => i >= 0);
      expect(l.exercicios[indices[0]].joguinho).toBe('card-novo');
      expect(indices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('revisões vencidas entram primeiro, no máximo 6', () => {
    const itens: Record<string, ItemProgresso> = {};
    pool.slice(0, 10).forEach((p, i) => {
      itens[p.id] = { ...apresentar(novoItem(p.id, 'palavra'), '2026-10-01'), degrau: 2, proximaRevisao: `2026-10-${String(10 + i).padStart(2, '0')}` };
    });
    const l = montarLicao({ pool, itens, historico: [], limiteFrase: 5, hoje: HOJE, licaoId: 'L2', semente: 2 });
    expect(l.revisoes.length).toBe(MAX_REVISOES);
    expect(l.revisoes[0]).toBe(pool[0].id);
  });

  it('com acerto baixo não entram novos', () => {
    const itens: Record<string, ItemProgresso> = {};
    pool.slice(0, 6).forEach((p) => {
      itens[p.id] = { ...apresentar(novoItem(p.id, 'palavra'), HOJE), degrau: 2 };
    });
    const ruim = Array.from({ length: 30 }, (_, i) => ({ acertou: i % 2 === 0 }));
    const l = montarLicao({ pool, itens, historico: ruim, limiteFrase: 5, hoje: HOJE, licaoId: 'L3', semente: 3 });
    expect(l.novos).toHaveLength(0);
    expect(l.ajuste.faixa).toBe('baixa');
  });

  it('frases respeitam o limite de palavras e contêm a palavra do exercício', () => {
    const itens: Record<string, ItemProgresso> = {};
    pool.slice(0, 8).forEach((p) => {
      itens[p.id] = { ...apresentar(novoItem(p.id, 'palavra'), HOJE), degrau: 3 };
    });
    const l = montarLicao({ pool, itens, historico: [], limiteFrase: 6, hoje: HOJE, licaoId: 'L4', semente: 4 });
    for (const e of l.exercicios) {
      if (!e.frase) continue;
      expect(Object.values(e.frase.palavras)).toContain(e.itemId);
      if (e.joguinho !== 'frases-longas' && e.frase.moldeId !== 'exemplo') {
        expect(e.frase.blocosEn.length).toBeLessThanOrEqual(6);
      }
    }
  });

  it('desafios ficam um degrau acima', () => {
    const itens: Record<string, ItemProgresso> = {};
    pool.slice(0, 12).forEach((p) => {
      itens[p.id] = { ...apresentar(novoItem(p.id, 'palavra'), HOJE), degrau: 2 };
    });
    const l = montarLicao({ pool, itens, historico: [], limiteFrase: 5, hoje: HOJE, licaoId: 'L5', semente: 5 });
    const desafios = l.exercicios.filter((e) => e.desafio);
    expect(desafios.length).toBeGreaterThan(0);
    for (const d of desafios) expect(d.degrau).toBe(3);
  });
});

describe('simulação de 30 dias', () => {
  const r = simular({ dias: 30, semente: 7 });
  const todasRespostas = r.historico.length;
  const taxaGeral = r.historico.filter((h) => h.acertou).length / todasRespostas;

  it('toda lição tem até 12 passos e nenhum joguinho 3 vezes seguidas', () => {
    for (const l of r.licoes) {
      expect(l.exercicios.length).toBeGreaterThan(0);
      expect(l.exercicios.length).toBeLessThanOrEqual(TAMANHO_LICAO);
      for (let i = 2; i < l.exercicios.length; i++) {
        const [a, b, c] = [l.exercicios[i - 2], l.exercicios[i - 1], l.exercicios[i]].map((e) => e.joguinho);
        expect(a === b && b === c).toBe(false);
      }
    }
  });

  it('nenhum item é praticado antes do card de apresentação', () => {
    const apresentados = new Set<string>();
    for (const l of r.licoes) {
      for (const e of l.exercicios) {
        if (e.joguinho === 'card-novo') apresentados.add(e.itemId);
        else expect(apresentados.has(e.itemId)).toBe(true);
      }
    }
  });

  it('degraus, facilidade e intervalos ficam dentro dos limites', () => {
    for (const item of Object.values(r.itens)) {
      expect(item.degrau).toBeGreaterThanOrEqual(1);
      expect(item.degrau).toBeLessThanOrEqual(5);
      expect(item.facilidade).toBeGreaterThanOrEqual(FACILIDADE_MIN);
      expect(item.facilidade).toBeLessThanOrEqual(FACILIDADE_MAX);
      expect(item.intervaloDias).toBeLessThanOrEqual(INTERVALO_MAX);
    }
  });

  it('o aluno avança: itens novos entram e alguns chegam ao degrau 3 ou mais', () => {
    const vistos = Object.keys(r.itens).length;
    expect(vistos).toBeGreaterThan(30);
    expect(Object.values(r.itens).filter((i) => i.degrau >= 3).length).toBeGreaterThan(10);
  });

  it('o acerto geral fica perto da meta de 80%', () => {
    expect(taxaGeral).toBeGreaterThan(0.7);
    expect(taxaGeral).toBeLessThan(0.93);
  });

  it('imprime o resumo da simulação', () => {
    const porDegrau = [1, 2, 3, 4, 5].map((d) => Object.values(r.itens).filter((i) => i.degrau === d).length);
    const linhas = r.dias.map(
      (d) =>
        `dia ${String(d.dia).padStart(2)}  ${d.respostas} respostas  ${Math.round((100 * d.acertos) / Math.max(1, d.respostas))}% acerto  ${d.novos} novos  ${d.revisoes} revisões  faixa ${d.faixa}  limite ${d.limiteFrase}`,
    );
    console.log(
      `${linhas.join('\n')}\n\nItens vistos: ${Object.keys(r.itens).length} de ${todosOsItens().length}\n` +
        `Por degrau (1 a 5): ${porDegrau.join(' / ')}\nAcerto geral: ${Math.round(taxaGeral * 100)}%`,
    );
    expect(linhas).toHaveLength(30);
  });
});

describe('store: ações do motor', () => {
  beforeEach(() => useProgresso.getState().resetar());

  it('apresentar, responder e fácil demais atualizam o item e o histórico', () => {
    const s = useProgresso.getState();
    s.apresentarItem('apple', 'palavra', HOJE);
    expect(useProgresso.getState().itens.apple.degrau).toBe(1);
    s.responder('apple', 'palavra', { acertou: true, ms: 2000, usouDica: false, licaoId: 'L1', hoje: HOJE, joguinho: 'en-pt' });
    const depois = useProgresso.getState();
    expect(depois.itens.apple.acertos).toBe(1);
    expect(depois.historico).toHaveLength(1);
    expect(depois.historico[0]).toMatchObject({ itemId: 'apple', joguinho: 'en-pt', acertou: true });
    s.marcarFacilDemais('apple', 'palavra', HOJE);
    expect(useProgresso.getState().itens.apple.degrau).toBe(3);
    s.definirLimiteFrase(8);
    expect(useProgresso.getState().perfil.limiteFrase).toBe(8);
  });

  it('o histórico guarda no máximo 200 respostas', () => {
    const s = useProgresso.getState();
    for (let i = 0; i < 230; i++) {
      s.responder('egg', 'palavra', { acertou: true, ms: 1000, usouDica: false, licaoId: `L${i}`, hoje: HOJE, joguinho: 'en-pt' });
    }
    expect(useProgresso.getState().historico).toHaveLength(200);
  });
});
