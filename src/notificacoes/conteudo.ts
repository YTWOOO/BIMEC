import { nomeDoTema } from '@/conteudo/temas';
import type { Palavra } from '@/conteudo/tipos';

export const ID_PALAVRA_DO_DIA = 'bimec-palavra-do-dia';
export const CANAL_PALAVRA = 'palavra-do-dia';
export const CANAL_LEMBRETES = 'lembretes';
export const TIPO_PALAVRA = 'palavra-do-dia';

export interface TextoNotificacao {
  title: string;
  subtitle: string;
  body: string;
  data: { tipo: string; palavraId: string; url: string };
}

/** Título "apple — maçã", frase de exemplo e tradução embaixo, tema no canto. */
export function textoDaPalavra(p: Palavra): TextoNotificacao {
  return {
    title: `${p.en} — ${p.pt}`,
    subtitle: nomeDoTema(p.tema),
    body: `${p.exemplo.en}\n${p.exemplo.pt}`,
    data: { tipo: TIPO_PALAVRA, palavraId: p.id, url: `/palavra/${p.id}` },
  };
}
