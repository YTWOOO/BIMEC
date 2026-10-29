/**
 * Tema "planta técnica" do app.
 * Todas as cores, fontes e medidas saem daqui; nenhuma tela usa cor solta.
 */

export const cores = {
  fundo: '#0A1433',
  fundoTopo: '#0E1C47',
  fundoBase: '#070F28',
  fundoCard: '#0F1D47',
  grade: '#2A4C9A',
  traco: '#4F8CFF',
  tracoClaro: '#8EC5FF',
  tracoEscuro: '#2B5BD9',
  texto: '#E8F0FF',
  textoSuave: '#8FA6D6',
  acerto: '#3DE0B5',
  erro: '#FF6B81',
  ofensiva: '#FFC24B',
} as const;

export type NomeCor = keyof typeof cores;

/** Converte "#RRGGBB" em "rgba(r, g, b, a)". */
export function alfa(hex: string, a: number): string {
  const limpo = hex.replace('#', '');
  const r = parseInt(limpo.slice(0, 2), 16);
  const g = parseInt(limpo.slice(2, 4), 16);
  const b = parseInt(limpo.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Nomes das fontes carregadas em src/app/_layout.tsx. */
export const fontes = {
  sans: 'IBMPlexSans_400Regular',
  sansMedia: 'IBMPlexSans_500Medium',
  sansForte: 'IBMPlexSans_600SemiBold',
  sansNegrito: 'IBMPlexSans_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedia: 'IBMPlexMono_500Medium',
  monoForte: 'IBMPlexMono_600SemiBold',
} as const;

export const espaco = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 24,
  x6: 32,
  x8: 48,
} as const;

/** Cantos quase retos, como folhas de desenho. */
export const raio = 4;

/** Espessuras de traço. */
export const linha = {
  fina: 1,
  media: 1.5,
  forte: 2,
} as const;

/** Grade de fundo: linha fina a cada 16 px, linha forte a cada 80 px. */
export const grade = {
  passoFino: 16,
  passoForte: 80,
  opacidadeFina: 0.22,
  opacidadeForte: 0.4,
} as const;

/** Altura da barra de abas, sem contar a área segura de baixo. */
export const alturaAbas = 64;
