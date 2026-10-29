import { beforeEach, describe, expect, it } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { VERSAO_ESQUEMA, dadosIniciais, mesclarComPadrao, migrar, perfilPadrao } from '@/store/padrao';
import { CHAVE_ARMAZENAMENTO, useProgresso } from '@/store/progresso';
import { contarVencidos, nivelAtual, resumoPalavras, xpDeHoje } from '@/store/selecionar';
import type { ItemProgresso } from '@/store/tipos';
import { diaLocal, somarMinutos } from '@/util/datas';

function item(parcial: Partial<ItemProgresso> & { id: string }): ItemProgresso {
  return {
    tipo: 'palavra',
    degrau: 0,
    acertosSeguidos: 0,
    intervaloDias: 0,
    facilidade: 2.3,
    proximaRevisao: null,
    vistoEm: null,
    acertos: 0,
    erros: 0,
    ...parcial,
  };
}

describe('valores padrão', () => {
  it('começa com o perfil do plano', () => {
    const p = perfilPadrao();
    expect(p.metaDiariaXp).toBe(30);
    expect(p.intervaloPalavraHoras).toBe(3);
    expect(p.horarioLembrete).toBe('19:00');
    expect(p.silencio).toEqual({ inicio: '23:00', fim: '07:00' });
  });

  it('cria objetos novos a cada chamada', () => {
    const a = dadosIniciais();
    const b = dadosIniciais();
    a.perfil.silencio.inicio = '22:00';
    expect(b.perfil.silencio.inicio).toBe('23:00');
  });
});

describe('migração dos dados salvos', () => {
  it('lixo vira dados iniciais', () => {
    expect(mesclarComPadrao(null)).toEqual(dadosIniciais());
    expect(mesclarComPadrao('texto')).toEqual(dadosIniciais());
  });

  it('mantém o que existia e completa campos que faltam', () => {
    const salvo = { perfil: { xp: 120, silencio: { inicio: '22:30' } }, itens: { apple: item({ id: 'apple' }) } };
    const r = mesclarComPadrao(salvo);
    expect(r.perfil.xp).toBe(120);
    expect(r.perfil.metaDiariaXp).toBe(30);
    expect(r.perfil.silencio).toEqual({ inicio: '22:30', fim: '07:00' });
    expect(r.itens.apple.id).toBe('apple');
    expect(r.historico).toEqual([]);
  });

  it('migra da versão 0 para a atual', () => {
    expect(VERSAO_ESQUEMA).toBe(2);
    const r = migrar({ perfil: { ofensiva: 4 } }, 0);
    expect(r.perfil.ofensiva).toBe(4);
    expect(r.perfil.intervaloPalavraHoras).toBe(3);
  });

  it('migra da versão 1: liga a palavra na tela de bloqueio', () => {
    const v1 = { perfil: { ...perfilPadrao(), metaDiariaXp: 50 }, itens: {}, historico: [] };
    delete (v1.perfil as Partial<typeof v1.perfil>).palavraNaTelaDeBloqueio;
    delete (v1.perfil as Partial<typeof v1.perfil>).ultimaTrocaRegistrada;
    const r = migrar(v1, 1);
    expect(r.perfil.metaDiariaXp).toBe(50);
    expect(r.perfil.palavraNaTelaDeBloqueio).toBe(true);
    expect(r.perfil.ultimaTrocaRegistrada).toBeNull();
  });
});

describe('store de progresso', () => {
  beforeEach(() => {
    useProgresso.getState().resetar();
  });

  it('muda o intervalo da palavra e a meta', () => {
    useProgresso.getState().definirIntervaloPalavra(6);
    useProgresso.getState().definirMetaDiaria(50);
    const { perfil } = useProgresso.getState();
    expect(perfil.intervaloPalavraHoras).toBe(6);
    expect(perfil.metaDiariaXp).toBe(50);
  });

  it('move horários dando a volta na meia-noite', () => {
    useProgresso.getState().moverSilencio('inicio', 90);
    useProgresso.getState().moverLembrete(-30);
    const { perfil } = useProgresso.getState();
    expect(perfil.silencio.inicio).toBe('00:30');
    expect(perfil.horarioLembrete).toBe('18:30');
  });

  it('registra palavras vistas sem apagar progresso que já existe', () => {
    useProgresso.getState().registrarPalavrasVistas(['apple', 'egg'], '2026-10-29', { numero: 7, config: 'x' });
    useProgresso.setState((s) => ({ itens: { ...s.itens, egg: { ...s.itens.egg, degrau: 3 } } }));
    useProgresso.getState().registrarPalavrasVistas(['egg', 'milk'], '2026-10-30');
    const { itens, perfil } = useProgresso.getState();
    expect(itens.apple.vistoEm).toBe('2026-10-29');
    expect(itens.egg.degrau).toBe(3);
    expect(itens.egg.vistoEm).toBe('2026-10-29');
    expect(itens.milk.vistoEm).toBe('2026-10-30');
    expect(perfil.ultimaTrocaRegistrada).toEqual({ numero: 7, config: 'x' });
  });

  it('liga e desliga a palavra na tela de bloqueio', () => {
    useProgresso.getState().definirPalavraNaTela(false);
    expect(useProgresso.getState().perfil.palavraNaTelaDeBloqueio).toBe(false);
  });

  it('resetar volta tudo ao padrão', () => {
    useProgresso.getState().definirMetaDiaria(10);
    useProgresso.getState().resetar();
    expect(useProgresso.getState().perfil).toEqual(perfilPadrao());
  });

  it('salva no armazenamento com a versão do esquema', async () => {
    useProgresso.getState().definirMetaDiaria(20);
    await new Promise((r) => setTimeout(r, 0));
    const bruto = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);
    expect(bruto).not.toBeNull();
    const salvo = JSON.parse(bruto as string);
    expect(salvo.version).toBe(VERSAO_ESQUEMA);
    expect(salvo.state.perfil.metaDiariaXp).toBe(20);
    expect(salvo.state.resetar).toBeUndefined();
    expect(salvo.state.hidratado).toBeUndefined();
  });
});

describe('seletores', () => {
  const itens = {
    a: item({ id: 'a', degrau: 5, vistoEm: '2026-10-01', proximaRevisao: '2026-10-20' }),
    b: item({ id: 'b', degrau: 3, vistoEm: '2026-10-02', proximaRevisao: '2026-11-30' }),
    c: item({ id: 'c', degrau: 2, tipo: 'molde', proximaRevisao: '2026-10-29' }),
    d: item({ id: 'd' }),
  };

  it('nível = soma dos degraus ÷ 20, para baixo, + 1', () => {
    expect(nivelAtual({})).toBe(1);
    // 5 + 3 + 2 + 0 = 10 → nível 1
    expect(nivelAtual(itens)).toBe(1);
    const vinte = Object.fromEntries(
      ['a', 'b', 'c', 'd'].map((id) => [id, item({ id, degrau: 5 })]),
    );
    // 4 × 5 = 20 → nível 2
    expect(nivelAtual(vinte)).toBe(2);
  });

  it('conta itens vencidos até hoje', () => {
    expect(contarVencidos(itens, '2026-10-29')).toBe(2);
  });

  it('resume as palavras', () => {
    expect(resumoPalavras(itens)).toEqual({ vistas: 2, dominadas: 1, emProgresso: 1 });
  });

  it('XP de hoje zera quando o dia muda', () => {
    expect(xpDeHoje({ xpHoje: 15, diaXpHoje: '2026-10-28' }, '2026-10-29')).toBe(0);
    expect(xpDeHoje({ xpHoje: 15, diaXpHoje: '2026-10-29' }, '2026-10-29')).toBe(15);
  });
});

describe('datas', () => {
  it('formata o dia local', () => {
    expect(diaLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('soma minutos em horários', () => {
    expect(somarMinutos('23:30', 60)).toBe('00:30');
    expect(somarMinutos('00:15', -30)).toBe('23:45');
    expect(somarMinutos('19:00', 30)).toBe('19:30');
  });
});
