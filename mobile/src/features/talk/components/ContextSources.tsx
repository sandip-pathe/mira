import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ContextMatch } from '../conversation';

const labels = {
  journal: 'FROM YOUR JOURNAL',
  action: 'SAVED ACTIVITY',
  feedback: 'SAVED PREFERENCE',
};

export function ContextSources({ matches }: { matches: ContextMatch[] }) {
  return (
    <>
      {matches.map((item) => (
        <View key={item.id} style={styles.quote}>
          <Text style={styles.label}>{labels[item.source_type]}</Text>
          <Text style={styles.body}>{item.excerpt}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  quote: {
    padding: 13,
    borderLeftWidth: 3,
    borderLeftColor: '#3D805D',
    backgroundColor: '#FBFCF8',
    gap: 7,
    borderRadius: 9,
  },
  label: { fontSize: 10, color: '#697C75', fontWeight: '700', letterSpacing: 0.8 },
  body: { fontSize: 15, lineHeight: 22, color: '#263F3A' },
});
