import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function HelpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Help"
      onPress={onPress}
      style={styles.button}
    >
      <View style={styles.mark}>
        <Text style={styles.markText}>?</Text>
      </View>
      <Text style={styles.label}>Help</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
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
  },
  mark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#183A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: '#183A35', fontSize: 13, lineHeight: 17, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#183A35' },
});
