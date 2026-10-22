import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  art: { alignItems: 'center', gap: 8 },
  spacer: { flexGrow: 1, minHeight: 12 },
  loading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingVertical: 20 },
  field: { minHeight: 52, padding: 14, borderRadius: 16, borderWidth: 1 },
  paper: { minHeight: 270, padding: 16, borderRadius: 16, textAlignVertical: 'top' },
  readPaper: { padding: 16, borderRadius: 16 },
  quietRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  rowText: { flexShrink: 1 },
  prompts: { gap: 4 },
  centered: { textAlign: 'center' },
  discard: { minHeight: 48, paddingVertical: 12, justifyContent: 'center' },
  letterRow: { minHeight: 80, paddingVertical: 16, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  savedOpen: { minHeight: 48, gap: 6, paddingVertical: 4 },
  savedActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  savedAction: { flexBasis: 120, flexGrow: 1 },
  takeaway: { gap: 12, paddingTop: 20, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  takeawayField: { minHeight: 88, padding: 12, borderRadius: 12, borderWidth: 1, textAlignVertical: 'top' },
});
