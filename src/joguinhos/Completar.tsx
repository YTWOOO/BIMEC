import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FraseTocavel } from '@/dicionario/FraseTocavel';
import { capitalizar } from '@/gerador/portugues';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco, fontes } from '@/ui/tema';

import { OpcaoBotao, type EstadoOpcao } from './OpcaoBotao';
import type { Correcao, PerguntaCompletar, Resposta } from './tipos';

type Props = {
  pergunta: PerguntaCompletar;
  resposta: Resposta | null;
  aoMudar: (r: Resposta) => void;
  correcao: Correcao | null;
};

function igual(a: string | null, b: string) {
  return a !== null && a.toLowerCase() === b.toLowerCase();
}

/** Completar a frase: escolhe a palavra de cada espaço (artigo, preposição…). */
export function Completar({ pergunta: p, resposta, aoMudar, correcao }: Props) {
  const valores = resposta?.tipo === 'completar' ? resposta.valores : p.lacunas.map(() => null);
  const [foco, setFoco] = useState(0);
  const lacuna = p.lacunas[foco];

  const escolher = (texto: string) => {
    const novos = [...valores];
    novos[foco] = texto;
    aoMudar({ tipo: 'completar', valores: novos });
    const proxima = novos.findIndex((v, i) => v === null && i !== foco);
    if (proxima >= 0) setFoco(proxima);
  };

  const tocarLacuna = (i: number) => {
    if (correcao) return;
    setFoco(i);
    if (valores[i] !== null) {
      const novos = [...valores];
      novos[i] = null;
      aoMudar({ tipo: 'completar', valores: novos });
    }
  };

  const estiloLacuna = (i: number) => {
    const valor = valores[i];
    if (correcao) return igual(valor, p.lacunas[i].certa) ? estilos.certa : estilos.errada;
    if (i === foco) return estilos.focada;
    return valor !== null ? estilos.cheia : null;
  };

  const estadoOpcao = (texto: string): EstadoOpcao => {
    if (correcao) return igual(texto, lacuna.certa) ? 'certa' : igual(valores[foco], texto) ? 'errada' : 'apagada';
    return igual(valores[foco], texto) ? 'escolhida' : 'normal';
  };

  return (
    <View style={estilos.raiz}>
      <Texto variante="subtitulo" style={estilos.frase}>
        {p.trechos.map((t, i) => {
          if (t.tipo === 'texto') return <FraseTocavel key={i} frase={t.texto} variante="subtitulo" />;
          const valor = valores[t.indice];
          const texto = valor === null ? '  _____  ' : p.lacunas[t.indice].maiuscula ? capitalizar(valor) : valor;
          return (
            <Text
              key={i}
              onPress={() => tocarLacuna(t.indice)}
              accessibilityRole="button"
              accessibilityLabel={`Espaço ${t.indice + 1}${valor ? `: ${valor}` : ', vazio'}`}
              style={[estilos.lacuna, estiloLacuna(t.indice)]}>
              {texto}
            </Text>
          );
        })}
      </Texto>
      <Texto variante="suave">Em português: {p.pt}</Texto>

      {lacuna && (
        <View style={estilos.blocoOpcoes}>
          {p.lacunas.length > 1 && (
            <Texto variante="rotulo">
              Espaço {foco + 1} de {p.lacunas.length}
              {correcao ? '' : ' · toque num espaço para trocar'}
            </Texto>
          )}
          <View style={estilos.opcoes}>
            {lacuna.opcoes.map((o) => (
              <OpcaoBotao
                key={o}
                testID="opcao-lacuna"
                compacto
                estado={estadoOpcao(o)}
                texto={o}
                lingua="en"
                rotulo={o}
                desativado={correcao !== null}
                onPress={() => escolher(o)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.x3,
  },
  frase: {
    fontSize: 21,
    lineHeight: 34,
  },
  lacuna: {
    fontFamily: fontes.monoForte,
    color: cores.tracoClaro,
    backgroundColor: alfa(cores.traco, 0.12),
    textDecorationLine: 'underline',
    textDecorationColor: alfa(cores.tracoClaro, 0.8),
  },
  focada: {
    backgroundColor: alfa(cores.traco, 0.3),
    color: cores.texto,
  },
  cheia: {
    color: cores.texto,
  },
  certa: {
    color: cores.acerto,
    backgroundColor: alfa(cores.acerto, 0.14),
    textDecorationColor: cores.acerto,
  },
  errada: {
    color: cores.erro,
    backgroundColor: alfa(cores.erro, 0.14),
    textDecorationColor: cores.erro,
    textDecorationLine: 'line-through',
  },
  blocoOpcoes: {
    gap: espaco.x2,
    marginTop: espaco.x2,
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.x2,
  },
});
