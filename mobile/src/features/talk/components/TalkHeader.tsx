import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { HelpButton, ThemePickerButton, useTheme } from '../../../components/ui';

const wordmark = require('../../../../assets/brand/mira-signature.png');

export function TalkHeader({ onHelp, onCall, callLabel }: { onHelp: () => void; onCall: () => void; callLabel: string }) {
  const { wordmark: tintColor, colors } = useTheme();
  return (
    <View style={styles.header}>
      <Image source={wordmark} resizeMode="contain" accessibilityLabel="Mira" accessibilityRole="image" style={[styles.brand, { tintColor }]} />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={callLabel} onPress={onCall}
          style={({ pressed }) => [styles.callButton, pressed && { backgroundColor: colors.soft }]}>
          <MaterialDesignIcons name="phone-outline" size={26} color={colors.ink} />
        </Pressable>
        <ThemePickerButton />
        <HelpButton onPress={onHelp} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 68, paddingHorizontal: 22, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 660, width: '100%', alignSelf: 'center' },
  brand: { width: 92, height: 36, marginLeft: -2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  callButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
