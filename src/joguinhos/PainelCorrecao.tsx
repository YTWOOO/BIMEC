import { StyleSheet, View } from 'react-native';

import { IconeCheck, IconeFechar } from '@/ui/Icones';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco, raio } from '@/ui/tema';

import { FraseComAudio } from './FraseComAudio';
import type { Correcao, RespostaCerta } from './tipos';

/** Correção na hora: cor de acerto ou erro, a resposta certa e a explicação do erro. */
export function PainelCorrecao({ correcao, resposta }: { correcao: Correcao; resposta: RespostaCerta }) {
  const cor = correcao.acertou ? cores.acerto : cores.erro;
  return (
    <View
      style={[estilos.painel, { borderColor: alfa(cor, 0.7), backgroundColor: alfa(cor, 0.1) }]}
      accessibilityLiveRegion="polite">
      <View style={estilos.titulo}>
        {correcao.acertou ? <IconeCheck tamanho={22} /> : <IconeFechar tamanho={22} cor={cores.erro} />}
        <Texto variante="subtitulo" cor={cor}>
          {correcao.acertou ? 'Correto!' : 'Resposta certa:'}
        </Texto>
      </View>
      {resposta.en && <FraseComAudio en={resposta.en} variante="corpoForte" />}
      {resposta.pt && <Texto variante="suave">{resposta.pt}</Texto>}
      {!correcao.acertou &&
        correcao.explicacoes.map((e) => (
          <Texto key={e} variante="corpo" style={estilos.explicacao}>
            {e}
          </Texto>
        ))}
      {resposta.nota && (
        <Texto variante="rotulo" cor={cores.tracoClaro} style={estilos.nota}>
          {resposta.nota}
        </Texto>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  painel: {
    borderWidth: 1,
    borderRadius: raio,
    padding: espaco.x3,
    gap: espaco.x1,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x2,
    marginBottom: espaco.x1,
  },
  explicacao: {
    marginTop: espaco.x1,
  },
  nota: {
    marginTop: espaco.x1,
    textTransform: 'none',
  },
});
