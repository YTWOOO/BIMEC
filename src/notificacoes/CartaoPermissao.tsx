import { StyleSheet, View } from 'react-native';

import { Botao } from '@/ui/Botao';
import { IconeSino } from '@/ui/Icones';
import { Prancha } from '@/ui/Prancha';
import { Texto } from '@/ui/Texto';
import { cores, espaco } from '@/ui/tema';

import { usePermissao } from './usePermissao';

/** Aparece no Início enquanto a notificação não estiver liberada. */
export function CartaoPermissao() {
  const { estado, pedir } = usePermissao();
  if (estado !== 'perguntar' && estado !== 'negada') return null;

  return (
    <Prancha destaque>
      <View style={estilos.linha}>
        <IconeSino tamanho={26} cor={cores.tracoClaro} />
        <View style={estilos.flex}>
          <Texto variante="corpoForte">Palavra na tela de bloqueio</Texto>
          <Texto variante="suave">
            {estado === 'negada'
              ? 'As notificações estão bloqueadas. Libere nas configurações do celular para a palavra aparecer.'
              : 'Libere as notificações para ver uma palavra nova toda vez que olhar o celular.'}
          </Texto>
        </View>
      </View>
      <View style={estilos.botao}>
        <Botao
          titulo={estado === 'negada' ? 'Abrir configurações' : 'Permitir notificações'}
          onPress={pedir}
        />
      </View>
    </Prancha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  linha: {
    flexDirection: 'row',
    gap: espaco.x3,
    alignItems: 'flex-start',
  },
  botao: {
    marginTop: espaco.x4,
  },
});
