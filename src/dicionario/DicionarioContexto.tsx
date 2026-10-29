import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { ContextoDicionario, type PedidoFicha } from './contexto';
import { FichaPalavra } from './FichaPalavra';

/** Guarda a pilha de fichas abertas: tocar numa palavra dentro da ficha abre outra por cima. */
export function DicionarioProvider({ children }: { children: ReactNode }) {
  const [pilha, setPilha] = useState<PedidoFicha[]>([]);
  const [aberturas, setAberturas] = useState(0);

  const abrir = useCallback((id: string | null, texto: string) => {
    setPilha((p) => [...p, { id, texto }]);
    setAberturas((n) => n + 1);
  }, []);
  const voltar = useCallback(() => setPilha((p) => p.slice(0, -1)), []);
  const fechar = useCallback(() => setPilha([]), []);

  const valor = useMemo(() => ({ abrir, aberturas }), [abrir, aberturas]);

  return (
    <ContextoDicionario.Provider value={valor}>
      {children}
      <FichaPalavra
        pedido={pilha.at(-1) ?? null}
        podeVoltar={pilha.length > 1}
        aoVoltar={voltar}
        aoFechar={fechar}
      />
    </ContextoDicionario.Provider>
  );
}
