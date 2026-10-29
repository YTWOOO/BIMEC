import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ETAPA_ATUAL, NOME_APP, VERSAO_APP } from '@/config';
import { AreaDeTeste } from '@/notificacoes/AreaDeTeste';
import { trocaAgora } from '@/notificacoes/palavraDoDia';
import { usePermissao } from '@/notificacoes/usePermissao';
import { VERSAO_ESQUEMA } from '@/store/padrao';
import { useProgresso } from '@/store/progresso';
import { INTERVALOS_PALAVRA, METAS_DIARIAS } from '@/store/tipos';
import { Botao } from '@/ui/Botao';
import { GrupoOpcoes, Passo } from '@/ui/Controles';
import { Cota } from '@/ui/Cota';
import { Interruptor } from '@/ui/Interruptor';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { cores, espaco } from '@/ui/tema';
import { formatarHora } from '@/util/datas';
import { useAgora } from '@/util/useAgora';

function StatusPermissao() {
  const { estado, pedir } = usePermissao();
  if (estado === 'carregando') return null;
  if (estado === 'indisponivel') {
    return (
      <Texto variante="suave" style={estilos.nota}>
        A palavra na tela de bloqueio só funciona no celular Android.
      </Texto>
    );
  }
  if (estado === 'concedida') {
    return (
      <Texto variante="rotulo" cor={cores.acerto} style={estilos.nota}>
        Notificações liberadas
      </Texto>
    );
  }
  return (
    <View style={estilos.nota}>
      <Texto variante="suave">
        {estado === 'negada'
          ? 'As notificações estão bloqueadas para o app. Libere nas configurações do celular.'
          : 'Falta liberar as notificações.'}
      </Texto>
      <View style={estilos.botaoPermissao}>
        <Botao
          titulo={estado === 'negada' ? 'Abrir configurações' : 'Permitir notificações'}
          variante="contorno"
          onPress={pedir}
        />
      </View>
    </View>
  );
}

export default function Config() {
  const perfil = useProgresso((s) => s.perfil);
  const agora = useAgora();
  const definirPalavraNaTela = useProgresso((s) => s.definirPalavraNaTela);
  const definirIntervaloPalavra = useProgresso((s) => s.definirIntervaloPalavra);
  const moverSilencio = useProgresso((s) => s.moverSilencio);
  const moverLembrete = useProgresso((s) => s.moverLembrete);
  const definirMetaDiaria = useProgresso((s) => s.definirMetaDiaria);
  const resetar = useProgresso((s) => s.resetar);
  const [confirmarReset, setConfirmarReset] = useState(false);

  return (
    <Tela>
      <View style={estilos.topo}>
        <Texto variante="titulo">Configurações</Texto>
        <Texto variante="suave">Tudo fica salvo só no seu celular.</Texto>
      </View>

      <Prancha>
        <Texto variante="rotulo">Palavra na tela de bloqueio</Texto>
        <View style={estilos.pergunta}>
          <Interruptor
            rotulo="Mostrar a palavra"
            descricao="Fica fixa na tela de bloqueio e troca sozinha."
            valor={perfil.palavraNaTelaDeBloqueio}
            aoMudar={definirPalavraNaTela}
          />
        </View>
        <StatusPermissao />
        <Cota />
        <Texto variante="corpo" style={estilos.pergunta}>
          Trocar a palavra a cada
        </Texto>
        <GrupoOpcoes
          opcoes={INTERVALOS_PALAVRA}
          valor={perfil.intervaloPalavraHoras}
          aoMudar={definirIntervaloPalavra}
          formatar={(h) => `${h} h`}
          rotuloAcessivel="Intervalo de troca da palavra"
        />
        <Cota />
        <Texto variante="corpo" style={estilos.pergunta}>
          Não trocar entre
        </Texto>
        <View style={estilos.linhaHorario}>
          <Texto variante="rotulo" style={estilos.rotuloHorario}>
            das
          </Texto>
          <Passo
            valor={perfil.silencio.inicio}
            aoDiminuir={() => moverSilencio('inicio', -30)}
            aoAumentar={() => moverSilencio('inicio', 30)}
            rotuloAcessivel="início do horário de silêncio"
          />
        </View>
        <View style={estilos.linhaHorario}>
          <Texto variante="rotulo" style={estilos.rotuloHorario}>
            até
          </Texto>
          <Passo
            valor={perfil.silencio.fim}
            aoDiminuir={() => moverSilencio('fim', -30)}
            aoAumentar={() => moverSilencio('fim', 30)}
            rotuloAcessivel="fim do horário de silêncio"
          />
        </View>
        {perfil.palavraNaTelaDeBloqueio && (
          <Texto variante="suave" style={estilos.nota}>
            Próxima troca às {formatarHora(trocaAgora(perfil, agora).proxima)}.
          </Texto>
        )}
      </Prancha>

      <AreaDeTeste />

      <Prancha>
        <Texto variante="rotulo">Lembrete diário</Texto>
        <Texto variante="corpo" style={estilos.pergunta}>
          Me lembrar às
        </Texto>
        <Passo
          valor={perfil.horarioLembrete}
          aoDiminuir={() => moverLembrete(-30)}
          aoAumentar={() => moverLembrete(30)}
          rotuloAcessivel="horário do lembrete"
        />
        <Texto variante="suave" style={estilos.nota}>
          Só toca se a meta do dia ainda não foi batida.
        </Texto>
      </Prancha>

      <Prancha>
        <Texto variante="rotulo">Meta diária</Texto>
        <Texto variante="corpo" style={estilos.pergunta}>
          Quanto XP por dia
        </Texto>
        <GrupoOpcoes
          opcoes={METAS_DIARIAS}
          valor={perfil.metaDiariaXp as (typeof METAS_DIARIAS)[number]}
          aoMudar={definirMetaDiaria}
          formatar={(xp) => `${xp} XP`}
          rotuloAcessivel="Meta diária de XP"
        />
      </Prancha>

      <Prancha>
        <Texto variante="rotulo">Dados</Texto>
        <Texto variante="suave" style={estilos.pergunta}>
          Apaga palavras vistas, XP, ofensiva e volta as configurações ao padrão.
        </Texto>
        <Botao
          titulo={confirmarReset ? 'Toque de novo para apagar' : 'Resetar progresso'}
          variante="perigo"
          onPress={() => {
            if (confirmarReset) {
              resetar();
              setConfirmarReset(false);
            } else {
              setConfirmarReset(true);
            }
          }}
        />
        {confirmarReset && (
          <View style={estilos.cancelar}>
            <Botao titulo="Cancelar" variante="contorno" onPress={() => setConfirmarReset(false)} />
          </View>
        )}
      </Prancha>

      <Texto variante="rotulo" style={estilos.rodape}>
        {NOME_APP} v{VERSAO_APP} · etapa {ETAPA_ATUAL} · dados v{VERSAO_ESQUEMA}
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: espaco.x1,
    paddingTop: espaco.x2,
  },
  pergunta: {
    marginTop: espaco.x2,
    marginBottom: espaco.x3,
  },
  linhaHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x3,
    marginBottom: espaco.x2,
  },
  rotuloHorario: {
    width: 36,
  },
  nota: {
    marginTop: espaco.x3,
  },
  botaoPermissao: {
    marginTop: espaco.x3,
  },
  cancelar: {
    marginTop: espaco.x2,
  },
  rodape: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: espaco.x2,
  },
});
