import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco, fontes } from '@/ui/tema';
import { falar } from '@/util/audio';

import { BotaoSom, FraseComAudio } from './FraseComAudio';
import { OpcaoBotao, type EstadoOpcao } from './OpcaoBotao';
import type { Correcao, PerguntaEscolha, Resposta } from './tipos';

type Props = {
  pergunta: PerguntaEscolha;
  resposta: Resposta | null;
  aoMudar: (r: Resposta) => void;
  correcao: Correcao | null;
};

/** Inglês → português, Português → inglês e Ouvir e escolher: uma pergunta e algumas opções. */
export function Escolha({ pergunta: p, resposta, aoMudar, correcao }: Props) {
  const escolhida = resposta?.tipo === 'escolha' ? resposta.opcao : null;
  const textoEscolhido = p.opcoes.find((o) => o.id === escolhida)?.texto;

  // Ouvir e escolher: a frase toca sozinha quando o exercício aparece.
  useEffect(() => {
    if (p.audio) falar(p.audio);
  }, [p.audio]);

  const estado = (id: string): EstadoOpcao => {
    if (correcao) return id === p.certa ? 'certa' : id === escolhida ? 'errada' : 'apagada';
    return id === escolhida ? 'escolhida' : 'normal';
  };

  return (
    <View style={estilos.raiz}>
      {p.audio && (
        <View style={estilos.audio}>
          <BotaoSom grande rotulo="Ouvir a frase" aoTocar={() => falar(p.audio as string)} />
          <BotaoSom grande lento rotulo="Ouvir devagar" aoTocar={() => falar(p.audio as string, true)} />
        </View>
      )}
      {p.en && <FraseComAudio en={p.en} variante={p.en.includes(' ') ? 'subtitulo' : 'destaque'} devagar />}
      {p.pt && (
        <Texto variante={p.pt.includes(' ') ? 'subtitulo' : 'titulo'} style={estilos.pt}>
          {p.pt}
        </Texto>
      )}
      {p.ptComLacuna && (
        <Texto variante="subtitulo" cor={cores.textoSuave} style={estilos.pt}>
          {p.ptComLacuna[0]}
          <Text style={[estilos.lacuna, textoEscolhido ? estilos.lacunaCheia : null]}>{textoEscolhido ?? ' _____ '}</Text>
          {p.ptComLacuna[1]}
        </Texto>
      )}

      <View style={estilos.opcoes}>
        {p.opcoes.map((o) => (
          <OpcaoBotao
            key={o.id}
            testID="opcao"
            estado={estado(o.id)}
            texto={o.texto}
            lingua={o.lingua}
            rotulo={o.texto}
            desativado={correcao !== null}
            onPress={() => {
              // Tocar numa opção em inglês fala a palavra, menos no Ouvir e escolher (entregaria a resposta).
              if (o.lingua === 'en' && !p.audio) falar(o.texto);
              aoMudar({ tipo: 'escolha', opcao: o.id });
            }}
          />
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.x4,
  },
  audio: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: espaco.x5,
    paddingVertical: espaco.x3,
  },
  pt: {
    marginTop: espaco.x1,
  },
  lacuna: {
    color: cores.tracoClaro,
    fontFamily: fontes.monoForte,
    textDecorationLine: 'underline',
    textDecorationColor: alfa(cores.tracoClaro, 0.8),
  },
  lacunaCheia: {
    color: cores.texto,
  },
  opcoes: {
    gap: espaco.x2 + 2,
    marginTop: espaco.x2,
  },
});
