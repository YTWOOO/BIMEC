/**
 * Formato das perguntas que os joguinhos mostram.
 * Uma pergunta é montada a partir de um exercício do motor (item + joguinho) e já traz
 * tudo pronto: opções na ordem em que aparecem, resposta certa e explicação de cada erro.
 */
import type { Exercicio } from '@/motor/licao';

export type Lingua = 'en' | 'pt';

/** As 8 posições desenhadas no "Onde está?". */
export type Posicao = 'in' | 'inside' | 'on' | 'under' | 'next to' | 'behind' | 'in front of' | 'between';

export const POSICOES: readonly Posicao[] = ['in', 'inside', 'on', 'under', 'next to', 'behind', 'in front of', 'between'];

export interface Opcao {
  id: string;
  texto: string;
  lingua: Lingua;
  /** Por que esta opção está errada (vazio na certa). */
  explicacao?: string;
}

/** O que a correção mostra como resposta certa. */
export interface RespostaCerta {
  /** Frase ou palavra em inglês (tocável e com áudio). */
  en?: string;
  pt?: string;
  /** Observação curta, como "naquele = em + aquele". */
  nota?: string;
}

interface Base {
  exercicio: Exercicio;
  /** Pergunta mostrada no topo ("O que quer dizer?"). */
  enunciado: string;
  resposta: RespostaCerta;
}

export type Card =
  | { tipo: 'palavra'; palavraId: string }
  | {
      tipo: 'molde';
      nome: string;
      resumo: string;
      padraoEn: string;
      padraoPt: string;
      exemplos: { en: string; pt: string }[];
    }
  | { tipo: 'contracao'; contracaoId: string; trechoEn: string };

export interface PerguntaCard extends Base {
  tipo: 'card';
  card: Card;
}

/** Escolher uma opção: Inglês → português, Português → inglês, Ouvir e escolher. */
export interface PerguntaEscolha extends Base {
  tipo: 'escolha';
  /** Inglês mostrado no topo, tocável e com áudio. */
  en?: string;
  /** Português mostrado no topo. */
  pt?: string;
  /** Frase em português com um espaço para a opção: [antes, depois]. */
  ptComLacuna?: [string, string];
  /** Só áudio: o texto é falado e não aparece. */
  audio?: string;
  opcoes: Opcao[];
  certa: string;
}

export interface Par {
  id: string;
  en: string;
  pt: string;
}

export interface PerguntaPares extends Base {
  tipo: 'pares';
  pares: Par[];
  /** Ordem das colunas, por id do par. */
  ordemEn: string[];
  ordemPt: string[];
  /** Par do item que está sendo treinado: só os erros nele contam. */
  alvo: string;
}

export interface PerguntaOnde extends Base {
  tipo: 'onde';
  en: string;
  /** O que é a bolinha e o que é a caixa no desenho. */
  coisa: string;
  lugar: string;
  opcoes: Posicao[];
  certa: Posicao;
}

export type Trecho = { tipo: 'texto'; texto: string } | { tipo: 'lacuna'; indice: number };

export interface Lacuna {
  certa: string;
  opcoes: string[];
  /** Explicação para cada opção errada. */
  explicacoes: Record<string, string>;
  /** A lacuna começa a frase: mostrar com letra maiúscula. */
  maiuscula: boolean;
}

/** Completar a frase: até 2 lacunas, com a tradução em português de apoio. */
export interface PerguntaCompletar extends Base {
  tipo: 'completar';
  trechos: Trecho[];
  lacunas: Lacuna[];
  pt: string;
}

export type Pergunta = PerguntaCard | PerguntaEscolha | PerguntaPares | PerguntaOnde | PerguntaCompletar;

export type Resposta =
  | { tipo: 'card' }
  | { tipo: 'escolha'; opcao: string }
  | { tipo: 'pares'; errosNoAlvo: number; erros: number }
  | { tipo: 'onde'; posicao: Posicao }
  | { tipo: 'completar'; valores: (string | null)[] };

export interface Correcao {
  acertou: boolean;
  explicacoes: string[];
}
