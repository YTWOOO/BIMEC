import { describe, expect, it } from '@jest/globals';

import { PALAVRAS, palavraPorId } from '@/conteudo/palavras';
import { TEMAS } from '@/conteudo/temas';

/** Palavras em que a regra "vogal → an" não vale pela letra, e sim pelo som. */
const EXCECOES_ARTIGO: Record<string, 'a' | 'an'> = {
  hour: 'an',
  honest: 'an',
  university: 'a',
  uniform: 'a',
  european: 'a',
  one: 'a',
};

function contemPalavra(frase: string, palavra: string): boolean {
  return new RegExp(`\\b${palavra.toLowerCase()}\\b`).test(frase.toLowerCase());
}

describe('palavras', () => {
  it('tem 60 palavras, 30 em cada tema da etapa 2', () => {
    expect(PALAVRAS).toHaveLength(60);
    expect(PALAVRAS.filter((p) => p.tema === 'comida')).toHaveLength(30);
    expect(PALAVRAS.filter((p) => p.tema === 'casa')).toHaveLength(30);
  });

  it('ids são únicos e iguais à palavra em inglês', () => {
    const ids = new Set(PALAVRAS.map((p) => p.id));
    expect(ids.size).toBe(PALAVRAS.length);
    for (const p of PALAVRAS) expect(p.id).toBe(p.en);
    expect(palavraPorId('apple')?.pt).toBe('maçã');
  });

  it('todo tema existe', () => {
    const temas = new Set(TEMAS.map((t) => t.id));
    for (const p of PALAVRAS) expect(temas.has(p.tema)).toBe(true);
  });

  it('contável tem artigo e plural; incontável não tem', () => {
    for (const p of PALAVRAS) {
      const contavel = p.tags.includes('contavel');
      const incontavel = p.tags.includes('incontavel');
      expect(contavel !== incontavel).toBe(true);
      if (contavel) {
        expect(p.artigo).not.toBeNull();
        expect(p.plural).not.toBeNull();
      } else {
        expect(p.artigo).toBeNull();
        expect(p.plural).toBeNull();
      }
    }
  });

  it('a/an segue o som da primeira letra', () => {
    for (const p of PALAVRAS) {
      if (p.artigo === null) continue;
      const esperado = EXCECOES_ARTIGO[p.en] ?? (/^[aeiou]/i.test(p.en) ? 'an' : 'a');
      expect(`${p.en}: ${p.artigo}`).toBe(`${p.en}: ${esperado}`);
    }
  });

  it('exemplos usam a palavra e terminam com pontuação', () => {
    for (const p of PALAVRAS) {
      const usa = contemPalavra(p.exemplo.en, p.en) || (p.plural !== null && contemPalavra(p.exemplo.en, p.plural));
      expect(`${p.id}: ${usa}`).toBe(`${p.id}: true`);
      expect(p.exemplo.en).toMatch(/^[A-Z]/);
      expect(p.exemplo.en).toMatch(/[.?!]$/);
      expect(p.exemplo.pt).toMatch(/[.?!]$/);
    }
  });

  it('gênero em português é m ou f', () => {
    for (const p of PALAVRAS) expect(['m', 'f']).toContain(p.generoPt);
  });
});
