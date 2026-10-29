import { beforeEach, describe, expect, it } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PALAVRAS } from '@/conteudo';
import { escolherPalavraDaTroca, palavraDecidida } from '@/notificacoes/escolha';
import { itemPadrao } from '@/store/padrao';
import type { ItemProgresso } from '@/store/tipos';

function visto(id: string, extra: Partial<ItemProgresso> = {}): ItemProgresso {
  return { ...itemPadrao(id), vistoEm: '2026-10-29', ...extra };
}

describe('palavra da tela de bloqueio pelo motor', () => {
  it('sem nada visto, começa pela primeira palavra do conteúdo', () => {
    expect(escolherPalavraDaTroca(4, {}).id).toBe(PALAVRAS[0].id);
  });

  it('1 troca a cada 3 traz palavra nova; as outras, revisão', () => {
    const itens = { apple: visto('apple'), banana: visto('banana') };
    expect(escolherPalavraDaTroca(9, itens).id).toBe('orange');
    for (const n of [10, 11]) expect(['apple', 'banana']).toContain(escolherPalavraDaTroca(n, itens).id);
  });

  it('revisão prefere a palavra mais atrasada e evita repetir a anterior', () => {
    const itens = {
      apple: visto('apple', { proximaRevisao: '2026-10-20', degrau: 2 }),
      banana: visto('banana', { proximaRevisao: '2026-12-01', degrau: 2 }),
    };
    const escolhas = [1, 2, 4, 5].map((n) => escolherPalavraDaTroca(n, itens, PALAVRAS, new Set(), 'apple').id);
    expect(escolhas.every((id) => id === 'banana')).toBe(true);
  });

  it('palavras já decididas contam como vistas', () => {
    expect(escolherPalavraDaTroca(3, {}, PALAVRAS, new Set(['apple'])).id).toBe('banana');
  });
});

describe('decisão guardada por troca', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('a mesma troca devolve sempre a mesma palavra, mesmo se o progresso mudar', async () => {
    const primeira = await palavraDecidida(30, 'cfg', () => ({}));
    const depois = await palavraDecidida(30, 'cfg', () => ({ [primeira.id]: visto(primeira.id) }));
    expect(depois.id).toBe(primeira.id);
  });

  it('a próxima nova não repete a nova já decidida', async () => {
    const a = await palavraDecidida(30, 'cfg', () => ({}));
    const b = await palavraDecidida(33, 'cfg', () => ({}));
    expect(a.id).toBe(PALAVRAS[0].id);
    expect(b.id).toBe(PALAVRAS[1].id);
  });

  it('mudar a configuração começa as decisões do zero', async () => {
    await palavraDecidida(30, 'cfg-a', () => ({}));
    const outra = await palavraDecidida(30, 'cfg-b', () => ({ [PALAVRAS[0].id]: visto(PALAVRAS[0].id) }));
    expect(outra.id).toBe(PALAVRAS[1].id);
  });
});
