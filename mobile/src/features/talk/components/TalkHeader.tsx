import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HelpButton } from '../../../components/ui';

export function TalkHeader({ onHelp }: { onHelp: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>Mira</Text>
      </View>
      <HelpButton onPress={onHelp} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandBlock: { gap: 2 },
  brand: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '700',
    color: '#0474f3',
    letterSpacing: -1.2,
  },
});
