import { StyleSheet, Switch, View } from 'react-native';

import { Texto } from './Texto';
import { alfa, cores, espaco } from './tema';

type Props = {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
};

/** Linha com texto à esquerda e chave liga/desliga à direita. */
export function Interruptor({ rotulo, descricao, valor, aoMudar }: Props) {
  return (
    <View style={estilos.linha}>
      <View style={estilos.textos}>
        <Texto variante="corpo">{rotulo}</Texto>
        {descricao ? <Texto variante="suave">{descricao}</Texto> : null}
      </View>
      <Switch
        accessibilityLabel={rotulo}
        value={valor}
        onValueChange={aoMudar}
        trackColor={{ false: alfa(cores.textoSuave, 0.3), true: alfa(cores.traco, 0.85) }}
        thumbColor={valor ? cores.tracoClaro : cores.textoSuave}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x3,
  },
  textos: {
    flex: 1,
  },
});
