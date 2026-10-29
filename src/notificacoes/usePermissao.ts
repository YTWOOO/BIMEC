import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { lerPermissao, pedirPermissao, type EstadoPermissao } from './permissao';
import { sincronizarPalavraDoDia } from './sincronizar';

/** Estado da permissão de notificação, relido sempre que o app volta para a frente. */
export function usePermissao() {
  const [estado, setEstado] = useState<EstadoPermissao | 'carregando'>(
    Platform.OS === 'android' ? 'carregando' : 'indisponivel',
  );

  const reler = useCallback(() => {
    lerPermissao()
      .then(setEstado)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let ativo = true;
    const atualizar = () => {
      lerPermissao()
        .then((e) => {
          if (ativo) setEstado(e);
        })
        .catch(() => {});
    };
    atualizar();
    const assinatura = AppState.addEventListener('change', (e) => {
      if (e === 'active') atualizar();
    });
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);

  /** Pede a permissão; se o Android não deixa mais pedir, abre as configurações do app. */
  const pedir = useCallback(async () => {
    try {
      if (estado === 'negada') {
        await Linking.openSettings();
        return;
      }
      const novo = await pedirPermissao();
      setEstado(novo);
      if (novo === 'concedida') await sincronizarPalavraDoDia(true);
    } catch (erro) {
      console.warn('[BIMEC] Não deu para pedir a permissão de notificação.', erro);
      lerPermissao()
        .then(setEstado)
        .catch(() => {});
    }
  }, [estado]);

  return { estado, pedir, reler };
}
