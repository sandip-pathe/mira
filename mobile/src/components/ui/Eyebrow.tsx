import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from './theme';

export function Eyebrow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors, typography } = useTheme();
  return <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.muted }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  eyebrow: {
    textTransform: 'uppercase',
  },
});
