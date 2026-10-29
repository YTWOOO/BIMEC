import { useId } from 'react';

/**
 * Id único para gradientes e padrões de SVG.
 * Na web, dois SVGs com o mesmo id se atrapalham quando um deles está escondido.
 */
export function useIdSvg(prefixo: string): string {
  return `${prefixo}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
