import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export const colors = {
  canvas: '#F6F3EC', surface: '#FFFEFB', ink: '#242B25', muted: '#536257', accent: '#3F6852',
  accentSoft: '#E8EFE8', line: '#D6D8CF', danger: '#9A3D35', white: '#FFFFFF', quiet: '#F0EEE7',
};

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' }) {
  return <View style={[styles.pill, tone === 'good' && styles.goodPill, tone === 'warn' && styles.warnPill]}>
    {tone === 'good' && <View style={styles.dot} />}
    <Text style={styles.pillText}>{children}</Text>
  </View>;
}

export function Surface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function ActionButton({ label, onPress, variant = 'primary', disabled, loading, style, accessibilityLabel }: {
  label: string; onPress: PressableProps['onPress']; variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: !!disabled, busy: !!loading }}
    disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[`${variant}Button`],
      (disabled || loading) && styles.disabled, pressed && !disabled && styles.pressed, style]}>
    {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.white : colors.accent} />
      : <Text style={[styles.buttonText, (variant === 'primary' || variant === 'danger') && styles.inverseText,
        variant === 'quiet' && styles.quietText]}>{label}</Text>}
  </Pressable>;
}

export const ui = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  heading: { fontSize: 21, lineHeight: 28, fontWeight: '600', color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.ink },
  input: { minHeight: 150, padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 16,
    fontSize: 17, lineHeight: 25, color: colors.ink, textAlignVertical: 'top', backgroundColor: colors.surface },
});

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 1.2, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  pill: { minHeight: 30, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 11, borderRadius: 99, backgroundColor: colors.quiet },
  goodPill: { backgroundColor: colors.accentSoft }, warnPill: { backgroundColor: '#F8E9E3' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  pillText: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  surface: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  primaryButton: { backgroundColor: colors.accent }, secondaryButton: { backgroundColor: colors.accentSoft, borderColor: '#CFD9D0', borderWidth: 1 },
  quietButton: { backgroundColor: 'transparent' }, dangerButton: { backgroundColor: colors.danger }, disabled: { opacity: 0.48 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  buttonText: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.accent }, inverseText: { color: colors.white }, quietText: { color: colors.muted },
});
