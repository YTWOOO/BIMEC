import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { criarAleatorio } from '@/gerador/aleatorio';
import { Exercicio, type InfoResposta } from '@/joguinhos/Exercicio';
import {
  avancar,
  criarFila,
  ehPrimeiraTentativa,
  progresso,
  registrar,
  rodadaAtual,
  terminou,
  type EstadoFila,
} from '@/joguinhos/fila';
import { reembaralhar } from '@/joguinhos/preparar';
import { Resultado } from '@/joguinhos/Resultado';
import { criarSessao, resumirSessao, type ResultadoLicao, type Sessao } from '@/joguinhos/sessao';
import type { Correcao } from '@/joguinhos/tipos';
import { useProgresso } from '@/store/progresso';
import { BarraProgresso } from '@/ui/BarraProgresso';
import { BarraTopo } from '@/ui/BarraTopo';
import { Grade } from '@/ui/Grade';
import { IconeFechar } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { cores, espaco } from '@/ui/tema';

function sair() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function TelaLicao() {
  const { id, foco, n } = useLocalSearchParams<{ id: string; foco?: string; n?: string }>();
  // A chave muda em "Outra lição": a lição inteira é montada de novo.
  return <Licao key={`${id}|${foco ?? ''}|${n ?? ''}`} id={String(id)} foco={foco ? String(foco) : undefined} />;
}

function Licao({ id, foco }: { id: string; foco?: string }) {
  const [sessao] = useState(() => criarSessao(id, { foco }));
  if (!sessao || sessao.perguntas.length === 0) {
    return (
      <Tela comAbas={false}>
        <BarraTopo />
        <Prancha>
          <Texto variante="subtitulo">Lição não encontrada</Texto>
          <Texto variante="suave">Essa unidade não existe nesta versão do app.</Texto>
        </Prancha>
      </Tela>
    );
  }
  return <LicaoEmAndamento sessao={sessao} id={id} />;
}

function LicaoEmAndamento({ sessao, id }: { sessao: Sessao; id: string }) {
  const insets = useSafeAreaInsets();
  const [fila, setFila] = useState<EstadoFila>(() => criarFila(sessao.perguntas.length));
  const [resultado, setResultado] = useState<ResultadoLicao | null>(null);
  const responder = useProgresso((s) => s.responder);
  const apresentarItem = useProgresso((s) => s.apresentarItem);
  const ganharXp = useProgresso((s) => s.ganharXp);
  const definirLimiteFrase = useProgresso((s) => s.definirLimiteFrase);

  // O ajuste do motor calculou um novo limite de palavras por frase: guarda no perfil.
  useEffect(() => {
    if (sessao.salvar && sessao.limiteFrase !== null) definirLimiteFrase(sessao.limiteFrase);
  }, [sessao, definirLimiteFrase]);

  const rodada = rodadaAtual(fila);
  const base = rodada ? sessao.perguntas[rodada.indice] : null;
  // Quando volta depois de um erro, as opções vêm em outra ordem.
  const pergunta =
    base && rodada && rodada.volta > 0 ? reembaralhar(base, criarAleatorio(rodada.indice * 97 + rodada.volta)) : base;

  const seguir = (proxima: EstadoFila) => {
    if (terminou(proxima)) {
      const r = resumirSessao(sessao, proxima);
      if (sessao.salvar) ganharXp(r.xp.total, sessao.hoje);
      setResultado(r);
    }
    setFila(proxima);
  };

  const aoResponder = (c: Correcao, info: InfoResposta) => {
    if (!pergunta) return;
    const { exercicio } = pergunta;
    // Só a primeira tentativa conta para o motor; a volta depois do erro é só para fixar.
    if (sessao.salvar && ehPrimeiraTentativa(fila)) {
      responder(exercicio.itemId, exercicio.tipoItem, {
        acertou: c.acertou,
        ms: info.ms,
        usouDica: info.usouDica,
        licaoId: sessao.licaoId,
        hoje: sessao.hoje,
        joguinho: exercicio.joguinho,
      });
    }
    setFila(registrar(fila, c.acertou));
  };

  const aoVerCard = () => {
    if (!pergunta) return;
    if (sessao.salvar && ehPrimeiraTentativa(fila)) {
      apresentarItem(pergunta.exercicio.itemId, pergunta.exercicio.tipoItem, sessao.hoje);
    }
    seguir(avancar(registrar(fila, true)));
  };

  const outraLicao = () => router.replace({ pathname: '/licao/[id]', params: { id, n: String(Date.now()) } });

  const resolvidos = fila.resolvido.filter(Boolean).length;

  return (
    <View style={estilos.raiz}>
      <Grade />
      <View style={[estilos.coluna, { paddingTop: insets.top + espaco.x2 }]}>
        {resultado ? (
          <ScrollView
            contentContainerStyle={[estilos.resultado, { paddingBottom: insets.bottom + espaco.x6 }]}
            showsVerticalScrollIndicator={false}>
            <Resultado resultado={resultado} sessao={sessao} aoContinuar={sair} aoOutra={outraLicao} />
          </ScrollView>
        ) : (
          <>
            <View style={estilos.topo}>
              <Pressable
                onPress={sair}
                accessibilityRole="button"
                accessibilityLabel="Sair da lição"
                hitSlop={10}
                style={({ pressed }) => [estilos.fechar, pressed && { opacity: 0.6 }]}>
                <IconeFechar tamanho={24} />
              </Pressable>
              <View style={estilos.barra}>
                <BarraProgresso fracao={progresso(fila)} cor={cores.acerto} marcas={sessao.perguntas.length} />
              </View>
              <Texto variante="rotulo">
                {resolvidos}/{sessao.perguntas.length}
              </Texto>
            </View>
            {pergunta && rodada && (
              <Exercicio
                key={fila.posicao}
                pergunta={pergunta}
                deNovo={rodada.volta > 0}
                aoResponder={aoResponder}
                aoVerCard={aoVerCard}
                aoContinuar={() => seguir(avancar(fila))}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  coluna: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x3,
    paddingHorizontal: espaco.x4,
    paddingBottom: espaco.x2,
  },
  fechar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barra: {
    flex: 1,
  },
  resultado: {
    padding: espaco.x4,
  },
});
