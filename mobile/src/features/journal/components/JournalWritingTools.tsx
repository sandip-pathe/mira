import React from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../components/ui';
import { useJournal } from '../JournalProvider';

export function JournalWritingTools({ onStyle, onSave }: { onStyle: () => void; onSave: () => void }) {
  const { busy, saving, currentSaved, draft, entries } = useJournal();
  const { paper } = useTheme();
  return <View style={styles.tools}>
    <Pressable accessibilityRole="button" accessibilityLabel="Page style: color and writing size"
      accessibilityState={{ disabled: busy }} disabled={busy}
      onPress={onStyle} style={({ pressed }) => [styles.tool, { opacity: busy ? 0.4 : pressed ? 0.65 : 1 }]}>
      <MaterialDesignIcons name="palette-outline" size={21} color={paper.primary} />
    </Pressable>
    <ActionButton appearance="paper" label="Save" loading={saving}
      accessibilityLabel="Save journal and return"
      disabled={busy || currentSaved || (!entries.length && !draft.trim())}
      onPress={() => { Keyboard.dismiss(); onSave(); }} style={styles.action} />
  </View>;
}

const styles = StyleSheet.create({
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8, alignSelf: 'center', width: '100%', maxWidth: 660 },
  tool: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  action: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 4, paddingVertical: 10 },
});
