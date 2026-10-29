import * as Speech from 'expo-speech';

/** Fala um texto em inglês. `devagar` usa velocidade reduzida. */
export function falar(texto: string, devagar = false): void {
  Speech.stop();
  Speech.speak(texto, { language: 'en-US', rate: devagar ? 0.55 : 0.9 });
}
