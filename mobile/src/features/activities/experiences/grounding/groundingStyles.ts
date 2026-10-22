import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  spacer: { flexGrow: 1, minHeight: 18 },
  artworkButton: { width: '100%', maxWidth: 430, alignSelf: 'center', borderRadius: 120 },
  centered: { textAlign: 'center' },
  progress: { flexDirection: 'row', gap: 12, justifyContent: 'center', paddingVertical: 4 },
  dot: { width: 17, height: 17, borderRadius: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexBasis: 130 },
  summary: { gap: 9 },
  feedback: { gap: 12, marginTop: 4, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
