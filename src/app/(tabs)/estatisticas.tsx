import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useProgresso } from '@/store/progresso';
import { resumoPalavras } from '@/store/selecionar';
import type { Resposta } from '@/store/tipos';
import { IconeAlvo, IconeCheck, IconeLivro, IconeRaio } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco } from '@/ui/tema';
import { diaLocal } from '@/util/datas';

const DIAS = 30;
const ALTURA_GRAFICO = 72;

export default function Estatisticas() {
  const itens = useProgresso((s) => s.itens);
  const perfil = useProgresso((s) => s.perfil);
  const historico = useProgresso((s) => s.historico);
  const { vistas, dominadas, emProgresso } = resumoPalavras(itens);

  return (
    <Tela>
      <View style={estilos.topo}>
        <Texto variante="titulo">Estatísticas</Texto>
        <Texto variante="suave">Seu progresso em números.</Texto>
      </View>

      <View style={estilos.grade}>
        <CaixaNumero icone={<IconeLivro tamanho={20} />} valor={vistas} rotulo="palavras vistas" />
        <CaixaNumero icone={<IconeCheck tamanho={20} />} valor={dominadas} rotulo="dominadas" />
        <CaixaNumero icone={<IconeAlvo tamanho={20} />} valor={emProgresso} rotulo="em progresso" />
        <CaixaNumero icone={<IconeRaio tamanho={20} />} valor={perfil.xp} rotulo="XP total" />
      </View>

      <Prancha>
        <Texto variante="rotulo">Últimos 30 dias · respostas por dia</Texto>
        <GraficoDias historico={historico} />
        <View style={estilos.eixo}>
          <Texto variante="rotulo" style={estilos.rotuloEixo}>
            30 dias atrás
          </Texto>
          <Texto variante="rotulo" style={estilos.rotuloEixo}>
            hoje
          </Texto>
        </View>
        {historico.length === 0 && (
          <Texto variante="suave" style={estilos.vazio}>
            O gráfico começa a encher depois das primeiras lições.
          </Texto>
        )}
      </Prancha>

      <Prancha>
        <Texto variante="rotulo">Acerto por categoria</Texto>
        <Texto variante="suave" style={estilos.vazio}>
          Aparece quando você tiver respostas em pelo menos uma categoria.
        </Texto>
      </Prancha>
    </Tela>
  );
}

function CaixaNumero({ icone, valor, rotulo }: { icone: ReactNode; valor: number; rotulo: string }) {
  return (
    <Prancha style={estilos.caixa}>
      {icone}
      <Texto variante="numero">{valor}</Texto>
      <Texto variante="rotulo">{rotulo}</Texto>
    </Prancha>
  );
}

function contarPorDia(historico: Resposta[]): number[] {
  const hoje = new Date();
  const dias = Array.from({ length: DIAS }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - (DIAS - 1 - i));
    return diaLocal(d);
  });
  const contagem = new Map<string, number>();
  for (const r of historico) {
    const dia = diaLocal(new Date(r.data));
    contagem.set(dia, (contagem.get(dia) ?? 0) + 1);
  }
  return dias.map((d) => contagem.get(d) ?? 0);
}

function GraficoDias({ historico }: { historico: Resposta[] }) {
  const valores = contarPorDia(historico);
  const maximo = Math.max(1, ...valores);
  return (
    <View style={estilos.grafico} accessibilityLabel="Gráfico de respostas por dia nos últimos 30 dias">
      {valores.map((v, i) => (
        <View key={i} style={estilos.coluna}>
          <View
            style={[
              estilos.barra,
              v === 0
                ? estilos.barraVazia
                : { height: Math.max(4, (v / maximo) * ALTURA_GRAFICO), backgroundColor: cores.tracoClaro },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: espaco.x1,
    paddingTop: espaco.x2,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.x3,
  },
  caixa: {
    flexBasis: '46%',
    flexGrow: 1,
    gap: 2,
  },
  grafico: {
    height: ALTURA_GRAFICO,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: espaco.x4,
    borderBottomWidth: 1,
    borderBottomColor: alfa(cores.traco, 0.6),
  },
  coluna: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  barra: {
    width: '100%',
  },
  barraVazia: {
    height: 3,
    backgroundColor: alfa(cores.traco, 0.35),
  },
  eixo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espaco.x1,
  },
  rotuloEixo: {
    fontSize: 9.5,
  },
  vazio: {
    marginTop: espaco.x2,
  },
});
