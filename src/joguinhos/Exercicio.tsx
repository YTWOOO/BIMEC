import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDicionario } from '@/dicionario/contexto';
import { NOME_JOGUINHO } from '@/motor/joguinhos';
import { Botao } from '@/ui/Botao';
import { Carimbo } from '@/ui/Carimbo';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco } from '@/ui/tema';

import { avaliar, respostaCompleta } from './avaliar';
import { CardNovo } from './CardNovo';
import { Completar } from './Completar';
import { Escolha } from './Escolha';
import { OndeEsta } from './OndeEsta';
import { PainelCorrecao } from './PainelCorrecao';
import { Pares } from './Pares';
import type { Correcao, Pergunta, Resposta } from './tipos';

export interface InfoResposta {
  /** Tempo até responder, em milissegundos. */
  ms: number;
  /** Abriu o dicionário durante o exercício. */
  usouDica: boolean;
}

type Props = {
  pergunta: Pergunta;
  /** O exercício voltou porque o Ícaro errou antes. */
  deNovo: boolean;
  /** Exercício conferido (menos card). */
  aoResponder: (correcao: Correcao, info: InfoResposta) => void;
  /** Card visto: o card não tem correção, só continua. */
  aoVerCard: (info: InfoResposta) => void;
  aoContinuar: () => void;
};

function vibrar(acertou: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    acertou ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

/**
 * Componente base de todo exercício: enunciado, área do joguinho, correção na hora
 * e o botão de baixo (Conferir, depois Continuar).
 */
export function Exercicio({ pergunta, deNovo, aoResponder, aoVerCard, aoContinuar }: Props) {
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [correcao, setCorrecao] = useState<Correcao | null>(null);
  const insets = useSafeAreaInsets();
  const { aberturas } = useDicionario();
  const aberturasNoInicio = useRef(aberturas);
  const inicio = useRef(0);

  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  const info = (): InfoResposta => ({
    ms: Date.now() - inicio.current,
    usouDica: aberturas > aberturasNoInicio.current,
  });

  const conferir = (r: Resposta) => {
    const c = avaliar(pergunta, r);
    setResposta(r);
    setCorrecao(c);
    vibrar(c.acertou);
    aoResponder(c, info());
  };

  const { exercicio } = pergunta;
  const partes = [NOME_JOGUINHO[exercicio.joguinho]];
  if (exercicio.desafio) partes.push('Desafio');
  if (deNovo) partes.push('De novo');

  let corpo;
  switch (pergunta.tipo) {
    case 'card':
      corpo = <CardNovo card={pergunta.card} />;
      break;
    case 'escolha':
      corpo = <Escolha pergunta={pergunta} resposta={resposta} aoMudar={setResposta} correcao={correcao} />;
      break;
    case 'pares':
      corpo = <Pares pergunta={pergunta} aoConcluir={conferir} concluido={correcao !== null} />;
      break;
    case 'onde':
      corpo = <OndeEsta pergunta={pergunta} resposta={resposta} aoMudar={setResposta} correcao={correcao} />;
      break;
    case 'completar':
      corpo = <Completar pergunta={pergunta} resposta={resposta} aoMudar={setResposta} correcao={correcao} />;
      break;
  }

  let botao;
  if (pergunta.tipo === 'card') {
    botao = <Botao titulo="Continuar" onPress={() => aoVerCard(info())} />;
  } else if (correcao) {
    botao = <Botao titulo="Continuar" onPress={aoContinuar} />;
  } else if (pergunta.tipo === 'pares') {
    botao = (
      <Texto variante="suave" style={estilos.dica}>
        Toque numa palavra de cada lado.
      </Texto>
    );
  } else {
    botao = (
      <Botao
        titulo="Conferir"
        desativado={!respostaCompleta(pergunta, resposta)}
        onPress={() => resposta && conferir(resposta)}
      />
    );
  }

  return (
    <View style={estilos.raiz}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View style={estilos.cabeca}>
          <Carimbo partes={partes} cor={exercicio.desafio ? cores.ofensiva : cores.tracoClaro} />
          <Texto variante="titulo">{pergunta.enunciado}</Texto>
        </View>
        {corpo}
      </ScrollView>
      <View style={[estilos.rodape, { paddingBottom: insets.bottom + espaco.x3 }]}>
        {correcao && <PainelCorrecao correcao={correcao} resposta={pergunta.resposta} />}
        {botao}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  conteudo: {
    padding: espaco.x4,
    gap: espaco.x4,
    paddingBottom: espaco.x6,
  },
  cabeca: {
    gap: espaco.x2,
  },
  rodape: {
    paddingHorizontal: espaco.x4,
    paddingTop: espaco.x3,
    gap: espaco.x3,
    borderTopWidth: 1,
    borderTopColor: alfa(cores.traco, 0.35),
    backgroundColor: alfa(cores.fundoBase, 0.92),
  },
  dica: {
    textAlign: 'center',
    paddingVertical: espaco.x3,
  },
});
