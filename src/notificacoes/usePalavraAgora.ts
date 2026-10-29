import { useEffect, useState } from 'react';

import type { Palavra } from '@/conteudo/tipos';
import { useProgresso } from '@/store/progresso';
import { useAgora } from '@/util/useAgora';

import { configDoPerfil, palavraDaTroca, trocaAgora } from './palavraDoDia';
import { chaveConfig, type Troca } from './trocas';

/** A palavra da troca atual (a mesma da tela de bloqueio) e a hora da próxima troca. */
export function usePalavraAgora(): { troca: Troca; palavra: Palavra | null } {
  const perfil = useProgresso((s) => s.perfil);
  const agora = useAgora();
  const troca = trocaAgora(perfil, agora);
  const config = chaveConfig(configDoPerfil(perfil));
  const [resultado, setResultado] = useState<{ chave: string; palavra: Palavra } | null>(null);
  const chave = `${config}#${troca.numero}`;

  useEffect(() => {
    let ativo = true;
    palavraDaTroca(useProgresso.getState().perfil, troca.numero, useProgresso.getState().itens).then((palavra) => {
      if (ativo) setResultado({ chave, palavra });
    });
    return () => {
      ativo = false;
    };
  }, [chave, troca.numero]);

  return { troca, palavra: resultado?.chave === chave ? resultado.palavra : null };
}
