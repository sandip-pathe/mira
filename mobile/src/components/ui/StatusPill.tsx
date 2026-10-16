import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './tokens';

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.pill, tone === 'good' && styles.goodPill, tone === 'warn' && styles.warnPill]}
    >
      {tone === 'good' && <View style={styles.dot} />}
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 30,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 99,
    backgroundColor: colors.quiet,
  },
  goodPill: { backgroundColor: colors.accentSoft },
  warnPill: { backgroundColor: '#F8E9E3' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  pillText: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
