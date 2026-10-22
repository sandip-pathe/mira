import { Alert } from 'react-native';
import { router } from 'expo-router';
import { emitUrgentHelp } from './demoEvents';

/** The existing support choices, shared by Journal's home and editor. */
export function showHelpOptions() {
  Alert.alert('Help', 'Choose a support route or urgent help.', [
    { text: 'Support route', onPress: () => Alert.alert(
      'Support route',
      'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.',
    ) },
    { text: 'Urgent help now', onPress: () => { emitUrgentHelp(); router.push('/(tabs)/index'); } },
    { text: 'Close', style: 'cancel' },
  ]);
}
