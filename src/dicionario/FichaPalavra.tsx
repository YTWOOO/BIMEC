import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/ui/Botao';
import { BotaoPequeno } from '@/ui/BotaoPequeno';
import { Carimbo } from '@/ui/Carimbo';
import { Cota } from '@/ui/Cota';
import { IconeSom, IconeTartaruga } from '@/ui/Icones';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco } from '@/ui/tema';
import { falar } from '@/util/audio';

import type { PedidoFicha } from './contexto';
import { FraseTocavel } from './FraseTocavel';
import { entradaPorId } from './dicionario';

type Props = {
  pedido: PedidoFicha | null;
  podeVoltar: boolean;
  aoVoltar: () => void;
  aoFechar: () => void;
};

/** Painel que sobe de baixo com o significado da palavra tocada e onde ela aparece. */
export function FichaPalavra({ pedido, podeVoltar, aoVoltar, aoFechar }: Props) {
  const insets = useSafeAreaInsets();
  const entrada = pedido?.id ? entradaPorId(pedido.id) : undefined;

  return (
    <Modal visible={pedido !== null} transparent animationType="slide" onRequestClose={podeVoltar ? aoVoltar : aoFechar}>
      <View style={estilos.fundo}>
        <Pressable style={estilos.areaFechar} onPress={aoFechar} accessibilityLabel="Fechar a ficha" />
        <View style={[estilos.painel, { paddingBottom: insets.bottom + espaco.x4 }]}>
          <View style={estilos.alca} />
          <View style={estilos.topo}>
            <Carimbo partes={[entrada?.classe ?? 'palavra', 'dicionário']} cor={cores.tracoClaro} />
            <View style={estilos.botoesTopo}>
              {podeVoltar && <BotaoPequeno rotulo="Voltar" onPress={aoVoltar} />}
              <BotaoPequeno rotulo="Fechar" onPress={aoFechar} />
            </View>
          </View>

          <ScrollView style={estilos.rolagem} contentContainerStyle={estilos.conteudo}>
            <Texto variante="destaque">{entrada?.en ?? pedido?.texto ?? ''}</Texto>
            <View style={estilos.linhaBotoes}>
              <BotaoPequeno
                rotulo="Ouvir"
                icone={<IconeSom tamanho={16} />}
                onPress={() => falar(entrada?.en ?? pedido?.texto ?? '')}
              />
              <BotaoPequeno
                rotulo="Devagar"
                icone={<IconeTartaruga tamanho={16} />}
                onPress={() => falar(entrada?.en ?? pedido?.texto ?? '', true)}
              />
            </View>

            {entrada ? (
              <>
                <Texto variante="subtitulo" cor={cores.tracoClaro} style={estilos.significado}>
                  {entrada.significado}
                </Texto>
                {entrada.explicacao && (
                  <Texto variante="corpo" cor={cores.textoSuave} style={estilos.explicacao}>
                    {entrada.explicacao}
                  </Texto>
                )}

                <Cota rotulo="onde aparece" />
                {entrada.contextos.map((c) => (
                  <View key={c.en} style={estilos.contexto}>
                    <Texto variante="rotulo" style={estilos.tituloContexto}>
                      {c.titulo}
                    </Texto>
                    <View style={estilos.linhaContexto}>
                      <View style={estilos.flex}>
                        <FraseTocavel frase={c.en} variante="corpoForte" />
                        <Texto variante="suave">{c.pt}</Texto>
                      </View>
                      <BotaoPequeno rotulo="Ouvir" onPress={() => falar(c.en)} />
                    </View>
                  </View>
                ))}

                {entrada.palavraId && (
                  <View style={estilos.botaoPalavra}>
                    <Botao
                      titulo="Abrir a palavra"
                      variante="contorno"
                      onPress={() => {
                        aoFechar();
                        router.push({ pathname: '/palavra/[id]', params: { id: entrada.palavraId as string } });
                      }}
                    />
                  </View>
                )}
              </>
            ) : (
              <Texto variante="corpo" cor={cores.textoSuave} style={estilos.explicacao}>
                Esta palavra ainda não tem ficha no dicionário.
              </Texto>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  fundo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: alfa(cores.fundoBase, 0.6),
  },
  areaFechar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  painel: {
    maxHeight: '82%',
    backgroundColor: cores.fundoCard,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: cores.traco,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: espaco.x2,
    paddingHorizontal: espaco.x4,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  alca: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: alfa(cores.tracoClaro, 0.5),
    marginBottom: espaco.x3,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.x2,
  },
  botoesTopo: {
    flexDirection: 'row',
    gap: espaco.x2,
  },
  rolagem: {
    marginTop: espaco.x3,
  },
  conteudo: {
    paddingBottom: espaco.x4,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: espaco.x2,
    marginTop: espaco.x2,
  },
  significado: {
    marginTop: espaco.x4,
  },
  explicacao: {
    marginTop: espaco.x2,
  },
  contexto: {
    marginTop: espaco.x3,
  },
  tituloContexto: {
    fontSize: 10,
  },
  linhaContexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x3,
  },
  botaoPalavra: {
    marginTop: espaco.x5,
  },
});
