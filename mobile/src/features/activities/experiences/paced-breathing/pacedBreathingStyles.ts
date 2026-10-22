import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  spacer: { flexGrow: 1, minHeight: 10 },
  sectionHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  centered: { textAlign: 'center' },
  choices: { gap: 2 },
  choice: { minHeight: 64, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  choiceText: { flex: 1, gap: 3 },
  settings: { gap: 10, paddingTop: 4 },
  settingLabel: { minHeight: 44, justifyContent: 'center' },
  cue: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  cueText: { flex: 1, gap: 2 },
  cueSwitch: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexBasis: 130 },
});
