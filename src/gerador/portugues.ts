/**
 * Regras de português do gerador: gênero, artigos e contrações.
 * A mesma tabela de contrações serve para montar frases ("em + a = na")
 * e para o joguinho "Desmontar o português", ao contrário.
 */

export type Genero = 'm' | 'f';

export function artigoDefinido(genero: Genero, plural = false): string {
  if (plural) return genero === 'f' ? 'as' : 'os';
  return genero === 'f' ? 'a' : 'o';
}

export function artigoIndefinido(genero: Genero): string {
  return genero === 'f' ? 'uma' : 'um';
}

export function numeroDois(genero: Genero): string {
  return genero === 'f' ? 'duas' : 'dois';
}

/** Preposição + palavra seguinte → forma contraída. Só o que o português padrão contrai. */
const CONTRACOES: Record<string, Record<string, string>> = {
  em: {
    o: 'no', a: 'na', os: 'nos', as: 'nas',
    um: 'num', uma: 'numa', uns: 'nuns', umas: 'numas',
    este: 'neste', esta: 'nesta', estes: 'nestes', estas: 'nestas',
    esse: 'nesse', essa: 'nessa', esses: 'nesses', essas: 'nessas',
    aquele: 'naquele', aquela: 'naquela', aqueles: 'naqueles', aquelas: 'naquelas',
    isto: 'nisto', isso: 'nisso', aquilo: 'naquilo',
    ele: 'nele', ela: 'nela', eles: 'neles', elas: 'nelas',
  },
  de: {
    o: 'do', a: 'da', os: 'dos', as: 'das',
    este: 'deste', esta: 'desta', estes: 'destes', estas: 'destas',
    esse: 'desse', essa: 'dessa', esses: 'desses', essas: 'dessas',
    aquele: 'daquele', aquela: 'daquela', aqueles: 'daqueles', aquelas: 'daquelas',
    isto: 'disto', isso: 'disso', aquilo: 'daquilo',
    ele: 'dele', ela: 'dela', eles: 'deles', elas: 'delas',
  },
  a: {
    o: 'ao', a: 'à', os: 'aos', as: 'às',
    aquele: 'àquele', aquela: 'àquela', aqueles: 'àqueles', aquelas: 'àquelas', aquilo: 'àquilo',
  },
  por: { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas' },
};

/** "em" + "a" → "na"; "de" + "um" → "de um" (não contrai). */
export function contrair(preposicao: string, palavra: string): string {
  return CONTRACOES[preposicao]?.[palavra] ?? `${preposicao} ${palavra}`;
}

/** "na" → ["em", "a"]. Devolve null se não for uma contração conhecida. */
export function desmontar(contracao: string): [string, string] | null {
  for (const [preposicao, tabela] of Object.entries(CONTRACOES)) {
    for (const [palavra, forma] of Object.entries(tabela)) {
      if (forma === contracao) return [preposicao, palavra];
    }
  }
  return null;
}

/**
 * Junta uma preposição (de uma ou várias palavras) com o artigo e o substantivo.
 * "dentro de" + "a" + "caixa" → "dentro da caixa"; "em" + "o" + "quarto" → "no quarto".
 */
export function juntarComPreposicao(preposicao: string, artigo: string, substantivo: string): string {
  const partes = preposicao.split(' ');
  const ultima = partes.pop() as string;
  const contraida = contrair(ultima, artigo);
  return [...partes, contraida, substantivo].join(' ');
}

/** Primeira letra maiúscula. */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Gênero de um determinante, usado nos testes e nas explicações de erro. */
export function generoDoDeterminante(palavra: string): Genero | null {
  const masculinos = ['o', 'um', 'no', 'do', 'num', 'dois', 'ao', 'pelo', 'os', 'nos', 'dos', 'aos', 'pelos'];
  const femininos = ['a', 'uma', 'na', 'da', 'numa', 'duas', 'à', 'pela', 'as', 'nas', 'das', 'às', 'pelas'];
  const p = palavra.toLowerCase();
  if (masculinos.includes(p)) return 'm';
  if (femininos.includes(p)) return 'f';
  return null;
}
