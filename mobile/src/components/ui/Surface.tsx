import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from './theme';

export function Surface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.line }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
});
