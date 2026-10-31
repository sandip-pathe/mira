import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { callController, isCallLive, useMiraCall } from './callController';
import { useCallDuration } from './useCallDuration';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { BrandArtwork } from '../../components/ui/BrandArtwork';
import { useTheme } from '../../components/ui';
import { callColors as c } from './callAppearance';

export function OngoingCallBar() {
  const call = useMiraCall();
  const { typography } = useTheme();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const duration = useCallDuration(call.connectedAt, call.endedAt);
  if (!isCallLive(call.state) || path === '/call') return null;
  return <View style={[styles.bar, { bottom: 72 + Math.max(12, insets.bottom) + Math.max(0, fontScale - 1) * 24 }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Return to Mira call" onPress={() => router.push('/call')} style={styles.return}>
      <View style={styles.avatar}><BrandArtwork part="companion" size={40} /></View>
      <View style={styles.copy}>
        <Text style={[typography.status, styles.text]}>Mira{call.muted ? ' · Muted' : ''}</Text>
        <Text style={[typography.support, styles.meta]}>{call.held ? 'Paused' : call.state === 'connected' ? duration : call.state === 'reconnecting' ? 'Reconnecting…' : call.state === 'ringing' ? 'Calling…' : 'Connecting…'}</Text>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="End Mira call" onPress={callController.end} style={styles.end}>
      <MaterialDesignIcons name="phone-hangup" size={24} color={c.ink} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 16, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, flexDirection: 'row', elevation: 8, padding: 6, gap: 8 },
  return: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 12 },
  avatar: { backgroundColor: c.portrait, borderRadius: 22 },
  copy: { flex: 1 },
  text: { color: c.ink },
  meta: { color: c.muted, fontVariant: ['tabular-nums'] },
  end: { width: 48, minHeight: 48, backgroundColor: c.red, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
