import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useProgresso } from '@/store/progresso';
import { Botao } from '@/ui/Botao';
import { Prancha } from '@/ui/Prancha';
import { Texto } from '@/ui/Texto';
import { cores, espaco } from '@/ui/tema';
import { formatarDataHora, formatarHora } from '@/util/datas';

import { agendarTrocaDeTeste, lerRegistroPalavra, type RegistroPalavra } from './palavraDoDia';
import { sincronizarPalavraDoDia } from './sincronizar';
import { lerEstadoTarefa, rodarTarefaAgora } from './tarefa';

type EstadoTarefa = Awaited<ReturnType<typeof lerEstadoTarefa>>;

function quando(iso: string | null | undefined): string {
  return iso ? formatarDataHora(new Date(iso)) : 'nunca';
}

/**
 * Ferramentas para testar a palavra na tela de bloqueio.
 * Só aparece no modo de desenvolvimento (Expo Go), nunca no APK final.
 */
export function AreaDeTeste() {
  const perfil = useProgresso((s) => s.perfil);
  const [registro, setRegistro] = useState<RegistroPalavra | null>(null);
  const [tarefa, setTarefa] = useState<EstadoTarefa | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    lerRegistroPalavra().then(setRegistro);
    lerEstadoTarefa().then(setTarefa);
  }, []);

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'android') return;
    let ativo = true;
    lerRegistroPalavra().then((r) => ativo && setRegistro(r));
    lerEstadoTarefa().then((t) => ativo && setTarefa(t));
    return () => {
      ativo = false;
    };
  }, []);

  if (!__DEV__ || Platform.OS !== 'android') return null;

  return (
    <Prancha tracejada>
      <Texto variante="rotulo">Área de teste · só no modo de desenvolvimento</Texto>

      <View style={estilos.dados}>
        <Linha rotulo="Na tela agora" valor={registro ? `${registro.palavraId} (troca ${registro.numero})` : '—'} />
        <Linha rotulo="Próxima troca" valor={quando(registro?.proxima)} />
        <Linha rotulo="Atualizada" valor={registro ? `${quando(registro.atualizadoEm)} · ${registro.origem}` : '—'} />
        <Linha
          rotulo="Tarefa de fundo"
          valor={tarefa ? `${tarefa.disponivel ? 'disponível' : 'indisponível'} · ${tarefa.registrada ? 'ligada' : 'desligada'}` : '—'}
        />
        <Linha rotulo="Última execução da tarefa" valor={quando(tarefa?.ultimaExecucao)} />
      </View>

      {mensagem && (
        <Texto variante="corpo" cor={cores.tracoClaro} style={estilos.mensagem}>
          {mensagem}
        </Texto>
      )}

      <View style={estilos.botoes}>
        <Botao
          titulo="Mostrar a palavra agora"
          variante="contorno"
          onPress={async () => {
            const r = await sincronizarPalavraDoDia(true);
            setMensagem(
              r?.ativo
                ? `"${r.palavra.en}" está na tela de bloqueio.`
                : 'Não apareceu: confira a permissão e a chave acima.',
            );
            recarregar();
          }}
        />
        <Botao
          titulo="Trocar daqui a 1 minuto"
          variante="contorno"
          onPress={async () => {
            const p = await agendarTrocaDeTeste(perfil);
            const hora = formatarHora(new Date(Date.now() + 60 * 1000));
            setMensagem(
              `"${p.en}" entra por volta das ${hora}. Bloqueie o celular e veja se a palavra troca ou se aparecem duas.`,
            );
          }}
        />
        <Botao
          titulo="Rodar a tarefa de fundo"
          variante="contorno"
          onPress={async () => {
            const ok = await rodarTarefaAgora();
            setMensagem(ok ? 'Tarefa pedida. Os dados atualizam em alguns segundos.' : 'O sistema não rodou a tarefa.');
            setTimeout(recarregar, 3000);
          }}
        />
        <Botao titulo="Atualizar dados" variante="contorno" onPress={recarregar} />
      </View>
    </Prancha>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Texto variante="rotulo" style={estilos.rotuloLinha}>
        {rotulo}
      </Texto>
      <Texto variante="corpo">{valor}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  dados: {
    marginTop: espaco.x3,
    gap: espaco.x2,
  },
  linha: {
    gap: 0,
  },
  rotuloLinha: {
    fontSize: 10,
  },
  mensagem: {
    marginTop: espaco.x3,
  },
  botoes: {
    marginTop: espaco.x4,
    gap: espaco.x2,
  },
});
