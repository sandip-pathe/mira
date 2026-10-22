import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from './theme';

export function HelpButton({ onPress }: { onPress: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Help"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.soft }]}
    >
      <MaterialDesignIcons name="help-circle-outline" size={20} color={colors.ink} />
      <Text style={[typography.button, { color: colors.ink }]}>Help</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});
