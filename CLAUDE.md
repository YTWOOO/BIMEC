# BIMEC

App Android de inglês (React Native + Expo SDK 58, TypeScript). Leia também `AGENTS.md`.

## Fonte da verdade

O plano do app é o documento **BIMEC — Plano do App** (Claude Docs):
https://claude.ai/artifact/WkRgqVL6mHgyExAvzDQe8x

A cada prompt: ler o documento, fazer só a próxima etapa com tarefas abertas, rodar as verificações, marcar as tarefas no documento e entregar com um roteiro de teste para o Ícaro. Atualizar `ETAPA_ATUAL` em `src/config.ts`.

## Convenções

- Código, nomes e comentários em português.
- Cores, fontes e medidas só de `src/ui/tema.ts` (tema planta técnica, só modo escuro).
- Telas em `src/app/`; o resto fora de `src/app/`.
- Lógica pura (motor, gerador de frases) sem dependência de tela, com testes em `__tests__/`.
- Tudo precisa funcionar no Expo Go: nada de biblioteca com código nativo fora do Expo Go antes da etapa 10.
- Ao mudar o formato dos dados salvos, subir `VERSAO_ESQUEMA` em `src/store/padrao.ts` e tratar em `migrar`.
- Nunca colocar um `Pressable` (ou `Botao`) dentro de outro: na web vira `<button>` dentro de `<button>` e quebra.

## Verificações antes de entregar

```bash
npx tsc --noEmit
npx jest
EXPO_OFFLINE=1 npx expo lint
EXPO_OFFLINE=1 npx expo export --platform android
```

Também abrir o app em modo de desenvolvimento (`EXPO_OFFLINE=1 npx expo start --web`) e passar por todas as telas com Playwright, olhando os erros do console: alguns erros só aparecem em desenvolvimento.

Ao entregar, enviar para o GitHub e mandar também um zip do projeto no chat (`git archive --format=zip --prefix=BIMEC/ -o BIMEC.zip HEAD`).

Nas sessões na nuvem, `npx expo install` precisa de `EXPO_OFFLINE=1` (a API do Expo é bloqueada pela rede).
