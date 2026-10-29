/**
 * Revisão espaçada e escada de degraus. Regras da seção "Motor de dificuldade e revisão" do plano:
 * - Degrau 0 → 1 ao ver o card de apresentação.
 * - Sobe um degrau com 2 acertos seguidos, em lições diferentes.
 * - Errou: desce 1 (nunca abaixo do 1), zera os acertos seguidos, intervalo volta a 1 dia, facilidade −0,2.
 * - "Fácil demais": sobe 2 degraus e o intervalo vai para 7 dias.
 * - Intervalos após acerto: 1 dia, 3 dias, depois intervalo × facilidade, até 120 dias.
 * - Acerto rápido e sem dica: facilidade +0,05.
 * Só a primeira resposta de cada lição mexe no degrau e no intervalo: repetir o item no fim
 * da mesma lição (depois de errar) não conta como revisão.
 */
import { itemPadrao } from '@/store/padrao';
import type { ItemProgresso, TipoItem } from '@/store/tipos';
import { somarDias } from '@/util/datas';

export const DEGRAU_MAX = 5;
export const ACERTOS_PARA_SUBIR = 2;
export const FACILIDADE_INICIAL = 2.3;
export const FACILIDADE_MIN = 1.3;
export const FACILIDADE_MAX = 2.8;
export const INTERVALO_MAX = 120;
/** Resposta abaixo deste tempo conta como rápida. */
export const MS_RAPIDO = 6000;

export interface DadosResposta {
  acertou: boolean;
  /** Tempo para responder, em milissegundos. */
  ms: number;
  usouDica: boolean;
  licaoId: string;
  /** Dia da resposta, "AAAA-MM-DD". */
  hoje: string;
}

export function novoItem(id: string, tipo: TipoItem): ItemProgresso {
  return itemPadrao(id, tipo);
}

/** O item precisa ser revisado hoje (ou já passou do dia). */
export function estaVencido(item: ItemProgresso, hoje: string): boolean {
  return item.degrau >= 1 && item.proximaRevisao !== null && item.proximaRevisao <= hoje;
}

/** Próximo intervalo depois de um acerto: 1, 3, depois × facilidade. */
export function proximoIntervalo(atual: number, facilidade: number): number {
  if (atual < 1) return 1;
  if (atual < 3) return 3;
  return Math.min(INTERVALO_MAX, Math.round(atual * facilidade));
}

/** Card de apresentação visto: o item entra no degrau 1 e fica para praticar hoje. */
export function apresentar(item: ItemProgresso, hoje: string): ItemProgresso {
  return {
    ...item,
    degrau: Math.max(1, item.degrau),
    vistoEm: item.vistoEm ?? hoje,
    proximaRevisao: item.proximaRevisao ?? hoje,
  };
}

export function registrarResposta(item: ItemProgresso, r: DadosResposta): ItemProgresso {
  const base = item.degrau === 0 ? apresentar(item, r.hoje) : item;
  const primeiraNaLicao = base.ultimaLicao !== r.licaoId;
  const comum = {
    ...base,
    ultimaLicao: r.licaoId,
    vistoEm: base.vistoEm ?? r.hoje,
  };

  if (r.acertou) {
    const contado = { ...comum, acertos: base.acertos + 1 };
    if (!primeiraNaLicao) return contado;

    const intervalo = proximoIntervalo(base.intervaloDias, base.facilidade);
    const rapido = r.ms < MS_RAPIDO && !r.usouDica;
    const facilidade = rapido ? Math.min(FACILIDADE_MAX, base.facilidade + 0.05) : base.facilidade;
    let degrau = base.degrau;
    let acertosSeguidos = base.acertosSeguidos + 1;
    if (acertosSeguidos >= ACERTOS_PARA_SUBIR && degrau < DEGRAU_MAX) {
      degrau += 1;
      acertosSeguidos = 0;
    }
    return {
      ...contado,
      degrau,
      acertosSeguidos,
      intervaloDias: intervalo,
      facilidade: arredondar(facilidade),
      proximaRevisao: somarDias(r.hoje, intervalo),
    };
  }

  const errado = { ...comum, erros: base.erros + 1, acertosSeguidos: 0 };
  if (!primeiraNaLicao) return errado;
  return {
    ...errado,
    degrau: Math.max(1, base.degrau - 1),
    intervaloDias: 1,
    facilidade: arredondar(Math.max(FACILIDADE_MIN, base.facilidade - 0.2)),
    proximaRevisao: somarDias(r.hoje, 1),
  };
}

/** Botão "fácil demais": pula 2 degraus e manda a revisão para daqui a 7 dias. */
export function facilDemais(item: ItemProgresso, hoje: string): ItemProgresso {
  const base = item.degrau === 0 ? apresentar(item, hoje) : item;
  return {
    ...base,
    degrau: Math.min(DEGRAU_MAX, base.degrau + 2),
    acertosSeguidos: 0,
    intervaloDias: 7,
    proximaRevisao: somarDias(hoje, 7),
  };
}

/** Evita 2.3000000000000003 nos dados salvos. */
function arredondar(n: number): number {
  return Math.round(n * 100) / 100;
}
