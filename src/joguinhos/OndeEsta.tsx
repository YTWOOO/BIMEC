import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { DesenhoPosicao } from '@/ui/DesenhoPosicao';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco } from '@/ui/tema';

import { FraseComAudio } from './FraseComAudio';
import { OpcaoBotao, type EstadoOpcao } from './OpcaoBotao';
import type { Correcao, PerguntaOnde, Resposta } from './tipos';

type Props = {
  pergunta: PerguntaOnde;
  resposta: Resposta | null;
  aoMudar: (r: Resposta) => void;
  correcao: Correcao | null;
};

const ESPACO_GRADE = espaco.x3;

/** Onde está? Lê a frase e escolhe o desenho com a posição certa. */
export function OndeEsta({ pergunta: p, resposta, aoMudar, correcao }: Props) {
  const [largura, setLargura] = useState(0);
  const escolhida = resposta?.tipo === 'onde' ? resposta.posicao : null;
  const larguraOpcao = largura > 0 ? (largura - ESPACO_GRADE) / 2 : 0;

  const estado = (pos: string): EstadoOpcao => {
    if (correcao) return pos === p.certa ? 'certa' : pos === escolhida ? 'errada' : 'apagada';
    return pos === escolhida ? 'escolhida' : 'normal';
  };

  return (
    <View style={estilos.raiz}>
      <FraseComAudio en={p.en} devagar />
      <View style={estilos.legenda}>
        <View style={estilos.itemLegenda}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Circle cx={7} cy={7} r={5.5} fill={alfa(cores.ofensiva, 0.9)} stroke={cores.ofensiva} />
          </Svg>
          <Texto variante="rotulo">{p.coisa}</Texto>
        </View>
        <View style={estilos.itemLegenda}>
          <Svg width={16} height={14} viewBox="0 0 16 14">
            <Rect x={1.5} y={2} width={13} height={9} fill={cores.fundoCard} stroke={cores.tracoClaro} strokeWidth={1.2} />
          </Svg>
          <Texto variante="rotulo">{p.lugar}</Texto>
        </View>
      </View>

      <View style={estilos.grade} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {larguraOpcao > 0 &&
          p.opcoes.map((pos, i) => (
            <View key={pos} style={{ width: larguraOpcao }}>
              <OpcaoBotao
                testID={`posicao-${pos.replace(/ /g, '-')}`}
                estado={estado(pos)}
                rotulo={`Desenho ${i + 1}`}
                desativado={correcao !== null}
                compacto
                onPress={() => aoMudar({ tipo: 'onde', posicao: pos })}>
                <DesenhoPosicao posicao={pos} largura={Math.min(170, larguraOpcao - 2 * espaco.x3 - 4)} />
              </OpcaoBotao>
            </View>
          ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.x3,
  },
  legenda: {
    flexDirection: 'row',
    gap: espaco.x4,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x1 + 2,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACO_GRADE,
    marginTop: espaco.x2,
  },
});
