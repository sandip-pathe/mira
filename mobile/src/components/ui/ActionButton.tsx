import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from './theme';
import { themes } from './themeTokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'quiet' | 'danger';
type Props = {
  label: string;
  onPress: PressableProps['onPress'];
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  appearance?: 'app' | 'paper';
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  accessibilityLabel,
  appearance = 'app',
}: Props) {
  const theme = useTheme();
  const { typography } = theme;
  const colors = appearance === 'paper' ? themes['warm-light'].colors : theme.colors;
  const unavailable = !!disabled || !!loading;
  const filled = variant === 'primary' || variant === 'danger';
  const backgroundColor = variant === 'primary'
    ? colors.primary
    : variant === 'danger'
      ? colors.error
      : variant === 'secondary' ? colors.soft : 'transparent';
  const foreground = unavailable ? colors.disabledInk : filled ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: unavailable, busy: !!loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
        unavailable && { backgroundColor: colors.disabled, borderColor: colors.disabled },
        pressed && !unavailable && {
          backgroundColor: variant === 'primary' ? colors.pressed : filled ? colors.error : colors.soft,
          opacity: variant === 'danger' ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text
          style={[
            typography.button,
            styles.buttonText,
            { color: foreground },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  buttonText: { textAlign: 'center' },
});
