import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  loading: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  spacer: { flexGrow: 1 },
  input: { minHeight: 52, padding: 14, borderRadius: 16, borderWidth: 1 },
  task: { minHeight: 110, textAlignVertical: 'top' },
  firstMove: { minHeight: 90, textAlignVertical: 'top' },
  timer: { textAlign: 'center', fontVariant: ['tabular-nums'], paddingVertical: 12 },
});
