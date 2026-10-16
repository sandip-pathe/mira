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
import { colors } from './tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'quiet' | 'danger';
type Props = {
  label: string;
  onPress: PressableProps['onPress'];
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`${variant}Button`],
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.accent}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            (variant === 'primary' || variant === 'danger') && styles.inverseText,
            variant === 'quiet' && styles.quietText,
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
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    opacity: 0.9,
  },
  primaryButton: { backgroundColor: colors.accent },
  secondaryButton: { backgroundColor: colors.accentSoft, borderColor: '#CFD9D0', borderWidth: 1 },
  outlineButton: { backgroundColor: 'transparent', borderColor: '#9BBBA6', borderWidth: 1.5 },
  quietButton: { backgroundColor: 'transparent' },
  dangerButton: { backgroundColor: colors.danger },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  buttonText: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.accent },
  inverseText: { color: colors.white },
  quietText: { color: colors.muted },
});
