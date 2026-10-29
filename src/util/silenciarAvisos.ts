/**
 * No Expo Go, o expo-notifications avisa que notificação push (vinda de servidor)
 * não funciona. O BIMEC só usa notificação local, então o aviso não se aplica.
 * Este arquivo precisa ser o primeiro import do app.
 */
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['expo-notifications']);
