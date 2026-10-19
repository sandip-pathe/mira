import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export function ActivityPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap: 12 }, style]}>{children}</View>;
}
