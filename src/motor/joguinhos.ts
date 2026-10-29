/** Os joguinhos de cada degrau, por tipo de item. Ver a tabela da seção "Joguinhos" do plano. */
import { embaralhar, type Aleatorio } from '@/gerador/aleatorio';
import type { TipoItem } from '@/store/tipos';

export type Joguinho =
  | 'card-novo'
  | 'en-pt'
  | 'pares'
  | 'onde-esta'
  | 'pt-en'
  | 'completar'
  | 'ouvir-escolher'
  | 'montar-blocos'
  | 'achar-erro'
  | 'desmontar'
  | 'blocos-sobrando'
  | 'digitar'
  | 'ouvir-escrever'
  | 'frases-longas';

export const NOME_JOGUINHO: Record<Joguinho, string> = {
  'card-novo': 'Card novo',
  'en-pt': 'Inglês → português',
  pares: 'Ligar pares',
  'onde-esta': 'Onde está?',
  'pt-en': 'Português → inglês',
  completar: 'Completar a frase',
  'ouvir-escolher': 'Ouvir e escolher',
  'montar-blocos': 'Montar com blocos',
  'achar-erro': 'Achar o erro',
  desmontar: 'Desmontar o português',
  'blocos-sobrando': 'Blocos sobrando',
  digitar: 'Digitar a tradução',
  'ouvir-escrever': 'Ouvir e escrever',
  'frases-longas': 'Frases longas',
};

type Tabela = Record<number, Joguinho[]>;

const POR_TIPO: Record<TipoItem, Tabela> = {
  palavra: {
    0: ['card-novo'],
    1: ['en-pt', 'pares'],
    2: ['pt-en', 'completar', 'ouvir-escolher'],
    3: ['montar-blocos', 'achar-erro'],
    4: ['blocos-sobrando', 'digitar', 'ouvir-escrever'],
    5: ['frases-longas', 'digitar', 'ouvir-escrever'],
  },
  molde: {
    0: ['card-novo'],
    1: ['en-pt', 'onde-esta'],
    2: ['completar', 'ouvir-escolher'],
    3: ['montar-blocos', 'achar-erro'],
    4: ['blocos-sobrando', 'digitar', 'ouvir-escrever'],
    5: ['frases-longas'],
  },
  contracao: {
    0: ['card-novo'],
    1: ['en-pt'],
    2: ['pt-en', 'completar'],
    3: ['desmontar'],
    4: ['digitar'],
    5: ['desmontar', 'digitar'],
  },
};

/**
 * Joguinhos possíveis para um item num degrau. "Onde está?" só serve para preposições de lugar.
 * Com `disponiveis`, só entram os joguinhos que já existem no app; se o degrau não tem nenhum,
 * desce um degrau por vez até achar.
 */
export function joguinhosPossiveis(
  tipo: TipoItem,
  degrau: number,
  estrutura?: string,
  disponiveis?: ReadonlySet<Joguinho>,
): Joguinho[] {
  for (let d = Math.max(0, Math.min(5, degrau)); d >= 0; d--) {
    const lista = POR_TIPO[tipo][d].filter(
      (j) => (j !== 'onde-esta' || estrutura === 'preposicoes-lugar') && (!disponiveis || disponiveis.has(j)),
    );
    if (lista.length > 0 || !disponiveis) return lista;
  }
  return [];
}

/** Joguinhos que precisam de uma frase gerada. */
export function precisaFrase(joguinho: Joguinho, tipo: TipoItem): boolean {
  if (joguinho === 'card-novo' || tipo === 'contracao') return false;
  if (tipo === 'molde') return true;
  return !['en-pt', 'pares', 'pt-en'].includes(joguinho);
}

/**
 * Escolhe o joguinho de um exercício.
 * Evita um terceiro igual seguido e, se der, um que o item já teve nesta lição.
 */
export function escolherJoguinho(
  tipo: TipoItem,
  degrau: number,
  aleatorio: Aleatorio,
  ultimos: readonly Joguinho[],
  jaUsadosNoItem: readonly Joguinho[] = [],
  estrutura?: string,
  disponiveis?: ReadonlySet<Joguinho>,
): Joguinho {
  const possiveis = embaralhar(joguinhosPossiveis(tipo, degrau, estrutura, disponiveis), aleatorio);
  const repetiria = (j: Joguinho) => ultimos.length >= 2 && ultimos.at(-1) === j && ultimos.at(-2) === j;
  return (
    possiveis.find((j) => !repetiria(j) && !jaUsadosNoItem.includes(j)) ??
    possiveis.find((j) => !repetiria(j)) ??
    possiveis[0]
  );
}
