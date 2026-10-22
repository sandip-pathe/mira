import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../components/ui';

/** Background and flex frame only; the experience owns its spacing and scrolling. */
export function ActivityFrame({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.canvas }, style]}>{children}</View>;
}
