import { StyleSheet } from 'react-native';

export const colors = {
  canvas: '#F2F3EC',
  surface: '#FBFCF8',
  ink: '#173A34',
  muted: '#6D7D79',
  accent: '#3C805E',
  accentSoft: '#E8F0E7',
  line: '#D9DED7',
  danger: '#C7665B',
  white: '#FFFFFF',
  quiet: '#F2F3EC',
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
