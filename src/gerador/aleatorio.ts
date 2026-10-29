/** Gerador de números aleatórios com semente (mulberry32): mesma semente, mesmas frases. */
export type Aleatorio = () => number;

export function criarAleatorio(semente: number): Aleatorio {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sortear<T>(lista: readonly T[], aleatorio: Aleatorio): T {
  return lista[Math.floor(aleatorio() * lista.length)];
}

/** Sorteio em que os itens de `preferidos` têm peso 3. */
export function sortearComPeso<T extends { id: string }>(
  lista: readonly T[],
  aleatorio: Aleatorio,
  preferidos?: ReadonlySet<string>,
): T {
  if (!preferidos || preferidos.size === 0) return sortear(lista, aleatorio);
  const pesos = lista.map((item) => (preferidos.has(item.id) ? 3 : 1));
  const total = pesos.reduce((a, b) => a + b, 0);
  let r = aleatorio() * total;
  for (let i = 0; i < lista.length; i++) {
    r -= pesos[i];
    if (r < 0) return lista[i];
  }
  return lista[lista.length - 1];
}

export function embaralhar<T>(lista: readonly T[], aleatorio: Aleatorio): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
