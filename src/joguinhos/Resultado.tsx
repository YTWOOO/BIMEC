import { StyleSheet, View } from 'react-native';

import { CONTRACOES, ESTRUTURAS, MOLDES, palavraPorId } from '@/conteudo';
import { separarId } from '@/motor/itens';
import { useProgresso } from '@/store/progresso';
import { xpDeHoje } from '@/store/selecionar';
import { BarraProgresso } from '@/ui/BarraProgresso';
import { Botao } from '@/ui/Botao';
import { Carimbo } from '@/ui/Carimbo';
import { Cota } from '@/ui/Cota';
import { IconeRaio } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Texto } from '@/ui/Texto';
import { cores, espaco, fontes } from '@/ui/tema';

import type { ResultadoLicao, Sessao } from './sessao';

/** Nome curto de um item para a lista de novidades. */
function descreverItem(itemId: string): { en: string; pt: string } {
  const { tipo, id } = separarId(itemId);
  if (tipo === 'palavra') {
    const p = palavraPorId(id);
    return { en: p?.en ?? id, pt: p?.pt ?? '' };
  }
  if (tipo === 'molde') {
    const m = MOLDES.find((x) => x.id === id);
    const e = ESTRUTURAS.find((x) => x.id === m?.estrutura);
    return { en: e?.nome ?? id, pt: 'estrutura de frase' };
  }
  const c = CONTRACOES.find((x) => x.id === id);
  return { en: c ? `${c.pt} = ${c.partes.join(' + ')}` : id, pt: c?.en ?? '' };
}

type Props = {
  resultado: ResultadoLicao;
  sessao: Sessao;
  aoContinuar: () => void;
  aoOutra: () => void;
};

export function Resultado({ resultado: r, sessao, aoContinuar, aoOutra }: Props) {
  const perfil = useProgresso((s) => s.perfil);
  const hoje = xpDeHoje(perfil, sessao.hoje);
  const fracao = r.exercicios > 0 ? r.acertosDePrimeira / r.exercicios : 1;

  return (
    <View style={estilos.raiz}>
      <Carimbo partes={['Lição concluída', sessao.titulo]} cor={cores.acerto} />

      <View style={estilos.xp}>
        <IconeRaio tamanho={40} cor={cores.ofensiva} />
        <Texto variante="destaque" cor={cores.ofensiva} style={estilos.numeroXp}>
          +{sessao.salvar ? r.xp.total : 0} XP
        </Texto>
      </View>
      {!sessao.salvar && (
        <Texto variante="suave" style={estilos.centro}>
          Na galeria de joguinhos nada é salvo.
        </Texto>
      )}

      <Prancha>
        <Texto variante="rotulo">Acertos de primeira</Texto>
        <Texto variante="numero" style={estilos.linha}>
          {r.acertosDePrimeira}
          <Texto variante="suave"> de {r.exercicios} · {Math.round(fracao * 100)}%</Texto>
        </Texto>
        <BarraProgresso fracao={fracao} cor={cores.acerto} marcas={Math.max(1, r.exercicios)} />
        {sessao.salvar && (
          <>
            <Cota rotulo="XP" />
            <LinhaXp rotulo="Acertos" valor={r.xp.acertos} />
            <LinhaXp rotulo="Lição terminada" valor={r.xp.terminar} />
            {r.xp.perfeita > 0 && <LinhaXp rotulo="Sem nenhum erro" valor={r.xp.perfeita} />}
          </>
        )}
      </Prancha>

      {sessao.salvar && (
        <Prancha>
          <Texto variante="rotulo">XP de hoje</Texto>
          <Texto variante="numero" style={estilos.linha}>
            {hoje}
            <Texto variante="suave">/{perfil.metaDiariaXp}</Texto>
          </Texto>
          <BarraProgresso fracao={hoje / perfil.metaDiariaXp} marcas={5} />
          <Texto variante="suave" style={estilos.linha}>
            {hoje >= perfil.metaDiariaXp ? 'Meta do dia batida!' : `Faltam ${perfil.metaDiariaXp - hoje} XP para a meta do dia.`}
          </Texto>
        </Prancha>
      )}

      {r.novos.length > 0 && (
        <Prancha>
          <Texto variante="rotulo">Novidades desta lição</Texto>
          {r.novos.map((id) => {
            const d = descreverItem(id);
            return (
              <View key={id} style={estilos.novo}>
                <Texto style={estilos.novoEn}>{d.en}</Texto>
                <Texto variante="suave">{d.pt}</Texto>
              </View>
            );
          })}
        </Prancha>
      )}

      <View style={estilos.botoes}>
        <Botao titulo="Continuar" onPress={aoContinuar} />
        <Botao titulo="Outra lição" variante="contorno" onPress={aoOutra} />
      </View>
    </View>
  );
}

function LinhaXp({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <View style={estilos.linhaXp}>
      <Texto variante="corpo">{rotulo}</Texto>
      <Texto variante="corpoForte">+{valor}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.x4,
  },
  xp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.x2,
    paddingVertical: espaco.x3,
  },
  numeroXp: {
    fontSize: 44,
    lineHeight: 52,
  },
  centro: {
    textAlign: 'center',
  },
  linha: {
    marginVertical: espaco.x2,
  },
  linhaXp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espaco.x1,
  },
  novo: {
    marginTop: espaco.x3,
  },
  novoEn: {
    fontFamily: fontes.monoForte,
    fontSize: 16,
    color: cores.texto,
  },
  botoes: {
    gap: espaco.x3,
  },
});
