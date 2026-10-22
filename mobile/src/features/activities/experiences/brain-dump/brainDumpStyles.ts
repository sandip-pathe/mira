import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  spacer: { flexGrow: 1 },
  promptToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  prompts: { gap: 8 },
  writing: { minHeight: 270, padding: 16, borderRadius: 16, borderWidth: 1 },
  readback: { minHeight: 150, padding: 16, borderRadius: 16 },
  reflection: { gap: 12, marginTop: 8, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
  note: { gap: 8, paddingTop: 16, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  noteInput: { minHeight: 88, padding: 12, borderRadius: 12, borderWidth: 1 },
  instruction: { minHeight: 52, padding: 12, borderRadius: 12, borderWidth: 1 },
});
