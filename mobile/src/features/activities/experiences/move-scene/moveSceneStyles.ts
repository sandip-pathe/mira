import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  loading: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  spacer: { flexGrow: 1, minHeight: 10 },
  choice: { minHeight: 72, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  choiceText: { flex: 1, gap: 4 },
  input: { minHeight: 80, padding: 14, borderRadius: 16, borderWidth: 1, textAlignVertical: 'top' },
  preference: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
