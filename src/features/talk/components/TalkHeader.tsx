import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function TalkHeader({
  ready,
  error,
  status,
  onHelp,
}: {
  ready: boolean;
  error: string;
  status: string;
  onHelp: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>Mira</Text>
        <View style={styles.statusLine}>
          <View style={[styles.statusDot, ready && styles.readyDot, !!error && styles.errorDot]} />
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Help"
        style={styles.helpButton}
        onPress={onHelp}
      >
        <View style={styles.helpMark}>
          <Text style={styles.helpMarkText}>?</Text>
        </View>
        <Text style={styles.helpText}>Help</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandBlock: { gap: 2 },
  brand: { fontSize: 36, lineHeight: 42, fontWeight: '700', color: '#15332F', letterSpacing: -1.2 },
  statusLine: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#A6B0AB' },
  readyDot: { backgroundColor: '#39AE70' },
  errorDot: { backgroundColor: '#CA665B' },
  status: { color: '#61736F', fontSize: 15, lineHeight: 22 },
  helpButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DBD4',
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.7)',
    opacity: 0.78,
  },
  helpMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#183A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpMarkText: { color: '#183A35', fontSize: 13, lineHeight: 17, fontWeight: '700' },
  helpText: { fontSize: 14, fontWeight: '600', color: '#183A35' },
});
