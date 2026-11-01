import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from './theme';

export function HelpButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Help"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.soft }]}
    >
      <MaterialDesignIcons name="help-circle-outline" size={26} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});
