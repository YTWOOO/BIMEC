/** Correção das respostas: diz se acertou e explica o erro. */
import { SENTIDO_POSICAO } from './preparar';
import type { Correcao, Pergunta, Resposta } from './tipos';

function igual(a: string | null, b: string): boolean {
  return a !== null && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** A resposta já dá para conferir (todas as lacunas preenchidas, uma opção escolhida…). */
export function respostaCompleta(p: Pergunta, r: Resposta | null): boolean {
  if (!r || r.tipo !== p.tipo) return false;
  if (r.tipo === 'completar') return r.valores.length === (p.tipo === 'completar' ? p.lacunas.length : 0) && r.valores.every((v) => v !== null);
  return true;
}

export function avaliar(p: Pergunta, r: Resposta): Correcao {
  if (p.tipo === 'card') return { acertou: true, explicacoes: [] };

  if (p.tipo === 'escolha' && r.tipo === 'escolha') {
    const acertou = r.opcao === p.certa;
    const escolhida = p.opcoes.find((o) => o.id === r.opcao);
    const certa = p.opcoes.find((o) => o.id === p.certa);
    return {
      acertou,
      explicacoes: acertou ? [] : [escolhida?.explicacao ?? `A resposta certa é "${certa?.texto ?? ''}".`],
    };
  }

  if (p.tipo === 'pares' && r.tipo === 'pares') {
    const alvo = p.pares.find((par) => par.id === p.alvo);
    const acertou = r.errosNoAlvo === 0;
    return { acertou, explicacoes: acertou || !alvo ? [] : [`"${alvo.en}" é "${alvo.pt}".`] };
  }

  if (p.tipo === 'onde' && r.tipo === 'onde') {
    const acertou = r.posicao === p.certa;
    return {
      acertou,
      explicacoes: acertou
        ? []
        : [
            `"${p.certa}" é "${SENTIDO_POSICAO[p.certa]}". O desenho que você escolheu mostra "${r.posicao}" (${SENTIDO_POSICAO[r.posicao]}).`,
          ],
    };
  }

  if (p.tipo === 'completar' && r.tipo === 'completar') {
    const explicacoes: string[] = [];
    p.lacunas.forEach((l, i) => {
      const valor = r.valores[i] ?? null;
      if (igual(valor, l.certa)) return;
      const chave = valor?.trim().toLowerCase() ?? '';
      explicacoes.push(l.explicacoes[chave] ?? `No espaço ${i + 1} vai "${l.certa}".`);
    });
    return { acertou: explicacoes.length === 0, explicacoes };
  }

  return { acertou: false, explicacoes: ['Resposta em formato errado.'] };
}
