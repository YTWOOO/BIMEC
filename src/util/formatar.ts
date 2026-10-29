/** 3 → "03" */
export function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** 1 → "1 dia", 3 → "3 dias" */
export function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}
