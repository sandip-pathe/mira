import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  loading: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  spacer: { flexGrow: 1, minHeight: 12 },
  row: { minHeight: 64, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  draftRow: { minHeight: 80 },
  rowText: { flex: 1, gap: 4 },
  tones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tone: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { minHeight: 160, padding: 14, borderWidth: 1, borderRadius: 16, textAlignVertical: 'top' },
  contextInput: { minHeight: 110 },
  contextToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
