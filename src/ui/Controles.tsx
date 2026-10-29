import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Texto } from './Texto';
import { alfa, cores, espaco, fontes, raio } from './tema';

function toque() {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync().catch(() => {});
  }
}

type PropsGrupo<T extends string | number> = {
  opcoes: readonly T[];
  valor: T;
  aoMudar: (v: T) => void;
  formatar?: (v: T) => string;
  rotuloAcessivel: string;
};

/** Linha de opções em que só uma fica marcada. */
export function GrupoOpcoes<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  formatar = (v) => String(v),
  rotuloAcessivel,
}: PropsGrupo<T>) {
  return (
    <View style={estilos.grupo} accessibilityRole="radiogroup" accessibilityLabel={rotuloAcessivel}>
      {opcoes.map((op) => {
        const marcado = op === valor;
        return (
          <Pressable
            key={String(op)}
            accessibilityRole="radio"
            accessibilityState={{ checked: marcado }}
            onPress={() => {
              toque();
              aoMudar(op);
            }}
            style={({ pressed }) => [estilos.opcao, marcado && estilos.opcaoMarcada, pressed && { opacity: 0.75 }]}>
            <Texto style={[estilos.textoOpcao, { color: marcado ? cores.fundo : cores.tracoClaro }]}>
              {formatar(op)}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

type PropsPasso = {
  valor: string;
  aoDiminuir: () => void;
  aoAumentar: () => void;
  rotuloAcessivel: string;
};

/** Valor com botões de menos e mais nos lados. */
export function Passo({ valor, aoDiminuir, aoAumentar, rotuloAcessivel }: PropsPasso) {
  return (
    <View style={estilos.passo} accessibilityLabel={rotuloAcessivel}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${rotuloAcessivel}`}
        onPress={() => {
          toque();
          aoDiminuir();
        }}
        style={({ pressed }) => [estilos.botaoPasso, pressed && { opacity: 0.7 }]}>
        <Texto style={estilos.sinal}>−</Texto>
      </Pressable>
      <Texto style={estilos.valorPasso}>{valor}</Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${rotuloAcessivel}`}
        onPress={() => {
          toque();
          aoAumentar();
        }}
        style={({ pressed }) => [estilos.botaoPasso, pressed && { opacity: 0.7 }]}>
        <Texto style={estilos.sinal}>+</Texto>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.x2,
  },
  opcao: {
    minWidth: 52,
    minHeight: 40,
    paddingHorizontal: espaco.x3,
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.55),
    borderRadius: raio,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alfa(cores.traco, 0.06),
  },
  opcaoMarcada: {
    backgroundColor: cores.tracoClaro,
    borderColor: cores.tracoClaro,
  },
  textoOpcao: {
    fontFamily: fontes.monoForte,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  passo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.55),
    borderRadius: raio,
    alignSelf: 'flex-start',
  },
  botaoPasso: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinal: {
    fontFamily: fontes.monoForte,
    fontSize: 18,
    color: cores.tracoClaro,
  },
  valorPasso: {
    fontFamily: fontes.monoForte,
    fontSize: 15,
    minWidth: 64,
    textAlign: 'center',
    color: cores.texto,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: alfa(cores.traco, 0.35),
    paddingVertical: 9,
  },
});
