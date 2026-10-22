import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  loading: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  spacer: { flexGrow: 1, minHeight: 10 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  row: { minHeight: 72, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 4 },
  input: { minHeight: 52, padding: 14, borderRadius: 16, borderWidth: 1 },
  progress: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4 },
  transport: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  transportButton: { flexGrow: 1, flexBasis: 120 },
  preference: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
