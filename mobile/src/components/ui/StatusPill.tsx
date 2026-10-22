import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from './theme';

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  const { colors, typography } = useTheme();
  const warning = tone === 'warn';
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.pill,
        {
          backgroundColor: warning ? colors.surface : colors.soft,
          borderColor: warning ? colors.accent : 'transparent',
        },
      ]}
    >
      {tone === 'good' && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
      <Text style={[typography.status, { color: colors.ink }]}>{children}</Text>
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
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 99,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
