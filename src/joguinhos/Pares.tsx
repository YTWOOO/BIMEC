import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Texto } from '@/ui/Texto';
import { espaco } from '@/ui/tema';
import { falar } from '@/util/audio';

import { OpcaoBotao, type EstadoOpcao } from './OpcaoBotao';
import type { PerguntaPares, Resposta } from './tipos';

type Props = {
  pergunta: PerguntaPares;
  /** Chamado quando todos os pares estão ligados. */
  aoConcluir: (r: Resposta) => void;
  concluido: boolean;
};

/** Ligar pares: toca numa palavra de cada coluna. Erro pisca em vermelho e conta. */
export function Pares({ pergunta: p, aoConcluir, concluido }: Props) {
  const [en, setEn] = useState<string | null>(null);
  const [pt, setPt] = useState<string | null>(null);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [erro, setErro] = useState<{ en: string; pt: string } | null>(null);
  const [erros, setErros] = useState(0);
  const [errosNoAlvo, setErrosNoAlvo] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const tentar = (idEn: string, idPt: string) => {
    setEn(null);
    setPt(null);
    if (idEn === idPt) {
      const novos = [...feitos, idEn];
      setFeitos(novos);
      if (novos.length === p.pares.length) aoConcluir({ tipo: 'pares', erros, errosNoAlvo });
      return;
    }
    setErros(erros + 1);
    if (idEn === p.alvo || idPt === p.alvo) setErrosNoAlvo(errosNoAlvo + 1);
    setErro({ en: idEn, pt: idPt });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setErro(null), 650);
  };

  const tocarEn = (id: string) => {
    const par = p.pares.find((x) => x.id === id);
    if (par) falar(par.en);
    if (pt) tentar(id, pt);
    else setEn(en === id ? null : id);
  };

  const tocarPt = (id: string) => {
    if (en) tentar(en, id);
    else setPt(pt === id ? null : id);
  };

  const estado = (id: string, lado: 'en' | 'pt'): EstadoOpcao => {
    if (feitos.includes(id)) return 'certa';
    if (erro && erro[lado] === id) return 'errada';
    if ((lado === 'en' ? en : pt) === id) return 'escolhida';
    return 'normal';
  };

  const coluna = (lado: 'en' | 'pt') => (
    <View style={estilos.coluna}>
      {(lado === 'en' ? p.ordemEn : p.ordemPt).map((id) => {
        const par = p.pares.find((x) => x.id === id);
        if (!par) return null;
        const texto = lado === 'en' ? par.en : par.pt;
        return (
          <OpcaoBotao
            key={id}
            testID={`par-${lado}-${id}`}
            compacto
            estado={estado(id, lado)}
            texto={texto}
            lingua={lado}
            rotulo={texto}
            desativado={concluido || feitos.includes(id)}
            onPress={() => (lado === 'en' ? tocarEn(id) : tocarPt(id))}
          />
        );
      })}
    </View>
  );

  return (
    <View style={estilos.raiz}>
      <View style={estilos.colunas}>
        {coluna('en')}
        {coluna('pt')}
      </View>
      <Texto variante="rotulo" style={estilos.contador}>
        {feitos.length} de {p.pares.length} pares{erros > 0 ? ` · ${erros} ${erros === 1 ? 'erro' : 'erros'}` : ''}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.x3,
  },
  colunas: {
    flexDirection: 'row',
    gap: espaco.x3,
  },
  coluna: {
    flex: 1,
    gap: espaco.x2 + 2,
  },
  contador: {
    textAlign: 'center',
  },
});
