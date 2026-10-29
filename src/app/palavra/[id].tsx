import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { palavraPorId } from '@/conteudo/palavras';
import { nomeDoTema } from '@/conteudo/temas';
import type { Palavra } from '@/conteudo/tipos';
import { useProgresso } from '@/store/progresso';
import { Botao } from '@/ui/Botao';
import { Carimbo } from '@/ui/Carimbo';
import { Cota } from '@/ui/Cota';
import { IconeSom, IconeTartaruga, IconeVoltar } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco, fontes, raio } from '@/ui/tema';
import { falar } from '@/util/audio';
import { diaLocal } from '@/util/datas';

/** Refeições não levam artigo ("have breakfast"), então a dica de "some" não serve. */
const REFEICOES = new Set(['breakfast', 'lunch', 'dinner']);

function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function TelaPalavra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const palavra = palavraPorId(String(id));
  const registrar = useProgresso((s) => s.registrarPalavrasVistas);
  const item = useProgresso((s) => (palavra ? s.itens[palavra.id] : undefined));

  useEffect(() => {
    if (palavra) registrar([palavra.id], diaLocal());
  }, [palavra, registrar]);

  if (!palavra) {
    return (
      <Tela comAbas={false}>
        <BarraTopo />
        <Prancha>
          <Texto variante="subtitulo">Palavra não encontrada</Texto>
          <Texto variante="suave">Ela pode ter saído do conteúdo numa versão nova do app.</Texto>
        </Prancha>
      </Tela>
    );
  }

  const p = palavra;
  return (
    <Tela comAbas={false}>
      <BarraTopo direita={<Carimbo partes={[nomeDoTema(p.tema), p.classe]} cor={cores.tracoClaro} />} />

      <View style={estilos.cabeca}>
        <Texto variante="destaque" style={estilos.palavra}>
          {p.en}
        </Texto>
        <Texto variante="titulo" cor={cores.textoSuave} style={estilos.traducao}>
          {p.pt}
        </Texto>
        <View style={estilos.linhaBotoes}>
          <BotaoAudio rotulo="Ouvir" icone={<IconeSom tamanho={18} />} onPress={() => falar(p.en)} />
          <BotaoAudio rotulo="Devagar" icone={<IconeTartaruga tamanho={18} />} onPress={() => falar(p.en, true)} />
        </View>
      </View>

      <Prancha>
        <Texto variante="rotulo">Exemplo</Texto>
        <Texto variante="subtitulo" style={estilos.frase}>
          {p.exemplo.en}
        </Texto>
        <Texto variante="corpo" cor={cores.textoSuave}>
          {p.exemplo.pt}
        </Texto>
        <View style={estilos.linhaBotoes}>
          <BotaoAudio rotulo="Ouvir a frase" icone={<IconeSom tamanho={18} />} onPress={() => falar(p.exemplo.en)} />
          <BotaoAudio
            rotulo="Devagar"
            icone={<IconeTartaruga tamanho={18} />}
            onPress={() => falar(p.exemplo.en, true)}
          />
        </View>
      </Prancha>

      <ComoUsar palavra={p} />

      <Prancha>
        <Texto variante="rotulo">Seu progresso com esta palavra</Texto>
        <Texto variante="corpo" style={estilos.frase}>
          {item ? `Degrau ${item.degrau} de 5 · ${item.acertos} acertos, ${item.erros} erros` : 'Ainda não vista.'}
        </Texto>
        <View style={estilos.botaoPraticar}>
          <Botao titulo="Praticar agora" desativado />
        </View>
        <Texto variante="suave" style={estilos.nota}>
          Os joguinhos chegam na etapa 5.
        </Texto>
      </Prancha>
    </Tela>
  );
}

function ComoUsar({ palavra: p }: { palavra: Palavra }) {
  const umPt = p.generoPt === 'f' ? 'uma' : 'um';
  const doisPt = p.generoPt === 'f' ? 'duas' : 'dois';

  if (p.artigo === null) {
    return (
      <Prancha>
        <Texto variante="rotulo">Como usar</Texto>
        <Texto variante="corpo" style={estilos.frase}>
          “{p.en}” não se conta: não leva a/an e não tem plural.
        </Texto>
        {!REFEICOES.has(p.id) && (
          <>
            <Cota />
            <LinhaUso en={`some ${p.en}`} pt={`um pouco de ${p.pt}`} />
          </>
        )}
      </Prancha>
    );
  }

  const motivo =
    p.artigo === 'an'
      ? `Usa “an” porque “${p.en}” começa com som de vogal.`
      : `Usa “a” porque “${p.en}” começa com som de consoante.`;

  return (
    <Prancha>
      <Texto variante="rotulo">Como usar</Texto>
      <LinhaUso en={`${p.artigo} ${p.en}`} pt={`${umPt} ${p.pt}`} />
      {p.plural && p.pluralPt && <LinhaUso en={`two ${p.plural}`} pt={`${doisPt} ${p.pluralPt}`} />}
      <Cota />
      <Texto variante="suave">{motivo}</Texto>
      {p.plural === p.en && <Texto variante="suave">O plural é igual ao singular: one {p.en}, two {p.plural}.</Texto>}
    </Prancha>
  );
}

function LinhaUso({ en, pt }: { en: string; pt: string }) {
  return (
    <View style={estilos.linhaUso}>
      <Texto style={estilos.usoEn}>{en}</Texto>
      <Texto variante="suave">{pt}</Texto>
    </View>
  );
}

function BarraTopo({ direita }: { direita?: ReactNode }) {
  return (
    <View style={estilos.barraTopo}>
      <Pressable
        onPress={voltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={10}
        style={({ pressed }) => [estilos.voltar, pressed && { opacity: 0.6 }]}>
        <IconeVoltar tamanho={22} />
        <Texto variante="rotulo" cor={cores.tracoClaro}>
          Voltar
        </Texto>
      </Pressable>
      {direita}
    </View>
  );
}

function BotaoAudio({ rotulo, icone, onPress }: { rotulo: string; icone: ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.botaoAudio, pressed && { opacity: 0.65 }]}>
      {icone}
      <Texto variante="rotulo" cor={cores.tracoClaro}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  barraTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
  },
  cabeca: {
    paddingVertical: espaco.x2,
  },
  palavra: {
    fontSize: 44,
    lineHeight: 52,
  },
  traducao: {
    marginTop: espaco.x1,
  },
  linhaBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.x2,
    marginTop: espaco.x4,
  },
  botaoAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x2,
    minHeight: 40,
    paddingHorizontal: espaco.x3,
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.55),
    borderRadius: raio,
    backgroundColor: alfa(cores.traco, 0.06),
  },
  frase: {
    marginTop: espaco.x2,
  },
  linhaUso: {
    marginTop: espaco.x3,
  },
  usoEn: {
    fontFamily: fontes.monoForte,
    fontSize: 17,
    color: cores.texto,
  },
  botaoPraticar: {
    marginTop: espaco.x4,
  },
  nota: {
    marginTop: espaco.x2,
    textAlign: 'center',
  },
});
