/**
 * Cálculo puro das trocas da palavra na tela de bloqueio.
 *
 * O dia ativo começa no fim do horário de silêncio e vai até o início dele.
 * A palavra troca a cada `intervaloHoras` dentro desse período; a última troca
 * do dia fica na tela durante o silêncio, até o fim dele no dia seguinte.
 *
 * Cada troca tem um número que só depende da hora e da configuração, então o app,
 * a tarefa de fundo e a notificação agendada sempre concordam sobre a palavra.
 */

import type { Palavra } from '@/conteudo/tipos';

export interface ConfigTrocas {
  intervaloHoras: number;
  silencio: { inicio: string; fim: string };
}

export interface Troca {
  /** Número da troca, contado desde a âncora. */
  numero: number;
  /** Quando esta troca começou. */
  inicio: Date;
  /** Quando acontece a próxima troca. */
  proxima: Date;
}

/** Dia de referência para numerar as trocas. */
const ANCORA = Date.UTC(2026, 0, 1);
const MINUTOS_DIA = 24 * 60;

export function paraMinutos(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

/** Texto curto que identifica a configuração; se mudar, a numeração muda. */
export function chaveConfig(cfg: ConfigTrocas): string {
  return `${cfg.intervaloHoras}h|${cfg.silencio.inicio}-${cfg.silencio.fim}`;
}

/** Quantas trocas cabem em um dia ativo. */
export function trocasPorDia(cfg: ConfigTrocas): number {
  const fim = paraMinutos(cfg.silencio.fim);
  const inicio = paraMinutos(cfg.silencio.inicio);
  const ativo = inicio === fim ? MINUTOS_DIA : (((inicio - fim) % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  return Math.max(1, Math.ceil(ativo / (cfg.intervaloHoras * 60)));
}

export function calcularTroca(agora: Date, cfg: ConfigTrocas): Troca {
  const fimSilencio = paraMinutos(cfg.silencio.fim);
  const passo = cfg.intervaloHoras * 60;
  const porDia = trocasPorDia(cfg);

  const minutoAgora = agora.getHours() * 60 + agora.getMinutes();
  // O ciclo de hoje começa no fim do silêncio; antes disso ainda vale o ciclo de ontem.
  const voltaUmDia = minutoAgora < fimSilencio ? 1 : 0;
  const a = agora.getFullYear();
  const m = agora.getMonth();
  const d = agora.getDate() - voltaUmDia;

  const inicioCiclo = new Date(a, m, d, 0, fimSilencio);
  const decorrido = Math.floor((agora.getTime() - inicioCiclo.getTime()) / 60000);
  const k = Math.min(Math.floor(decorrido / passo), porDia - 1);

  const inicio = new Date(a, m, d, 0, fimSilencio + k * passo);
  const proxima =
    k + 1 < porDia ? new Date(a, m, d, 0, fimSilencio + (k + 1) * passo) : new Date(a, m, d + 1, 0, fimSilencio);

  const diaDoCiclo = new Date(a, m, d);
  const dias = Math.round(
    (Date.UTC(diaDoCiclo.getFullYear(), diaDoCiclo.getMonth(), diaDoCiclo.getDate()) - ANCORA) / 86400000,
  );

  return { numero: dias * porDia + k, inicio, proxima };
}

/** Palavra mostrada numa troca. Por enquanto, em ordem; o motor entra na etapa 4. */
export function palavraDaTroca(numero: number, palavras: Palavra[]): Palavra {
  const n = palavras.length;
  return palavras[((numero % n) + n) % n];
}

/**
 * Números de troca que devem ser marcados como vistos desde a última vez.
 * Se a configuração mudou ou a numeração voltou, só a troca atual conta.
 */
export function trocasParaRegistrar(
  atual: number,
  configAtual: string,
  ultima: { numero: number; config: string } | null,
  limite: number,
): number[] {
  if (!ultima || ultima.config !== configAtual || ultima.numero > atual) return [atual];
  if (ultima.numero === atual) return [];
  const desde = Math.max(ultima.numero + 1, atual - limite + 1);
  const numeros: number[] = [];
  for (let n = desde; n <= atual; n++) numeros.push(n);
  return numeros;
}
