import { StyleSheet, View } from 'react-native';

import { useProgresso } from '@/store/progresso';
import { contarVencidos } from '@/store/selecionar';
import { Botao } from '@/ui/Botao';
import { Cota } from '@/ui/Cota';
import { IconeRevisao } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { cores, espaco } from '@/ui/tema';
import { diaLocal } from '@/util/datas';

const REGRAS = [
  { titulo: 'Acertou', texto: 'A palavra volta em 1 dia, depois em 3, e cada vez mais espaçado.' },
  { titulo: 'Errou', texto: 'Ela volta no dia seguinte e desce um degrau na escada.' },
  { titulo: 'Fácil demais', texto: 'Um toque pula 2 degraus e manda a revisão para daqui a 7 dias.' },
];

export default function Revisao() {
  const itens = useProgresso((s) => s.itens);
  const vencidos = contarVencidos(itens, diaLocal());

  return (
    <Tela>
      <View style={estilos.topo}>
        <Texto variante="titulo">Revisão</Texto>
        <Texto variante="suave">As palavras que você está esquecendo voltam aqui na hora certa.</Texto>
      </View>

      <Prancha destaque={vencidos > 0}>
        <View style={estilos.linhaContagem}>
          <IconeRevisao tamanho={28} cor={cores.tracoClaro} />
          <View>
            <Texto variante="destaque">{vencidos}</Texto>
            <Texto variante="rotulo">itens para revisar hoje</Texto>
          </View>
        </View>
        <Cota />
        <Texto variante="corpo">
          {vencidos === 0
            ? 'Nada para revisar agora. Quando você começar as lições, cada palavra ganha uma data de revisão, e as que vencerem aparecem aqui.'
            : 'Comece pela revisão: são as palavras mais perto de serem esquecidas.'}
        </Texto>
        <View style={estilos.botao}>
          <Botao titulo="Revisar agora" variante="contorno" desativado={vencidos === 0} />
        </View>
      </Prancha>

      <Prancha>
        <Texto variante="rotulo">Como a revisão funciona</Texto>
        {REGRAS.map((r) => (
          <View key={r.titulo} style={estilos.regra}>
            <Texto variante="corpoForte">{r.titulo}</Texto>
            <Texto variante="suave">{r.texto}</Texto>
          </View>
        ))}
      </Prancha>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: espaco.x1,
    paddingTop: espaco.x2,
  },
  linhaContagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x4,
  },
  botao: {
    marginTop: espaco.x4,
  },
  regra: {
    marginTop: espaco.x3,
  },
});
