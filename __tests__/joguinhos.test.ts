import { beforeEach, describe, expect, it } from '@jest/globals';

import { CONTRACOES, MOLDES, PALAVRAS, UNIDADES, palavraPorId } from '@/conteudo';
import { criarAleatorio } from '@/gerador/aleatorio';
import { fraseDoExemplo, gerarFrase, gerarFraseComPalavra, gerarFrases, type FraseGerada } from '@/gerador/frases';
import { variacoesPt } from '@/gerador/variacoes';
import { avaliar, respostaCompleta } from '@/joguinhos/avaliar';
import { MAX_VOLTAS, avancar, criarFila, ehPrimeiraTentativa, progresso, registrar, rodadaAtual, terminou } from '@/joguinhos/fila';
import { JOGUINHOS_PRONTOS, exerciciosDaGaleria, prepararPergunta, reembaralhar, trechoDaContracao } from '@/joguinhos/preparar';
import { ID_GALERIA, criarSessao, resumirSessao, unidadeDaPalavra } from '@/joguinhos/sessao';
import type { Pergunta, PerguntaCompletar, PerguntaEscolha } from '@/joguinhos/tipos';
import { estruturaDoItem, idDoItem, itensDaUnidade, separarId, todosOsItens } from '@/motor/itens';
import { joguinhosPossiveis, type Joguinho } from '@/motor/joguinhos';
import { montarLicao, type Exercicio } from '@/motor/licao';
import { XP_PERFEITA, XP_TERMINAR, somarXp, xpDaLicao } from '@/motor/xp';
import { itemPadrao } from '@/store/padrao';
import { useProgresso } from '@/store/progresso';
import type { ItemProgresso } from '@/store/tipos';

const HOJE = '2026-11-01';

function fraseDoItem(itemId: string, semente: number): FraseGerada | null {
  const { tipo, id } = separarId(itemId);
  const aleatorio = criarAleatorio(semente);
  if (tipo === 'molde') return gerarFrase(MOLDES.find((m) => m.id === id)!, aleatorio);
  if (tipo === 'palavra') return gerarFraseComPalavra(id, aleatorio, { limite: 8 }) ?? fraseDoExemplo(palavraPorId(id)!);
  return null;
}

function exercicio(itemId: string, joguinho: Joguinho, semente: number): Exercicio {
  return {
    itemId,
    tipoItem: separarId(itemId).tipo,
    joguinho,
    degrau: 1,
    desafio: false,
    frase: fraseDoItem(itemId, semente),
  };
}

/** Todos os pares item × joguinho pronto que o motor pode pedir. */
function combinacoes(): { itemId: string; joguinho: Joguinho }[] {
  const saida: { itemId: string; joguinho: Joguinho }[] = [];
  for (const item of todosOsItens()) {
    const jogos = new Set<Joguinho>();
    for (let d = 0; d <= 5; d++) {
      for (const j of joguinhosPossiveis(item.tipo, d, estruturaDoItem(item.id), JOGUINHOS_PRONTOS)) jogos.add(j);
    }
    for (const j of jogos) saida.push({ itemId: item.id, joguinho: j });
  }
  return saida;
}

function textosUnicos(textos: string[]): boolean {
  return new Set(textos.map((t) => t.trim().toLowerCase())).size === textos.length;
}

function conferirPergunta(p: Pergunta) {
  expect(p.enunciado.length).toBeGreaterThan(0);
  switch (p.tipo) {
    case 'card':
      return;
    case 'escolha': {
      expect(p.opcoes.length).toBeGreaterThanOrEqual(2);
      expect(textosUnicos(p.opcoes.map((o) => o.texto))).toBe(true);
      expect(p.opcoes.some((o) => o.id === p.certa)).toBe(true);
      for (const o of p.opcoes) if (o.id !== p.certa) expect(o.explicacao?.length ?? 0).toBeGreaterThan(0);
      expect(Boolean(p.en || p.pt || p.audio)).toBe(true);
      return;
    }
    case 'pares': {
      expect(p.pares.length).toBeGreaterThanOrEqual(3);
      expect(textosUnicos(p.pares.map((x) => x.en))).toBe(true);
      expect(textosUnicos(p.pares.map((x) => x.pt))).toBe(true);
      const ids = p.pares.map((x) => x.id).sort();
      expect([...p.ordemEn].sort()).toEqual(ids);
      expect([...p.ordemPt].sort()).toEqual(ids);
      expect(ids).toContain(p.alvo);
      return;
    }
    case 'onde': {
      expect(p.opcoes.length).toBe(4);
      expect(new Set(p.opcoes).size).toBe(4);
      expect(p.opcoes).toContain(p.certa);
      expect(p.opcoes.includes('in') && p.opcoes.includes('inside')).toBe(false);
      expect(p.en.toLowerCase()).toContain(` ${p.certa} `);
      return;
    }
    case 'completar': {
      expect(p.lacunas.length).toBeGreaterThanOrEqual(1);
      expect(p.lacunas.length).toBeLessThanOrEqual(2);
      for (const l of p.lacunas) {
        expect(l.opcoes).toContain(l.certa);
        expect(textosUnicos(l.opcoes)).toBe(true);
        for (const o of l.opcoes) if (o !== l.certa) expect(l.explicacoes[o]?.length ?? 0).toBeGreaterThan(0);
      }
      // Preencher as lacunas com as certas devolve a frase em inglês.
      const montada = p.trechos.map((t) => (t.tipo === 'texto' ? t.texto : p.lacunas[t.indice].certa)).join('');
      expect(montada.toLowerCase()).toBe(p.resposta.en?.toLowerCase());
      return;
    }
  }
}

describe('preparar perguntas', () => {
  it('toda combinação de item e joguinho vira uma pergunta válida', () => {
    let total = 0;
    for (const { itemId, joguinho } of combinacoes()) {
      for (let semente = 1; semente <= 6; semente++) {
        const p = prepararPergunta(exercicio(itemId, joguinho, semente), criarAleatorio(semente * 31));
        expect(p).not.toBeNull();
        conferirPergunta(p!);
        total++;
      }
    }
    expect(total).toBeGreaterThan(400);
  });

  it('cada joguinho mostra o formato certo (sem cair no plano B)', () => {
    const esperado: Record<string, (p: Pergunta) => boolean> = {
      'card-novo': (p) => p.tipo === 'card',
      'en-pt': (p) => p.tipo === 'escolha',
      pares: (p) => p.tipo === 'pares',
      'onde-esta': (p) => p.tipo === 'onde',
      'pt-en': (p) => p.tipo === 'escolha',
      completar: (p) => p.tipo === 'completar',
      'ouvir-escolher': (p) => p.tipo === 'escolha' && Boolean(p.audio),
    };
    const falhas: string[] = [];
    for (const { itemId, joguinho } of combinacoes()) {
      for (let semente = 1; semente <= 4; semente++) {
        const p = prepararPergunta(exercicio(itemId, joguinho, semente), criarAleatorio(semente));
        if (!esperado[joguinho](p!)) falhas.push(`${itemId}/${joguinho}`);
      }
    }
    expect(falhas).toEqual([]);
  });

  it('Inglês → português de palavra: 4 opções em português, com a tradução certa', () => {
    const p = prepararPergunta(exercicio('apple', 'en-pt', 1), criarAleatorio(1)) as PerguntaEscolha;
    expect(p.en).toBe('apple');
    expect(p.opcoes).toHaveLength(4);
    expect(p.opcoes.find((o) => o.id === p.certa)?.texto).toBe('maçã');
    expect(p.opcoes.every((o) => o.lingua === 'pt')).toBe(true);
  });

  it('completar com "an apple": "a" errado explica o som de vogal', () => {
    const frase = gerarFrase(MOLDES.find((m) => m.id === 'isto-e')!, criarAleatorio(1), {
      obrigatoria: 'apple',
      palavras: PALAVRAS.filter((p) => p.id === 'apple'),
    })!;
    expect(frase.en).toBe('This is an apple.');
    const ex: Exercicio = { ...exercicio('apple', 'completar', 1), frase };
    const p = prepararPergunta(ex, criarAleatorio(2)) as PerguntaCompletar;
    expect(p.tipo).toBe('completar');
    expect(p.lacunas[0].certa).toBe('an');
    expect(p.lacunas[0].explicacoes.a).toContain('vogal');
    expect(p.lacunas[0].explicacoes.the).toContain('um/uma');
  });

  it('o "Onde está?" só aparece nas preposições de lugar', () => {
    for (const item of todosOsItens()) {
      const tem = [0, 1, 2, 3, 4, 5].some((d) =>
        joguinhosPossiveis(item.tipo, d, estruturaDoItem(item.id), JOGUINHOS_PRONTOS).includes('onde-esta'),
      );
      expect(tem).toBe(estruturaDoItem(item.id) === 'preposicoes-lugar');
    }
  });

  it('toda contração acha o pedaço em inglês do exemplo', () => {
    for (const c of CONTRACOES) expect(trechoDaContracao(c)).not.toBeNull();
    expect(trechoDaContracao(CONTRACOES.find((c) => c.id === 'naquele')!)).toBe('in that');
    expect(trechoDaContracao(CONTRACOES.find((c) => c.id === 'dele')!)).toBe('his');
  });

  it('a galeria tem um exercício de cada joguinho pronto', () => {
    const exercicios = exerciciosDaGaleria(criarAleatorio(3));
    expect(new Set(exercicios.map((e) => e.joguinho))).toEqual(new Set(JOGUINHOS_PRONTOS));
    const perguntas = exercicios.map((e) => prepararPergunta(e, criarAleatorio(4)));
    expect(new Set(perguntas.map((p) => p?.tipo))).toEqual(new Set(['card', 'escolha', 'pares', 'onde', 'completar']));
  });

  it('reembaralhar mantém a resposta certa', () => {
    const p = prepararPergunta(exercicio('apple', 'en-pt', 1), criarAleatorio(1)) as PerguntaEscolha;
    const q = reembaralhar(p, criarAleatorio(99)) as PerguntaEscolha;
    expect(q.opcoes.find((o) => o.id === q.certa)?.texto).toBe('maçã');
    expect([...q.opcoes].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...p.opcoes].sort((a, b) => a.id.localeCompare(b.id)));
  });
});

describe('traduções erradas (variacoesPt)', () => {
  it('são diferentes da certa e entre si, e cada uma explica o erro', () => {
    for (const frase of gerarFrases(300, { semente: 5 })) {
      const variacoes = variacoesPt(frase, criarAleatorio(frase.en.length), 3);
      expect(variacoes.length).toBeGreaterThanOrEqual(1);
      expect(textosUnicos([frase.pt, ...variacoes.map((v) => v.pt)])).toBe(true);
      for (const v of variacoes) expect(v.explicacao.length).toBeGreaterThan(0);
    }
  });

  it('"an apple" pode virar "a maçã" (artigo trocado)', () => {
    const frase = gerarFrase(MOLDES.find((m) => m.id === 'artigo-sozinho')!, criarAleatorio(1), {
      palavras: PALAVRAS.filter((p) => p.id === 'apple'),
    })!;
    const tipos = new Map(variacoesPt(frase, criarAleatorio(1), 3).map((v) => [v.tipo, v.pt]));
    expect(tipos.get('artigo')).toBe('A maçã');
  });

  it('frase fora dos moldes não tem variação', () => {
    expect(variacoesPt(fraseDoExemplo(palavraPorId('apple')!), criarAleatorio(1))).toEqual([]);
  });
});

describe('correção', () => {
  it('escolha: certa, errada com explicação', () => {
    const p = prepararPergunta(exercicio('apple', 'en-pt', 1), criarAleatorio(1)) as PerguntaEscolha;
    expect(avaliar(p, { tipo: 'escolha', opcao: p.certa })).toEqual({ acertou: true, explicacoes: [] });
    const errada = p.opcoes.find((o) => o.id !== p.certa)!;
    const c = avaliar(p, { tipo: 'escolha', opcao: errada.id });
    expect(c.acertou).toBe(false);
    expect(c.explicacoes[0]).toContain('"apple" é "maçã"');
  });

  it('completar: ignora maiúsculas e explica cada lacuna errada', () => {
    const p = prepararPergunta(
      exercicio(idDoItem('molde', 'tem-um-prep-o'), 'completar', 2),
      criarAleatorio(2),
    ) as PerguntaCompletar;
    const certas = p.lacunas.map((l) => l.certa.toUpperCase());
    expect(avaliar(p, { tipo: 'completar', valores: certas }).acertou).toBe(true);
    const erradas = p.lacunas.map((l) => l.opcoes.find((o) => o !== l.certa)!);
    const c = avaliar(p, { tipo: 'completar', valores: erradas });
    expect(c.acertou).toBe(false);
    expect(c.explicacoes).toHaveLength(p.lacunas.length);
    expect(respostaCompleta(p, { tipo: 'completar', valores: [null, ...certas.slice(1)] })).toBe(false);
    expect(respostaCompleta(p, { tipo: 'completar', valores: certas })).toBe(true);
  });

  it('pares: só o erro no par do item conta', () => {
    const p = prepararPergunta(exercicio('apple', 'pares', 1), criarAleatorio(1))!;
    expect(avaliar(p, { tipo: 'pares', errosNoAlvo: 0, erros: 3 }).acertou).toBe(true);
    expect(avaliar(p, { tipo: 'pares', errosNoAlvo: 1, erros: 1 }).acertou).toBe(false);
  });

  it('onde: explica as duas posições', () => {
    const ex = exercicio(idDoItem('molde', 'o-esta-prep-o'), 'onde-esta', 3);
    const p = prepararPergunta(ex, criarAleatorio(3))!;
    if (p.tipo !== 'onde') throw new Error('esperava onde');
    const errada = p.opcoes.find((o) => o !== p.certa)!;
    const c = avaliar(p, { tipo: 'onde', posicao: errada });
    expect(c.acertou).toBe(false);
    expect(c.explicacoes[0]).toContain(`"${p.certa}"`);
    expect(c.explicacoes[0]).toContain(`"${errada}"`);
  });
});

describe('fila da lição', () => {
  it('erro volta no fim; acerto resolve; a primeira tentativa fica guardada', () => {
    let f = criarFila(3);
    expect(ehPrimeiraTentativa(f)).toBe(true);
    f = avancar(registrar(f, false)); // 0 errado
    f = avancar(registrar(f, true)); // 1
    f = avancar(registrar(f, true)); // 2
    expect(terminou(f)).toBe(false);
    expect(rodadaAtual(f)).toEqual({ indice: 0, volta: 1 });
    expect(ehPrimeiraTentativa(f)).toBe(false);
    expect(progresso(f)).toBeCloseTo(2 / 3);
    f = avancar(registrar(f, true));
    expect(terminou(f)).toBe(true);
    expect(f.primeira).toEqual([false, true, true]);
    expect(progresso(f)).toBe(1);
  });

  it('depois de MAX_VOLTAS erros o exercício não volta mais', () => {
    let f = criarFila(1);
    for (let i = 0; i <= MAX_VOLTAS; i++) f = avancar(registrar(f, false));
    expect(terminou(f)).toBe(true);
    expect(f.rodadas).toHaveLength(MAX_VOLTAS + 1);
  });
});

describe('XP', () => {
  it('1 por acerto, 5 por terminar, 5 se perfeita, desafio vale 2', () => {
    const certas = Array.from({ length: 10 }, () => ({ acertou: true, desafio: false }));
    expect(xpDaLicao(certas).total).toBe(10 + XP_TERMINAR + XP_PERFEITA);
    const umaErrada = [...certas.slice(1), { acertou: false, desafio: false }];
    expect(xpDaLicao(umaErrada).total).toBe(9 + XP_TERMINAR);
    expect(xpDaLicao([{ acertou: true, desafio: true }]).acertos).toBe(2);
  });

  it('XP de hoje zera quando o dia muda', () => {
    const perfil = { xp: 50, xpHoje: 12, diaXpHoje: '2026-10-31' };
    expect(somarXp(perfil, 8, '2026-10-31')).toEqual({ xp: 58, xpHoje: 20, diaXpHoje: '2026-10-31' });
    expect(somarXp(perfil, 8, HOJE)).toEqual({ xp: 58, xpHoje: 8, diaXpHoje: HOJE });
  });
});

describe('motor com os joguinhos prontos', () => {
  function itensNoDegrau(degrau: number): Record<string, ItemProgresso> {
    return Object.fromEntries(
      todosOsItens().map((i) => [
        i.id,
        { ...itemPadrao(i.id, i.tipo), degrau, proximaRevisao: HOJE, vistoEm: '2026-10-01', intervaloDias: 3 },
      ]),
    );
  }

  it('itens nos degraus altos usam só joguinhos que já existem', () => {
    for (const degrau of [3, 4, 5]) {
      for (const unidade of UNIDADES) {
        const licao = montarLicao({
          pool: itensDaUnidade(unidade),
          itens: itensNoDegrau(degrau),
          historico: [],
          limiteFrase: 6,
          hoje: HOJE,
          licaoId: 'l1',
          semente: degrau,
          disponiveis: JOGUINHOS_PRONTOS,
        });
        for (const e of licao.exercicios) expect(JOGUINHOS_PRONTOS.has(e.joguinho)).toBe(true);
      }
    }
  });

  it('o foco entra na lição, novo ou já começado', () => {
    const pool = itensDaUnidade(UNIDADES.find((u) => u.id === 'u02')!);
    const base = { pool, historico: [], limiteFrase: 5, hoje: HOJE, licaoId: 'l2', semente: 2, disponiveis: JOGUINHOS_PRONTOS };
    const novo = montarLicao({ ...base, itens: {}, foco: 'dinner' });
    expect(novo.novos[0]).toBe('dinner');
    expect(novo.exercicios[0].itemId === 'dinner' || novo.exercicios[1].itemId === 'dinner').toBe(true);

    const itens = itensNoDegrau(2);
    const comecado = montarLicao({ ...base, itens, foco: 'dinner' });
    expect(comecado.exercicios.some((e) => e.itemId === 'dinner')).toBe(true);
  });
});

describe('sessão', () => {
  beforeEach(() => {
    useProgresso.getState().resetar();
  });

  it('lição de unidade: 12 exercícios, salva, com itens novos', () => {
    const s = criarSessao('u02', { semente: 10 })!;
    expect(s.salvar).toBe(true);
    expect(s.perguntas).toHaveLength(12);
    expect(s.novos.length).toBeGreaterThan(0);
    for (const p of s.perguntas) conferirPergunta(p);
  });

  it('unidade de preposições traz o "Onde está?" com o tempo', () => {
    const tipos = new Set<string>();
    for (let semente = 1; semente <= 30; semente++) {
      // Itens já no degrau 1 para pular os cards.
      const itens = Object.fromEntries(
        itensDaUnidade(UNIDADES.find((u) => u.id === 'u03')!).map((i) => [
          i.id,
          { ...itemPadrao(i.id, i.tipo), degrau: 1, proximaRevisao: HOJE, vistoEm: HOJE },
        ]),
      );
      useProgresso.setState({ itens });
      for (const p of criarSessao('u03', { semente })!.perguntas) tipos.add(p.tipo);
    }
    expect(tipos.has('onde')).toBe(true);
  });

  it('galeria não salva e tem todos os formatos', () => {
    const s = criarSessao(ID_GALERIA, { semente: 1 })!;
    expect(s.salvar).toBe(false);
    expect(s.perguntas).toHaveLength(14);
  });

  it('unidade que não existe dá null; palavra acha a unidade do tema', () => {
    expect(criarSessao('u99')).toBeNull();
    expect(unidadeDaPalavra('apple')?.id).toBe('u02');
    expect(unidadeDaPalavra('table')?.id).toBe('u04');
  });

  it('resultado conta só exercícios (sem cards) e calcula o XP', () => {
    const s = criarSessao('u02', { semente: 3 })!;
    let f = criarFila(s.perguntas.length);
    while (!terminou(f)) f = avancar(registrar(f, true));
    const r = resumirSessao(s, f);
    const cards = s.perguntas.filter((p) => p.tipo === 'card').length;
    expect(r.exercicios).toBe(12 - cards);
    expect(r.acertosDePrimeira).toBe(r.exercicios);
    expect(r.xp.perfeita).toBe(XP_PERFEITA);
  });

  it('ganharXp soma no perfil', () => {
    useProgresso.getState().ganharXp(17, HOJE);
    const { perfil } = useProgresso.getState();
    expect(perfil.xp).toBe(17);
    expect(perfil.xpHoje).toBe(17);
    expect(perfil.diaXpHoje).toBe(HOJE);
  });
});
