import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import type { ContextMatch } from '../conversation';

const labels = { journal: 'FROM YOUR JOURNAL', action: 'SAVED ACTIVITY', feedback: 'SAVED PREFERENCE' };

export function ContextSources({ matches }: { matches: ContextMatch[] }) {
  const { colors, typography } = useTheme();
  return <>
    {matches.map(item => <View key={item.id} style={[styles.quote, { borderLeftColor: colors.primary, backgroundColor: colors.soft }]}>
      <Text style={[typography.eyebrow, { color: colors.muted }]}>{labels[item.source_type]}</Text>
      <Text style={[typography.body, { color: colors.ink }]}>{item.excerpt}</Text>
    </View>)}
  </>;
}

const styles = StyleSheet.create({
  quote: { padding: 14, borderLeftWidth: 3, borderRadius: 12, gap: 8 },
});
