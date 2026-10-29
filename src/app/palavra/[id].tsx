import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { palavraPorId } from '@/conteudo/palavras';
import { FraseTocavel } from '@/dicionario/FraseTocavel';
import { nomeDoTema } from '@/conteudo/temas';
import type { Palavra } from '@/conteudo/tipos';
import { useProgresso } from '@/store/progresso';
import { BarraTopo } from '@/ui/BarraTopo';
import { Botao } from '@/ui/Botao';
import { BotaoPequeno } from '@/ui/BotaoPequeno';
import { Carimbo } from '@/ui/Carimbo';
import { Cota } from '@/ui/Cota';
import { IconeSom, IconeTartaruga } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { cores, espaco, fontes } from '@/ui/tema';
import { falar } from '@/util/audio';
import { diaLocal } from '@/util/datas';

/** Refeições não levam artigo ("have breakfast"), então a dica de "some" não serve. */
const REFEICOES = new Set(['breakfast', 'lunch', 'dinner']);

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
          <BotaoPequeno rotulo="Ouvir" icone={<IconeSom tamanho={18} />} onPress={() => falar(p.en)} />
          <BotaoPequeno rotulo="Devagar" icone={<IconeTartaruga tamanho={18} />} onPress={() => falar(p.en, true)} />
        </View>
      </View>

      <Prancha>
        <Texto variante="rotulo">Exemplo · toque numa palavra para ver o significado</Texto>
        <FraseTocavel frase={p.exemplo.en} variante="subtitulo" style={estilos.frase} />
        <Texto variante="corpo" cor={cores.textoSuave}>
          {p.exemplo.pt}
        </Texto>
        <View style={estilos.linhaBotoes}>
          <BotaoPequeno rotulo="Ouvir a frase" icone={<IconeSom tamanho={18} />} onPress={() => falar(p.exemplo.en)} />
          <BotaoPequeno
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
      <FraseTocavel frase={en} style={estilos.usoEn} />
      <Texto variante="suave">{pt}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
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
