import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

// O Expo Go recusa criar canais: setNotificationChannelAsync sempre rejeita.
jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(() =>
    Promise.reject(new Error("Call to function 'ExpoNotificationChannelManager.setNotificationChannelAsync' has been rejected.")),
  ),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));

import { canaisCriados, configurarCanais } from '@/notificacoes/canais';

describe('canais no Expo Go', () => {
  const original = Platform.OS;
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
  });

  it('não lança erro quando o Android recusa os canais, e avisa que não criou', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await expect(configurarCanais()).resolves.toBe(false);
    expect(canaisCriados()).toBe(false);
    await expect(configurarCanais()).resolves.toBe(false);
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
