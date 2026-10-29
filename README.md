# BIMEC

App Android para aprender inglês juntando palavras em frases, com palavra do dia na tela de bloqueio e dificuldade que acompanha a evolução. Feito com React Native + Expo (SDK 58), em TypeScript, tudo offline.

O plano completo, com as 10 etapas, está no documento **BIMEC — Plano do App**. Cada etapa é feita em um prompt e termina com o app abrindo no Expo Go.

## Como rodar no celular

### Uma vez só

1. Instale o [Node.js](https://nodejs.org) (versão LTS) e o [Git](https://git-scm.com) no notebook.
2. Instale o **Expo Go** no celular, pela Play Store.
3. Clone o repositório:

   ```bash
   git clone https://github.com/YTWOOO/BIMEC.git
   cd BIMEC
   ```

### A cada etapa nova

```bash
git pull
npm install
npx expo start
```

Abra o Expo Go no celular e leia o QR code que aparece no terminal. O celular e o notebook precisam estar na mesma Wi-Fi. Se a rede bloquear a conexão, use:

```bash
npx expo start --tunnel
```

Com o app aberto, toda vez que um arquivo muda a tela atualiza sozinha.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm start` | inicia o servidor do Expo |
| `npm test` | roda os testes (Jest) |
| `npm run typecheck` | confere os tipos do TypeScript |
| `npm run lint` | confere o estilo do código |

## Pastas

```
src/
  app/            telas (Expo Router)
    (tabs)/       Início, Revisão, Estatísticas, Configurações
    licao/        tela da lição e do resultado
    palavra/      tela de cada palavra
    depuracao.tsx frases geradas e desenhos do "Onde está?" (só no modo de desenvolvimento)
  conteudo/       palavras, moldes de frase, contrações, unidades (JSON), temas e estruturas
  gerador/        gerador de frases: português (gênero, contrações), frases, distratores e traduções erradas
  joguinhos/      perguntas de cada joguinho, correção, fila da lição e os componentes de tela
  dicionario/     dicionário de toque: fichas das palavras, frase tocável e painel
  motor/          revisão espaçada, degraus, ajuste para 80%, montagem de lição e simulação
  notificacoes/   palavra na tela de bloqueio, canais, permissão, tarefa de fundo
  store/          progresso salvo no celular (zustand + AsyncStorage)
  ui/             tema planta técnica e componentes visuais
  util/           datas, áudio e formatação
__tests__/        testes
```

O tema fica em `src/ui/tema.ts`. Nenhuma tela usa cor ou fonte fora dele.

## Lições e joguinhos

No Início, cada unidade tem o botão Começar (ou Praticar). A lição tem 12 exercícios montados pelo motor: revisões vencidas, itens em progresso e itens novos, cada um com o joguinho do seu degrau. Errou, o exercício volta no fim da lição. No fim aparece o resultado com o XP: 1 por acerto de primeira (desafio vale 2), 5 por terminar e mais 5 se não errou nenhum.

Joguinhos prontos (degraus 0 a 2): Card novo, Inglês → português, Ligar pares, Onde está?, Português → inglês, Completar a frase e Ouvir e escolher. Os dos degraus 3 a 5 chegam na etapa 6; até lá, um item num degrau alto usa o joguinho pronto mais difícil.

Na tela de uma palavra, **Praticar agora** abre uma lição da unidade do tema com aquela palavra garantida. No modo de desenvolvimento, Ajustes → Área de teste → **Ver todos os joguinhos** abre uma lição com um exercício de cada joguinho, que não salva nada.

## Dicionário de toque

Toda frase em inglês do app é tocável: cada palavra (e expressões como "next to" e "in front of") abre uma ficha com o significado, uma explicação curta e os contextos em que ela aparece, com áudio. Os substantivos vêm das palavras do conteúdo; artigos, preposições, verbos e o resto vêm de `src/conteudo/glossario.json`. Um teste garante que toda palavra das frases do app tem ficha.

## Palavra na tela de bloqueio

A palavra fica numa notificação fixa e troca no intervalo escolhido em Ajustes, fora do horário de silêncio. A cada 3 trocas, 1 traz palavra nova e as outras trazem revisão, escolhidas pelo motor. Toda troca usa o mesmo identificador, então a notificação nova substitui a anterior. Duas coisas fazem a troca acontecer com o app fechado: a próxima troca já fica agendada, e uma tarefa de fundo confere a palavra mais ou menos a cada 15 minutos.

No modo de desenvolvimento, Ajustes mostra uma **Área de teste** para forçar a palavra, testar uma troca em 1 minuto e rodar a tarefa de fundo.
