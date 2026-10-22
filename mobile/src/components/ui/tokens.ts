import { StyleSheet } from 'react-native';

// Compatibility tokens for screens awaiting migration. New/converted views use
// useTheme(): its primary is green, while its accent is the approved peach.
export const colors = {
  canvas: '#F4F1E8',
  surface: '#FBF8F0',
  ink: '#173A34',
  muted: '#6D7D79',
  accent: '#3C805E',
  accentSoft: '#E9EFE5',
  line: '#DDDCCF',
  danger: '#C7665B',
  white: '#FFFFFF',
  quiet: '#EEECE2',
};

export const ui = StyleSheet.create({
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  heading: { fontSize: 21, lineHeight: 28, fontWeight: '600', color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.ink },
  input: {
    minHeight: 150,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
});
