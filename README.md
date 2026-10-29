# Encaixe (BIMEC)

App Android para aprender inglês juntando palavras em frases, com palavra do dia na tela de bloqueio e dificuldade que acompanha a evolução. Feito com React Native + Expo (SDK 58), em TypeScript, tudo offline.

O plano completo, com as 10 etapas, está no documento **Encaixe — Plano do App**. Cada etapa é feita em um prompt e termina com o app abrindo no Expo Go.

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
  data/           conteúdo (por enquanto, só exemplo)
  store/          progresso salvo no celular (zustand + AsyncStorage)
  ui/             tema planta técnica e componentes visuais
  util/           datas e formatação
__tests__/        testes
```

O tema fica em `src/ui/tema.ts`. Nenhuma tela usa cor ou fonte fora dele.
