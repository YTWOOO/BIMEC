/** Ponto único de acesso ao conteúdo do app. */
import contracoesJson from './contracoes.json';
import moldesJson from './moldes.json';
import preposicoesJson from './preposicoes.json';
import type { Contracao, Molde, Preposicao, Unidade } from './tipos';
import unidadesJson from './unidades.json';

export { ESTRUTURAS, nomeDaEstrutura } from './estruturas';
export { PALAVRAS, palavraPorId } from './palavras';
export { TEMAS, nomeDoTema } from './temas';

export const MOLDES = moldesJson as unknown as Molde[];
export const PREPOSICOES = preposicoesJson as unknown as Preposicao[];
export const CONTRACOES = contracoesJson as unknown as Contracao[];
export const UNIDADES = unidadesJson as unknown as Unidade[];

export function preposicaoPorEn(en: string): Preposicao | undefined {
  return PREPOSICOES.find((p) => p.en === en);
}
