import { describe, expect, it } from '@jest/globals';

import { CONTRACOES, PALAVRAS } from '@/conteudo';
import { ENTRADAS, buscarPalavra, entradaPorId, tokenizar } from '@/dicionario/dicionario';
import { gerarFrases } from '@/gerador/frases';

describe('dicionário', () => {
  it('ids únicos e toda ficha tem significado e pelo menos um contexto', () => {
    const ids = ENTRADAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ENTRADAS) {
      expect(e.significado.length).toBeGreaterThan(0);
      expect(e.contextos.length).toBeGreaterThan(0);
      for (const c of e.contextos) {
        expect(c.en.length).toBeGreaterThan(0);
        expect(c.pt.length).toBeGreaterThan(0);
      }
    }
  });

  it('toda palavra das frases do app tem ficha', () => {
    const frases = [
      ...PALAVRAS.map((p) => p.exemplo.en),
      ...CONTRACOES.map((c) => c.exemplo.en),
      ...gerarFrases(2000, { semente: 11 }).map((f) => f.en),
    ];
    const faltando = new Set<string>();
    for (const f of frases) {
      for (const t of tokenizar(f)) if (t.palavra && t.entrada === null) faltando.add(t.texto);
    }
    expect([...faltando]).toEqual([]);
  });

  it('acha plural, formas e o "I"', () => {
    expect(buscarPalavra('eggs')?.id).toBe('egg');
    expect(buscarPalavra('Strawberries')?.id).toBe('strawberry');
    expect(buscarPalavra('likes')?.id).toBe('like');
    expect(buscarPalavra('sleeping')?.id).toBe('sleep');
    expect(buscarPalavra('I')?.id).toBe('I');
    expect(buscarPalavra("Don't")?.id).toBe("don't");
    expect(buscarPalavra('An')?.id).toBe('an');
  });

  it('expressões de várias palavras viram um trecho só', () => {
    const t = tokenizar('The cat is in front of the door, next to me.');
    const palavras = t.filter((x) => x.palavra);
    expect(palavras.map((x) => x.texto)).toEqual(['The', 'cat', 'is', 'in front of', 'the', 'door', 'next to', 'me']);
    expect(palavras[3].entrada).toBe('in front of');
    expect(palavras[6].entrada).toBe('next to');
  });

  it('remontar os trechos devolve a frase original', () => {
    const frase = "I can't find my keys. Where is the bathroom?";
    expect(tokenizar(frase).map((t) => t.texto).join('')).toBe(frase);
  });

  it('substantivo do conteúdo tem explicação de contável e sentidos extras', () => {
    const glass = entradaPorId('glass')!;
    expect(glass.palavraId).toBe('glass');
    expect(glass.explicacao).toContain('a glass');
    expect(glass.contextos.some((c) => c.en.includes('glasses'))).toBe(true);
    expect(entradaPorId('water')!.explicacao).toContain('Não se conta');
  });
});
