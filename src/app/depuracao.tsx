import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { criarAleatorio } from '@/gerador/aleatorio';
import { blocosExtras, gerarDistratores, type TipoDistrator } from '@/gerador/distratores';
import { gerarFrases, type FraseGerada } from '@/gerador/frases';
import { BarraTopo } from '@/ui/BarraTopo';
import { BotaoPequeno } from '@/ui/BotaoPequeno';
import { Carimbo } from '@/ui/Carimbo';
import { GrupoOpcoes } from '@/ui/Controles';
import { Cota } from '@/ui/Cota';
import { IconeSom } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco, fontes, raio } from '@/ui/tema';
import { falar } from '@/util/audio';

const FILTROS = ['todas', 'artigos', 'preposicoes-lugar'] as const;
type Filtro = (typeof FILTROS)[number];

const NOME_TIPO: Record<TipoDistrator, string> = {
  artigo: 'artigo',
  preposicao: 'preposição',
  ordem: 'ordem',
  palavra: 'outra palavra',
};

/**
 * Tela de depuração do gerador de frases (etapa 3).
 * Só aparece no modo de desenvolvimento, pela Área de teste em Ajustes.
 */
export default function Depuracao() {
  const [semente, setSemente] = useState(1);
  const [filtro, setFiltro] = useState<Filtro>('todas');

  if (!__DEV__) {
    return (
      <Tela comAbas={false}>
        <BarraTopo />
        <Texto variante="suave">Esta tela só existe no modo de desenvolvimento.</Texto>
      </Tela>
    );
  }

  const frases = gerarFrases(10, {
    semente,
    estrutura: filtro === 'todas' ? undefined : filtro,
  });

  return (
    <Tela comAbas={false}>
      <BarraTopo direita={<Carimbo partes={['Depuração', `semente ${semente}`]} cor={cores.tracoClaro} />} />
      <View style={estilos.topo}>
        <Texto variante="titulo">Frases geradas</Texto>
        <Texto variante="suave">10 frases do gerador, com os distratores e os blocos de cada uma.</Texto>
      </View>

      <GrupoOpcoes
        opcoes={FILTROS}
        valor={filtro}
        aoMudar={setFiltro}
        formatar={(f) => (f === 'todas' ? 'Todas' : f === 'artigos' ? 'Artigos' : 'Preposições')}
        rotuloAcessivel="Filtrar por estrutura"
      />
      <View style={estilos.linhaBotoes}>
        <BotaoPequeno rotulo="Gerar outras" onPress={() => setSemente((s) => s + 1)} />
      </View>

      {frases.map((f, i) => (
        <CartaoFrase key={f.id} frase={f} indice={i} semente={semente} />
      ))}
    </Tela>
  );
}

function CartaoFrase({ frase: f, indice, semente }: { frase: FraseGerada; indice: number; semente: number }) {
  const distratores = gerarDistratores(f, criarAleatorio(semente * 100 + indice), 3);
  const extras = blocosExtras(f);
  return (
    <Prancha>
      <Carimbo
        partes={[String(indice + 1).padStart(2, '0'), f.moldeId, ...(f.preposicao ? [f.preposicao] : [])]}
      />
      <View style={estilos.linhaFrase}>
        <View style={estilos.flex}>
          <Texto variante="corpoForte">{f.en}</Texto>
          <Texto variante="suave">{f.pt}</Texto>
        </View>
        <BotaoPequeno rotulo="Ouvir" icone={<IconeSom tamanho={16} />} onPress={() => falar(f.en)} />
      </View>

      <Cota rotulo="distratores" />
      {distratores.map((d) => (
        <View key={d.en} style={estilos.distrator}>
          <Texto variante="rotulo" cor={cores.erro} style={estilos.tipo}>
            {NOME_TIPO[d.tipo]}
          </Texto>
          <Texto variante="corpo">{d.en}</Texto>
          <Texto variante="suave">{d.explicacao}</Texto>
        </View>
      ))}

      <Cota rotulo="blocos" />
      <View style={estilos.blocos}>
        {f.blocosEn.map((b, k) => (
          <View key={`${b}-${k}`} style={estilos.bloco}>
            <Texto style={estilos.textoBloco}>{b}</Texto>
          </View>
        ))}
        {extras.map((b, k) => (
          <View key={`extra-${b}-${k}`} style={[estilos.bloco, estilos.blocoExtra]}>
            <Texto style={[estilos.textoBloco, { color: cores.erro }]}>{b}</Texto>
          </View>
        ))}
      </View>
    </Prancha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  topo: {
    gap: espaco.x1,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: espaco.x2,
  },
  linhaFrase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x3,
    marginTop: espaco.x3,
  },
  distrator: {
    marginTop: espaco.x2,
  },
  tipo: {
    fontSize: 10,
  },
  blocos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.x2,
  },
  bloco: {
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.6),
    borderRadius: raio,
    paddingHorizontal: espaco.x3,
    paddingVertical: espaco.x1 + 2,
    backgroundColor: alfa(cores.traco, 0.08),
  },
  blocoExtra: {
    borderStyle: 'dashed',
    borderColor: alfa(cores.erro, 0.6),
    backgroundColor: alfa(cores.erro, 0.05),
  },
  textoBloco: {
    fontFamily: fontes.monoMedia,
    fontSize: 14,
    color: cores.texto,
  },
});
