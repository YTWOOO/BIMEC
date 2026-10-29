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
    palavra/      tela de cada palavra
  conteudo/       palavras (JSON) e temas
  data/           trilha de exemplo (some na etapa 7)
  notificacoes/   palavra na tela de bloqueio, canais, permissão, tarefa de fundo
  store/          progresso salvo no celular (zustand + AsyncStorage)
  ui/             tema planta técnica e componentes visuais
  util/           datas, áudio e formatação
__tests__/        testes
```

O tema fica em `src/ui/tema.ts`. Nenhuma tela usa cor ou fonte fora dele.

## Palavra na tela de bloqueio

A palavra fica numa notificação fixa e troca no intervalo escolhido em Ajustes, fora do horário de silêncio. Toda troca usa o mesmo identificador, então a notificação nova substitui a anterior. Duas coisas fazem a troca acontecer com o app fechado: a próxima troca já fica agendada, e uma tarefa de fundo confere a palavra mais ou menos a cada 15 minutos.

No modo de desenvolvimento, Ajustes mostra uma **Área de teste** para forçar a palavra, testar uma troca em 1 minuto e rodar a tarefa de fundo.
