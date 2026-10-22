import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../../components/ui';

export function NoticeNameChip({ label, selected, removable = false, onPress }: {
  label: string; selected: boolean; removable?: boolean; onPress: () => void;
}) {
  const { colors, typography } = useTheme();
  return <Pressable accessibilityRole={removable ? 'button' : 'checkbox'}
    accessibilityLabel={removable ? `Remove ${label}` : label} accessibilityState={removable ? undefined : { checked: selected }}
    onPress={onPress} style={({ pressed }) => [styles.chip, {
      backgroundColor: selected ? colors.soft : colors.surface, borderColor: selected ? colors.primary : colors.line,
      opacity: pressed ? 0.65 : 1,
    }]}>
    <Text style={[typography.support, styles.label, { color: selected ? colors.primary : colors.ink }]}>{label}</Text>
    {(removable || selected) && <MaterialDesignIcons name={removable ? 'close' : 'check'} size={18} color={colors.primary} />}
  </Pressable>;
}

const styles = StyleSheet.create({
  chip: { minHeight: 48, maxWidth: '100%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flexShrink: 1 },
});
