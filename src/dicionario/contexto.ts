import { createContext, useContext } from 'react';

export interface PedidoFicha {
  /** Id da ficha, ou null se a palavra não está no dicionário. */
  id: string | null;
  /** Palavra como apareceu na frase. */
  texto: string;
}

export interface ValorDicionario {
  abrir: (id: string | null, texto: string) => void;
}

export const ContextoDicionario = createContext<ValorDicionario>({ abrir: () => {} });

export function useDicionario(): ValorDicionario {
  return useContext(ContextoDicionario);
}
