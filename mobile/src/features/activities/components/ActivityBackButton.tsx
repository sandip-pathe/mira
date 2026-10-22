import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../components/ui';

export function ActivityBackButton({ label = 'Back', onPress }: { label?: string; onPress: () => void }) {
  const { colors, typography } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label === 'Back' ? 'Back' : `Back to ${label}`}
    onPress={onPress} style={({ pressed }) => [styles.button, { opacity: pressed ? 0.65 : 1 }]}>
    <MaterialDesignIcons name="arrow-left" size={20} color={colors.primary} />
    <Text style={[typography.recentTitle, { color: colors.primary, flexShrink: 1 }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 48, minWidth: 48, flexShrink: 1, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingRight: 12 },
});
