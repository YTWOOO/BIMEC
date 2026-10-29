import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Hora atual, atualizada a cada minuto e sempre que o app volta para a frente. */
export function useAgora(): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const relogio = setInterval(() => setAgora(new Date()), 60 * 1000);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setAgora(new Date());
    });
    return () => {
      clearInterval(relogio);
      assinatura.remove();
    };
  }, []);
  return agora;
}
