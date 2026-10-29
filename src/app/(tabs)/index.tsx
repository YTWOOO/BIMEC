import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { nomeDoTema } from '@/conteudo/temas';
import { unidadesExemplo, type UnidadeExemplo } from '@/data/exemplo';
import { FraseTocavel } from '@/dicionario/FraseTocavel';
import { CartaoPermissao } from '@/notificacoes/CartaoPermissao';
import { usePalavraAgora } from '@/notificacoes/usePalavraAgora';
import { useProgresso } from '@/store/progresso';
import { nivelAtual, resumoPalavras, xpDeHoje } from '@/store/selecionar';
import { BarraProgresso } from '@/ui/BarraProgresso';
import { Botao } from '@/ui/Botao';
import { Carimbo } from '@/ui/Carimbo';
import { Cota, CotaVertical } from '@/ui/Cota';
import { FaixaPincel } from '@/ui/FaixaPincel';
import { IconeCadeado, IconeChama, IconeCheck, IconeLivro, IconeRaio, IconeSom } from '@/ui/Icones';
import { Logo } from '@/ui/Logo';
import { Prancha } from '@/ui/Prancha';
import { Tela } from '@/ui/Tela';
import { Texto } from '@/ui/Texto';
import { alfa, cores, espaco } from '@/ui/tema';
import { falar } from '@/util/audio';
import { diaLocal, formatarHora } from '@/util/datas';
import { doisDigitos } from '@/util/formatar';

export default function Inicio() {
  const perfil = useProgresso((s) => s.perfil);
  const itens = useProgresso((s) => s.itens);
  const hoje = diaLocal();
  const nivel = nivelAtual(itens);
  const xpHoje = xpDeHoje(perfil, hoje);
  const { vistas } = resumoPalavras(itens);

  return (
    <Tela>
      <View style={estilos.cabecalho}>
        <Logo />
        <Carimbo partes={[`Nível ${doisDigitos(nivel)}`]} cor={cores.tracoClaro} />
      </View>

      <View style={estilos.linhaNumeros}>
        <Prancha style={estilos.caixaNumero}>
          <IconeChama tamanho={20} />
          <Texto variante="numero">{perfil.ofensiva}</Texto>
          <Texto variante="rotulo" style={estilos.rotuloNumero}>
            dias de ofensiva
          </Texto>
        </Prancha>
        <Prancha style={estilos.caixaNumero}>
          <IconeRaio tamanho={20} />
          <Texto variante="numero">
            {xpHoje}
            <Texto variante="suave">/{perfil.metaDiariaXp}</Texto>
          </Texto>
          <Texto variante="rotulo" style={estilos.rotuloNumero}>
            XP hoje
          </Texto>
          <BarraProgresso fracao={xpHoje / perfil.metaDiariaXp} marcas={5} />
        </Prancha>
        <Prancha style={estilos.caixaNumero}>
          <IconeLivro tamanho={20} />
          <Texto variante="numero">{vistas}</Texto>
          <Texto variante="rotulo" style={estilos.rotuloNumero}>
            palavras vistas
          </Texto>
        </Prancha>
      </View>

      <CartaoPermissao />

      <PalavraDeAgora />

      <FaixaPincel texto="Sua trilha" />

      <View>
        {unidadesExemplo.map((u, i) => (
          <Fragment key={u.numero}>
            {i > 0 && <CotaVertical />}
            <CartaoUnidade unidade={u} />
          </Fragment>
        ))}
      </View>
    </Tela>
  );
}

/** A mesma palavra que está na tela de bloqueio agora. */
function PalavraDeAgora() {
  const { troca, palavra: p } = usePalavraAgora();

  if (!p) {
    return (
      <Prancha>
        <Texto variante="rotulo">Palavra de agora</Texto>
        <Texto variante="suave" style={estilos.carregando}>
          Escolhendo a palavra…
        </Texto>
      </Prancha>
    );
  }

  const abrir = () => router.push({ pathname: '/palavra/[id]', params: { id: p.id } });

  // Nenhum botão fica dentro de outro (na web vira <button> dentro de <button>).
  // A frase de exemplo fica fora dos botões porque cada palavra dela abre o dicionário.
  return (
    <Prancha>
      <Texto variante="rotulo">Palavra de agora · {nomeDoTema(p.tema)}</Texto>
      <View style={estilos.linhaPalavra}>
        <Pressable
          onPress={abrir}
          accessibilityRole="button"
          accessibilityLabel={`Abrir a palavra ${p.en}`}
          style={({ pressed }) => [estilos.flex, pressed && { opacity: 0.75 }]}>
          <Texto variante="destaque">{p.en}</Texto>
          <Texto variante="subtitulo" cor={cores.textoSuave}>
            {p.pt}
          </Texto>
        </Pressable>
        <Pressable
          onPress={() => falar(p.en)}
          accessibilityRole="button"
          accessibilityLabel={`Ouvir ${p.en}`}
          hitSlop={8}
          style={({ pressed }) => [estilos.botaoSom, pressed && { opacity: 0.6 }]}>
          <IconeSom tamanho={22} />
        </Pressable>
      </View>
      <Cota rotulo="exemplo" />
      <FraseTocavel frase={p.exemplo.en} />
      <Texto variante="suave">{p.exemplo.pt}</Texto>
      <View style={estilos.rodapePalavra}>
        <Texto variante="rotulo" style={estilos.rotuloPequeno}>
          Troca às {formatarHora(troca.proxima)}
        </Texto>
        <Pressable onPress={abrir} accessibilityRole="button" accessibilityLabel={`Ver mais sobre ${p.en}`} hitSlop={10}>
          <Texto variante="rotulo" cor={cores.tracoClaro} style={estilos.rotuloPequeno}>
            Ver mais →
          </Texto>
        </Pressable>
      </View>
    </Prancha>
  );
}

function CartaoUnidade({ unidade: u }: { unidade: UnidadeExemplo }) {
  const [aviso, setAviso] = useState(false);
  const bloqueada = u.estado === 'bloqueada';
  const atual = u.estado === 'atual';
  return (
    <Prancha destaque={atual} tracejada={bloqueada}>
      <View style={estilos.topoUnidade}>
        <Carimbo
          partes={[`Unidade ${doisDigitos(u.numero)}`, u.tipo]}
          cor={atual ? cores.tracoClaro : cores.textoSuave}
        />
        {u.estado === 'concluida' && <IconeCheck tamanho={20} />}
        {bloqueada && <IconeCadeado tamanho={18} />}
      </View>
      <Texto variante="subtitulo" cor={bloqueada ? cores.textoSuave : cores.texto} style={estilos.tituloUnidade}>
        {u.titulo}
      </Texto>
      <View style={estilos.linhaProgresso}>
        <View style={estilos.flex}>
          <BarraProgresso
            fracao={u.licoesFeitas / u.licoesTotal}
            cor={u.estado === 'concluida' ? cores.acerto : cores.tracoClaro}
          />
        </View>
        <Texto variante="rotulo">
          {u.licoesFeitas}/{u.licoesTotal} lições
        </Texto>
      </View>
      {atual && (
        <View style={estilos.acaoUnidade}>
          <Botao titulo="Continuar" onPress={() => setAviso(true)} />
          {aviso && (
            <Texto variante="suave" style={estilos.aviso}>
              As lições chegam na etapa 5. Por enquanto a trilha é só de exemplo.
            </Texto>
          )}
        </View>
      )}
    </Prancha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: espaco.x2,
  },
  linhaNumeros: {
    flexDirection: 'row',
    gap: espaco.x2 + 2,
  },
  caixaNumero: {
    flex: 1,
    padding: espaco.x3,
    gap: 2,
  },
  rotuloNumero: {
    fontSize: 9.5,
    lineHeight: 13,
    marginBottom: 4,
  },
  linhaPalavra: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: espaco.x2,
  },
  carregando: {
    marginTop: espaco.x2,
  },
  rodapePalavra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espaco.x3,
  },
  rotuloPequeno: {
    fontSize: 10,
  },
  botaoSom: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: alfa(cores.traco, 0.55),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topoUnidade: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tituloUnidade: {
    marginTop: espaco.x3,
    marginBottom: espaco.x3,
  },
  linhaProgresso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.x3,
  },
  acaoUnidade: {
    marginTop: espaco.x4,
    gap: espaco.x2,
  },
  aviso: {
    textAlign: 'center',
  },
});
