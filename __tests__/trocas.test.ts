import { describe, expect, it } from '@jest/globals';

import { PALAVRAS } from '@/conteudo/palavras';
import { ID_PALAVRA_DO_DIA, textoDaPalavra } from '@/notificacoes/conteudo';
import {
  calcularTroca,
  chaveConfig,
  palavraDaTroca,
  trocasParaRegistrar,
  trocasPorDia,
  type ConfigTrocas,
} from '@/notificacoes/trocas';
import { formatarHora } from '@/util/datas';

const padrao: ConfigTrocas = { intervaloHoras: 3, silencio: { inicio: '23:00', fim: '07:00' } };

/** Data local: 29/10/2026 às hh:mm. */
function em(dia: number, hh: number, mm = 0): Date {
  return new Date(2026, 9, dia, hh, mm);
}

describe('trocas por dia', () => {
  it('3 h com silêncio de 23h às 7h: 07, 10, 13, 16, 19, 22', () => {
    expect(trocasPorDia(padrao)).toBe(6);
  });

  it('6 h com o mesmo silêncio: 07, 13, 19', () => {
    expect(trocasPorDia({ ...padrao, intervaloHoras: 6 })).toBe(3);
  });

  it('sem silêncio (início igual ao fim): o dia inteiro', () => {
    expect(trocasPorDia({ intervaloHoras: 3, silencio: { inicio: '07:00', fim: '07:00' } })).toBe(8);
  });

  it('silêncio que não cruza a meia-noite (01h às 06h)', () => {
    // ativo das 06h à 01h: 19 h → 7 trocas de 3 h
    expect(trocasPorDia({ intervaloHoras: 3, silencio: { inicio: '01:00', fim: '06:00' } })).toBe(7);
  });
});

describe('calcularTroca', () => {
  it('às 07:00 começa a primeira troca do dia', () => {
    const t = calcularTroca(em(29, 7), padrao);
    expect(formatarHora(t.inicio)).toBe('07:00');
    expect(formatarHora(t.proxima)).toBe('10:00');
  });

  it('às 21:59 vale a troca das 19:00, e a próxima é às 22:00', () => {
    const t = calcularTroca(em(29, 21, 59), padrao);
    expect(formatarHora(t.inicio)).toBe('19:00');
    expect(formatarHora(t.proxima)).toBe('22:00');
  });

  it('no silêncio fica a troca das 22:00 até as 07:00 do dia seguinte', () => {
    const noite = calcularTroca(em(29, 23, 30), padrao);
    const madrugada = calcularTroca(em(30, 5, 0), padrao);
    expect(madrugada.numero).toBe(noite.numero);
    expect(formatarHora(madrugada.inicio)).toBe('22:00');
    expect(madrugada.inicio.getDate()).toBe(29);
    expect(formatarHora(madrugada.proxima)).toBe('07:00');
    expect(madrugada.proxima.getDate()).toBe(30);
  });

  it('a numeração segue sem buracos de um dia para o outro', () => {
    const ultimaDoDia = calcularTroca(em(29, 22, 10), padrao);
    const primeiraDoOutro = calcularTroca(em(30, 7, 0), padrao);
    expect(primeiraDoOutro.numero).toBe(ultimaDoDia.numero + 1);
  });

  it('dentro da mesma troca o número não muda', () => {
    expect(calcularTroca(em(29, 10, 0), padrao).numero).toBe(calcularTroca(em(29, 12, 59), padrao).numero);
  });

  it('a próxima troca calculada começa exatamente na hora prevista', () => {
    for (const hora of [7, 9, 13, 18, 22, 23, 2, 6]) {
      const t = calcularTroca(em(29, hora, 15), padrao);
      const seguinte = calcularTroca(t.proxima, padrao);
      expect(seguinte.numero).toBe(t.numero + 1);
      expect(seguinte.inicio.getTime()).toBe(t.proxima.getTime());
    }
  });
});

describe('palavra de cada troca', () => {
  it('segue a ordem da lista e dá a volta', () => {
    expect(palavraDaTroca(0, PALAVRAS).id).toBe(PALAVRAS[0].id);
    expect(palavraDaTroca(PALAVRAS.length, PALAVRAS).id).toBe(PALAVRAS[0].id);
    expect(palavraDaTroca(-1, PALAVRAS).id).toBe(PALAVRAS[PALAVRAS.length - 1].id);
  });

  it('o texto da notificação tem palavra, tradução e exemplo', () => {
    const apple = PALAVRAS.find((p) => p.id === 'apple')!;
    const t = textoDaPalavra(apple);
    expect(t.title).toBe('apple — maçã');
    expect(t.body).toBe('An apple inside a book.\nUma maçã dentro de um livro.');
    expect(t.subtitle).toBe('Comida e bebida');
    expect(t.data.url).toBe('/palavra/apple');
    expect(ID_PALAVRA_DO_DIA).toBe('bimec-palavra-do-dia');
  });
});

describe('palavras vistas na tela de bloqueio', () => {
  const cfg = chaveConfig(padrao);

  it('primeira vez: só a troca atual', () => {
    expect(trocasParaRegistrar(100, cfg, null, 60)).toEqual([100]);
  });

  it('registra as trocas que passaram desde a última vez', () => {
    expect(trocasParaRegistrar(103, cfg, { numero: 100, config: cfg }, 60)).toEqual([101, 102, 103]);
  });

  it('nada novo se a troca é a mesma', () => {
    expect(trocasParaRegistrar(100, cfg, { numero: 100, config: cfg }, 60)).toEqual([]);
  });

  it('se a configuração mudou, só a troca atual', () => {
    expect(trocasParaRegistrar(500, cfg, { numero: 100, config: 'outra' }, 60)).toEqual([500]);
  });

  it('nunca registra mais que o limite', () => {
    expect(trocasParaRegistrar(1000, cfg, { numero: 10, config: cfg }, 60)).toHaveLength(60);
  });
});
