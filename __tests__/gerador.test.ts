import { describe, expect, it } from '@jest/globals';

import { CONTRACOES, MOLDES, PALAVRAS, PREPOSICOES, UNIDADES, preposicaoPorEn } from '@/conteudo';
import { ESTRUTURAS } from '@/conteudo/estruturas';
import { TEMAS } from '@/conteudo/temas';
import type { Palavra } from '@/conteudo/tipos';
import { criarAleatorio } from '@/gerador/aleatorio';
import { blocosExtras, gerarDistratores } from '@/gerador/distratores';
import { gerarFrase, gerarFrases, type FraseGerada } from '@/gerador/frases';
import {
  contrair,
  desmontar,
  generoDoDeterminante,
  juntarComPreposicao,
} from '@/gerador/portugues';

const porId = new Map(PALAVRAS.map((p) => [p.id, p]));
const porEn = new Map(PALAVRAS.map((p) => [p.en.toLowerCase(), p]));
const porPlural = new Map(PALAVRAS.filter((p) => p.plural).map((p) => [p.plural!.toLowerCase(), p]));

function palavrasDa(frase: FraseGerada): Palavra[] {
  return Object.values(frase.palavras).map((id) => porId.get(id)!);
}

describe('português: contrações', () => {
  it('contrai o que o português padrão contrai', () => {
    expect(contrair('em', 'a')).toBe('na');
    expect(contrair('em', 'o')).toBe('no');
    expect(contrair('em', 'uma')).toBe('numa');
    expect(contrair('de', 'a')).toBe('da');
    expect(contrair('de', 'ele')).toBe('dele');
    expect(contrair('em', 'aquele')).toBe('naquele');
    expect(contrair('a', 'a')).toBe('à');
    expect(contrair('por', 'o')).toBe('pelo');
  });

  it('não inventa contração ("de um" fica separado)', () => {
    expect(contrair('de', 'um')).toBe('de um');
    expect(contrair('com', 'o')).toBe('com o');
  });

  it('junta preposições de várias palavras', () => {
    expect(juntarComPreposicao('dentro de', 'a', 'caixa')).toBe('dentro da caixa');
    expect(juntarComPreposicao('dentro de', 'um', 'livro')).toBe('dentro de um livro');
    expect(juntarComPreposicao('em', 'o', 'quarto')).toBe('no quarto');
    expect(juntarComPreposicao('na frente de', 'a', 'porta')).toBe('na frente da porta');
    expect(juntarComPreposicao('ao lado de', 'o', 'sofá')).toBe('ao lado do sofá');
  });

  it('as 10 contrações do conteúdo batem com as regras, nos dois sentidos', () => {
    expect(CONTRACOES).toHaveLength(10);
    for (const c of CONTRACOES) {
      expect(contrair(c.partes[0], c.partes[1])).toBe(c.pt);
      expect(desmontar(c.pt)).toEqual(c.partes);
      expect(c.exemplo.pt.toLowerCase()).toContain(c.pt);
    }
  });
});

describe('conteúdo da etapa 3', () => {
  it('8 moldes, só de Artigos e Preposições de lugar', () => {
    expect(MOLDES).toHaveLength(8);
    const estruturas = new Set(MOLDES.map((m) => m.estrutura));
    expect([...estruturas].sort()).toEqual(['artigos', 'preposicoes-lugar']);
    const ids = new Set(MOLDES.map((m) => m.id));
    expect(ids.size).toBe(MOLDES.length);
  });

  it('todo molde gera pelo menos uma frase', () => {
    for (const m of MOLDES) {
      expect(gerarFrase(m, criarAleatorio(1))).not.toBeNull();
    }
  });

  it('preposições dos moldes existem', () => {
    for (const m of MOLDES) for (const p of m.preposicoes ?? []) expect(preposicaoPorEn(p)).toBeDefined();
  });

  it('unidades apontam para estruturas e temas que existem', () => {
    const estruturas = new Set(ESTRUTURAS.map((e) => e.id));
    const temas = new Set(TEMAS.map((t) => t.id));
    expect(ESTRUTURAS).toHaveLength(12);
    for (const u of UNIDADES) {
      expect(u.tipo === 'estrutura' ? estruturas.has(u.alvo) : temas.has(u.alvo)).toBe(true);
    }
  });
});

describe('500 frases geradas', () => {
  const frases = gerarFrases(500, { semente: 2026 });

  it('gera 500 frases diferentes', () => {
    expect(frases).toHaveLength(500);
    expect(new Set(frases.map((f) => f.id)).size).toBe(500);
  });

  it('a/an sempre certo', () => {
    for (const f of frases) {
      for (const m of f.en.matchAll(/\b(a|an)\s+(\w+)/gi)) {
        const palavra = porEn.get(m[2].toLowerCase());
        expect(palavra).toBeDefined();
        expect(`${f.en} → ${m[1].toLowerCase()}`).toBe(`${f.en} → ${palavra!.artigo}`);
      }
    }
  });

  it('"two" sempre com plural', () => {
    for (const f of frases) {
      for (const m of f.en.matchAll(/\btwo\s+(\w+)/gi)) {
        expect(porPlural.has(m[1].toLowerCase())).toBe(true);
      }
    }
  });

  it('nenhuma contração esquecida em português', () => {
    for (const f of frases) {
      expect(f.pt).not.toMatch(/\b(em|de) (o|a|os|as)\b/i);
      expect(f.pt).not.toMatch(/\bem (um|uma)\b/i);
      expect(f.pt).not.toMatch(/\s{2,}/);
    }
  });

  it('o gênero do artigo combina com o substantivo em português', () => {
    for (const f of frases) {
      const tokens = f.pt.replace(/[.?!]$/, '').split(' ');
      for (const p of palavrasDa(f)) {
        for (const forma of [p.pt, p.pluralPt].filter(Boolean) as string[]) {
          const primeira = forma.split(' ')[0];
          tokens.forEach((t, i) => {
            if (t.toLowerCase() !== primeira.toLowerCase() || i === 0) return;
            const genero = generoDoDeterminante(tokens[i - 1]);
            if (genero) expect(`${f.pt} → ${p.pt}: ${genero}`).toBe(`${f.pt} → ${p.pt}: ${p.generoPt}`);
          });
        }
      }
    }
  });

  it('preposição combina com o lugar', () => {
    for (const f of frases) {
      if (!f.preposicao) continue;
      const prep = preposicaoPorEn(f.preposicao)!;
      const lugar = porId.get(f.palavras.L)!;
      expect(prep.requer.some((t) => lugar.tags.includes(t))).toBe(true);
    }
  });

  it('a mesma palavra nunca aparece duas vezes na frase', () => {
    for (const f of frases) {
      const ids = Object.values(f.palavras);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('começa com maiúscula e frases completas terminam com ponto', () => {
    for (const f of frases) {
      expect(f.en).toMatch(/^[A-Z]/);
      expect(f.pt).toMatch(/^[A-ZÀ-Ú]/);
      if (f.moldeId !== 'artigo-sozinho') {
        expect(f.en).toMatch(/\.$/);
        expect(f.pt).toMatch(/\.$/);
      }
    }
  });

  it('os blocos remontam a frase', () => {
    for (const f of frases) {
      expect(f.blocosEn.join(' ')).toBe(f.en.replace(/[.?!]$/, '').replace(/^\w/, (c) => (f.blocosEn[0] === 'I' ? c : c.toLowerCase())));
    }
  });

  it('a mesma semente gera as mesmas frases', () => {
    const de_novo = gerarFrases(500, { semente: 2026 });
    expect(de_novo.map((f) => f.id)).toEqual(frases.map((f) => f.id));
  });

  it('usa todas as preposições e todos os moldes', () => {
    expect(new Set(frases.map((f) => f.moldeId)).size).toBe(MOLDES.length);
    const usadas = new Set(frases.map((f) => f.preposicao).filter(Boolean));
    for (const p of PREPOSICOES) expect(usadas.has(p.en)).toBe(true);
  });
});

describe('o exemplo do Ícaro', () => {
  it('"an apple inside a book" sai certo nos dois idiomas', () => {
    const molde = MOLDES.find((m) => m.id === 'coisa-prep-um')!;
    const apple = porId.get('apple')!;
    const book = porId.get('book')!;
    const inside = preposicaoPorEn('inside')!;
    const frase = gerarFrase(molde, criarAleatorio(7), { palavras: [apple, book], preposicoes: [inside] });
    expect(frase?.en).toBe('An apple inside a book.');
    expect(frase?.pt).toBe('Uma maçã dentro de um livro.');
  });

  it('"the key is under the table" com contração', () => {
    const molde = MOLDES.find((m) => m.id === 'o-esta-prep-o')!;
    const frase = gerarFrase(molde, criarAleatorio(3), {
      palavras: [porId.get('key')!, porId.get('table')!],
      preposicoes: [preposicaoPorEn('under')!],
    });
    expect(frase?.en).toBe('The key is under the table.');
    expect(frase?.pt).toBe('A chave está embaixo da mesa.');
  });
});

describe('distratores', () => {
  const frases = gerarFrases(200, { semente: 99 });
  const aleatorio = criarAleatorio(5);

  it('nunca repetem a frase certa e trazem explicação', () => {
    for (const f of frases) {
      const ds = gerarDistratores(f, aleatorio, 3);
      expect(ds.length).toBeGreaterThan(0);
      for (const d of ds) {
        expect(d.en.toLowerCase()).not.toBe(f.en.toLowerCase());
        expect(d.explicacao.length).toBeGreaterThan(10);
      }
      expect(new Set(ds.map((d) => d.en)).size).toBe(ds.length);
    }
  });

  it('o distrator de artigo usa o artigo errado', () => {
    const molde = MOLDES.find((m) => m.id === 'isto-e')!;
    const frase = gerarFrase(molde, criarAleatorio(1), { palavras: [porId.get('apple')!] })!;
    const ds = gerarDistratores(frase, criarAleatorio(1), 4);
    const artigo = ds.find((d) => d.tipo === 'artigo');
    expect(artigo?.en).toBe('This is a apple.');
    expect(artigo?.explicacao).toContain('vogal');
  });

  it('blocos extras incluem o artigo errado e uma preposição vizinha', () => {
    const molde = MOLDES.find((m) => m.id === 'coisa-prep-um')!;
    const frase = gerarFrase(molde, criarAleatorio(7), {
      palavras: [porId.get('apple')!, porId.get('book')!],
      preposicoes: [preposicaoPorEn('inside')!],
    })!;
    const extras = blocosExtras(frase);
    expect(extras).toContain('a');
    expect(extras).toContain('on');
  });
});
