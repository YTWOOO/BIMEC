import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { UNIDADES } from '@/conteudo';
import { nomeDoTema } from '@/conteudo/temas';
import type { Unidade } from '@/conteudo/tipos';
import { FraseTocavel } from '@/dicionario/FraseTocavel';
import { itensDaUnidade } from '@/motor/itens';
import { CartaoPermissao } from '@/notificacoes/CartaoPermissao';
import { usePalavraAgora } from '@/notificacoes/usePalavraAgora';
import { useProgresso } from '@/store/progresso';
import { nivelAtual, resumoPalavras, xpDeHoje } from '@/store/selecionar';
import { BarraProgresso } from '@/ui/BarraProgresso';
import { Botao } from '@/ui/Botao';
import { Carimbo } from '@/ui/Carimbo';
import { Cota, CotaVertical } from '@/ui/Cota';
import { FaixaPincel } from '@/ui/FaixaPincel';
import { IconeChama, IconeCheck, IconeLivro, IconeRaio, IconeSom } from '@/ui/Icones';
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
  // A unidade em destaque é a primeira que ainda tem itens por começar.
  const unidadeAtual = UNIDADES.find((u) => {
    const { comecados, total } = andamento(u, itens);
    return comecados < total;
  })?.id;

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
        {UNIDADES.map((u, i) => (
          <Fragment key={u.id}>
            {i > 0 && <CotaVertical />}
            <CartaoUnidade unidade={u} atual={u.id === unidadeAtual} />
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

function andamento(u: Unidade, itens: Record<string, { degrau: number }>) {
  const pool = itensDaUnidade(u);
  return {
    total: pool.length,
    comecados: pool.filter((i) => (itens[i.id]?.degrau ?? 0) >= 1).length,
    dominados: pool.filter((i) => (itens[i.id]?.degrau ?? 0) >= 5).length,
  };
}

/**
 * Unidade da trilha. Por enquanto todas ficam abertas, para dar para praticar qualquer uma;
 * cadeados, lições contadas e chefão chegam na etapa 7.
 */
function CartaoUnidade({ unidade: u, atual }: { unidade: Unidade; atual: boolean }) {
  const itens = useProgresso((s) => s.itens);
  const { total, comecados, dominados } = andamento(u, itens);
  const completa = total > 0 && comecados === total;
  return (
    <Prancha destaque={atual}>
      <View style={estilos.topoUnidade}>
        <Carimbo
          partes={[`Unidade ${doisDigitos(u.numero)}`, u.tipo === 'tema' ? 'Tema' : 'Estrutura']}
          cor={atual ? cores.tracoClaro : cores.textoSuave}
        />
        {completa && <IconeCheck tamanho={20} />}
      </View>
      <Texto variante="subtitulo" style={estilos.tituloUnidade}>
        {u.titulo}
      </Texto>
      <View style={estilos.linhaProgresso}>
        <View style={estilos.flex}>
          <BarraProgresso fracao={total > 0 ? comecados / total : 0} cor={completa ? cores.acerto : cores.tracoClaro} />
        </View>
        <Texto variante="rotulo">
          {comecados}/{total} {u.tipo === 'tema' ? 'palavras' : 'itens'}
        </Texto>
      </View>
      {dominados > 0 && (
        <Texto variante="suave" style={estilos.dominados}>
          {dominados} {dominados === 1 ? 'dominado' : 'dominados'}
        </Texto>
      )}
      <View style={estilos.acaoUnidade}>
        <Botao
          titulo={comecados === 0 ? 'Começar' : 'Praticar'}
          variante={atual ? 'principal' : 'contorno'}
          onPress={() => router.push({ pathname: '/licao/[id]', params: { id: u.id } })}
        />
      </View>
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
  },
  dominados: {
    marginTop: espaco.x2,
  },
});
