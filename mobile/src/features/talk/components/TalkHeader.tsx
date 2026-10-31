import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { HelpButton, ThemePickerButton, useTheme } from '../../../components/ui';

const wordmark = require('../../../../assets/brand/mira-signature.png');

export function TalkHeader({ onHelp }: { onHelp: () => void }) {
  const { wordmark: tintColor } = useTheme();
  return (
    <View style={styles.header}>
      <Image source={wordmark} resizeMode="contain" accessibilityLabel="Mira" accessibilityRole="image" style={[styles.brand, { tintColor }]} />
      <View style={styles.actions}>
        <HelpButton onPress={onHelp} />
        <ThemePickerButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 68, paddingHorizontal: 22, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { width: 92, height: 42, marginLeft: -2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
