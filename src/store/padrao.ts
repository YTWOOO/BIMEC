import type { DadosSalvos, ItemProgresso, Perfil } from './tipos';

/**
 * Versão do formato dos dados salvos.
 * Subir este número sempre que o formato mudar e tratar a mudança em `migrar`.
 */
export const VERSAO_ESQUEMA = 1;

export function perfilPadrao(): Perfil {
  return {
    xp: 0,
    xpHoje: 0,
    diaXpHoje: null,
    ofensiva: 0,
    ultimoDiaPraticado: null,
    metaDiariaXp: 30,
    horarioLembrete: '19:00',
    intervaloPalavraHoras: 3,
    silencio: { inicio: '23:00', fim: '07:00' },
    categoriasAtivas: [],
    nivelamentoFeito: false,
  };
}

export function dadosIniciais(): DadosSalvos {
  return { perfil: perfilPadrao(), itens: {}, historico: [] };
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Junta o que estava salvo com os valores padrão.
 * Campos novos ganham o valor padrão; campos que já existiam são mantidos.
 */
export function mesclarComPadrao(salvo: unknown): DadosSalvos {
  const base = dadosIniciais();
  if (!ehObjeto(salvo)) return base;
  const perfilSalvo = ehObjeto(salvo.perfil) ? salvo.perfil : {};
  const silencioSalvo = ehObjeto(perfilSalvo.silencio) ? perfilSalvo.silencio : {};
  return {
    perfil: {
      ...base.perfil,
      ...(perfilSalvo as Partial<Perfil>),
      silencio: { ...base.perfil.silencio, ...(silencioSalvo as Partial<Perfil['silencio']>) },
    },
    itens: ehObjeto(salvo.itens) ? (salvo.itens as Record<string, ItemProgresso>) : {},
    historico: Array.isArray(salvo.historico) ? (salvo.historico as DadosSalvos['historico']) : [],
  };
}

/** Converte dados de uma versão antiga para a atual. */
export function migrar(salvo: unknown, versaoSalva: number): DadosSalvos {
  // Versão 0: qualquer formato anterior ao primeiro esquema oficial.
  // Hoje basta completar com os padrões; versões futuras entram aqui em ordem.
  if (versaoSalva < VERSAO_ESQUEMA) {
    return mesclarComPadrao(salvo);
  }
  return mesclarComPadrao(salvo);
}
