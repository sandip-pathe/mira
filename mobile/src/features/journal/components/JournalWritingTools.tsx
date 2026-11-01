import React from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../components/ui';
import { themes } from '../../../components/ui/themeTokens';
import { useJournal } from '../JournalProvider';

export function JournalWritingTools({ onStyle, onSave }: { onStyle: () => void; onSave: () => void }) {
  const { busy, saving, currentSaved, draft, entries } = useJournal();
  const { paper, typography } = useTheme();
  const canSave = !busy && !currentSaved && (!!entries.length || !!draft.trim());
  const paperColors = themes['warm-light'].colors;
  const saveForeground = canSave ? paper.primary : paperColors.disabledInk;
  return <View style={styles.tools}>
    <Pressable accessibilityRole="button" accessibilityLabel="Page style: color and writing size"
      accessibilityState={{ disabled: busy }} disabled={busy}
      onPress={onStyle} style={({ pressed }) => [styles.tool, { opacity: busy ? 0.4 : pressed ? 0.65 : 1 }]}>
      <MaterialDesignIcons name="palette-outline" size={21} color={paper.primary} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Save journal and return"
      accessibilityState={{ disabled: !canSave || saving, busy: saving }}
      disabled={!canSave || saving}
      onPress={() => { Keyboard.dismiss(); onSave(); }}
      style={({ pressed }) => [styles.saveButton, {
        borderColor: canSave ? paper.primary : paperColors.disabledInk,
        backgroundColor: 'transparent',
        opacity: pressed && canSave ? 0.82 : 1,
      }]}>
      {saving ? <ActivityIndicator color={saveForeground} /> : <>
        <MaterialDesignIcons name="content-save-outline" size={20} color={saveForeground} />
        <Text style={[typography.button, styles.saveLabel, { color: saveForeground }]}>Save</Text>
      </>}
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  tools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8, alignSelf: 'center', width: '100%', maxWidth: 660 },
  tool: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  saveButton: { width: '50%', minWidth: 0, minHeight: 52, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  saveLabel: { textAlign: 'center' },
});
