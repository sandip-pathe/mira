import React from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ActionButton } from '../../components/ui';
import { BolnaCall, type CallState } from './BolnaCall';

export default function CallScreen() {
  const [state, setState] = React.useState<CallState>('ended');
  const [error, setError] = React.useState('');
  const [muted, setMuted] = React.useState(false);
  const call = React.useRef<BolnaCall | undefined>(undefined);
  const start = () => {
    if (Platform.OS !== 'android') { setError('Calling is available in the Android app.'); return; }
    call.current?.stop(false);
    setError(''); setMuted(false);
    const next = new BolnaCall((status, message) => { setState(status); setError(message ?? ''); });
    call.current = next;
    void next.start();
  };
  React.useEffect(() => {
    // Step 1 is a foreground audio proof; background lifecycle comes in step 2.
    const subscription = AppState.addEventListener('change', value => {
      if (value !== 'active') call.current?.stop();
    });
    return () => { subscription.remove(); call.current?.stop(false); };
  }, []);
  const live = ['connecting', 'ringing', 'connected'].includes(state);
  const label = { connecting: 'Connecting…', ringing: 'Calling Mira…', connected: 'Connected', ended: 'Mira', failed: 'Call could not connect' }[state];
  return <SafeAreaView style={styles.page}>
    <View style={styles.center}>
      <Text style={styles.title}>Mira</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{label}</Text>
      {!!error && <Text style={styles.status}>{error}</Text>}
      {state === 'connected' && <ActionButton label={muted ? 'Unmute' : 'Mute'} onPress={() => {
        call.current?.mute(!muted); setMuted(!muted);
      }} />}
      {live ? <ActionButton label="End call" onPress={() => call.current?.stop()} />
        : <ActionButton label={state === 'failed' ? 'Retry call' : 'Call Mira'} onPress={start} />}
      <ActionButton label="Return to Talk" variant="quiet" onPress={() => { call.current?.stop(false); router.back(); }} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#251E1B', padding: 28 },
  center: { flex: 1, justifyContent: 'center', gap: 24 },
  title: { fontSize: 40, color: '#FFF2E6', textAlign: 'center' },
  status: { fontSize: 18, color: '#E8CDBB', textAlign: 'center' },
});
