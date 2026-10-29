import { createContext, useContext } from 'react';

export interface PedidoFicha {
  /** Id da ficha, ou null se a palavra não está no dicionário. */
  id: string | null;
  /** Palavra como apareceu na frase. */
  texto: string;
}

export interface ValorDicionario {
  abrir: (id: string | null, texto: string) => void;
  /** Quantas fichas já foram abertas. Os joguinhos usam para saber se o Ícaro pediu ajuda. */
  aberturas: number;
}

export const ContextoDicionario = createContext<ValorDicionario>({ abrir: () => {}, aberturas: 0 });

export function useDicionario(): ValorDicionario {
  return useContext(ContextoDicionario);
}
