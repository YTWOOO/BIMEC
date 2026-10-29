import { StyleSheet, View } from 'react-native';

import { CONTRACOES, palavraPorId } from '@/conteudo';
import { nomeDoTema } from '@/conteudo/temas';
import { FraseTocavel } from '@/dicionario/FraseTocavel';
import { artigoIndefinido, numeroDois } from '@/gerador/portugues';
import { BotaoPequeno } from '@/ui/BotaoPequeno';
import { Carimbo } from '@/ui/Carimbo';
import { Cota } from '@/ui/Cota';
import { IconeSom, IconeTartaruga } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Texto } from '@/ui/Texto';
import { cores, espaco, fontes } from '@/ui/tema';
import { falar } from '@/util/audio';

import { FraseComAudio } from './FraseComAudio';
import type { Card } from './tipos';

function BotoesAudio({ texto }: { texto: string }) {
  return (
    <View style={estilos.botoes}>
      <BotaoPequeno rotulo="Ouvir" icone={<IconeSom tamanho={18} />} onPress={() => falar(texto)} />
      <BotaoPequeno rotulo="Devagar" icone={<IconeTartaruga tamanho={18} />} onPress={() => falar(texto, true)} />
    </View>
  );
}

function CardPalavra({ palavraId }: { palavraId: string }) {
  const p = palavraPorId(palavraId);
  if (!p) return null;
  const contavel = p.artigo !== null && p.plural !== null && p.pluralPt !== null;
  return (
    <>
      <Prancha destaque>
        <Carimbo partes={[nomeDoTema(p.tema), p.classe]} cor={cores.tracoClaro} />
        <Texto variante="destaque" style={estilos.palavra}>
          {p.en}
        </Texto>
        <Texto variante="titulo" cor={cores.textoSuave}>
          {p.pt}
        </Texto>
        <BotoesAudio texto={p.en} />
      </Prancha>
      <Prancha>
        <Texto variante="rotulo">Como usar</Texto>
        {contavel ? (
          <View style={estilos.usos}>
            <Uso en={`${p.artigo} ${p.en}`} pt={`${artigoIndefinido(p.generoPt)} ${p.pt}`} />
            <Uso en={`two ${p.plural}`} pt={`${numeroDois(p.generoPt)} ${p.pluralPt}`} />
            <Texto variante="suave">
              {p.artigo === 'an'
                ? `"an" porque "${p.en}" começa com som de vogal.`
                : `"a" porque "${p.en}" começa com som de consoante.`}
            </Texto>
          </View>
        ) : (
          <Texto variante="corpo" style={estilos.usos}>
            “{p.en}” não se conta: não leva a/an e não tem plural.
          </Texto>
        )}
        <Cota rotulo="exemplo" />
        <FraseComAudio en={p.exemplo.en} variante="corpoForte" />
        <Texto variante="suave">{p.exemplo.pt}</Texto>
      </Prancha>
    </>
  );
}

function Uso({ en, pt }: { en: string; pt: string }) {
  return (
    <View>
      <FraseTocavel frase={en} style={estilos.usoEn} />
      <Texto variante="suave">{pt}</Texto>
    </View>
  );
}

function CardMolde({ card }: { card: Extract<Card, { tipo: 'molde' }> }) {
  return (
    <>
      <Prancha destaque>
        <Carimbo partes={['Modelo de frase']} cor={cores.tracoClaro} />
        <Texto variante="titulo" style={estilos.titulo}>
          {card.nome}
        </Texto>
        <Texto variante="corpo">{card.resumo}</Texto>
        <Cota rotulo="modelo" />
        <Texto style={estilos.padrao}>{card.padraoEn}</Texto>
        <Texto variante="suave">{card.padraoPt}</Texto>
      </Prancha>
      {card.exemplos.length > 0 && (
        <Prancha>
          <Texto variante="rotulo">Exemplos · toque numa palavra para ver o significado</Texto>
          {card.exemplos.map((e) => (
            <View key={e.en} style={estilos.exemplo}>
              <FraseComAudio en={e.en} variante="corpoForte" />
              <Texto variante="suave">{e.pt}</Texto>
            </View>
          ))}
        </Prancha>
      )}
    </>
  );
}

function CardContracao({ contracaoId, trechoEn }: { contracaoId: string; trechoEn: string }) {
  const c = CONTRACOES.find((x) => x.id === contracaoId);
  if (!c) return null;
  return (
    <>
      <Prancha destaque>
        <Carimbo partes={['Contração do português']} cor={cores.tracoClaro} />
        <Texto variante="destaque" style={estilos.palavra}>
          {c.pt}
        </Texto>
        <Texto variante="subtitulo" cor={cores.textoSuave}>
          {c.partes.join(' + ')}
        </Texto>
        <Cota rotulo="em inglês" />
        <Texto style={estilos.padrao}>{c.en}</Texto>
        <Texto variante="suave">Em inglês não existe contração: as duas partes ficam separadas ({trechoEn}).</Texto>
      </Prancha>
      <Prancha>
        <Texto variante="rotulo">Exemplo</Texto>
        <Texto variante="corpoForte" style={estilos.exemplo}>
          {c.exemplo.pt}
        </Texto>
        <FraseComAudio en={c.exemplo.en} variante="corpoForte" />
        {c.nota && (
          <>
            <Cota />
            <Texto variante="suave">{c.nota}</Texto>
          </>
        )}
      </Prancha>
    </>
  );
}

/** Card de apresentação: o item aparece pela primeira vez. Não conta acerto. */
export function CardNovo({ card }: { card: Card }) {
  if (card.tipo === 'palavra') return <CardPalavra palavraId={card.palavraId} />;
  if (card.tipo === 'molde') return <CardMolde card={card} />;
  return <CardContracao contracaoId={card.contracaoId} trechoEn={card.trechoEn} />;
}

const estilos = StyleSheet.create({
  palavra: {
    fontSize: 40,
    lineHeight: 48,
    marginTop: espaco.x3,
  },
  titulo: {
    marginTop: espaco.x3,
    marginBottom: espaco.x2,
  },
  botoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.x2,
    marginTop: espaco.x4,
  },
  usos: {
    gap: espaco.x3,
    marginTop: espaco.x3,
  },
  usoEn: {
    fontFamily: fontes.monoForte,
    fontSize: 17,
    color: cores.texto,
  },
  padrao: {
    fontFamily: fontes.monoForte,
    fontSize: 15,
    lineHeight: 22,
    color: cores.texto,
  },
  exemplo: {
    marginTop: espaco.x3,
    gap: 2,
  },
});
