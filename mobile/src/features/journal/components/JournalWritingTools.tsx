import React from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../components/ui';
import { useJournal } from '../JournalProvider';

export function JournalWritingTools({ onStyle, onFinish }: { onStyle: () => void; onFinish: () => void }) {
  const { audio, busy, saving, draft, entries, voiceNotes, saveEntry, saveVoiceNote } = useJournal();
  const { paper, typography } = useTheme();
  const unavailable = busy || audio.recording || !!audio.uri;
  return <View style={styles.container}>
    {audio.recording && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: paper.primary }]}>
      Recording your voice note…
    </Text>}
    {!!audio.uri && <View style={styles.noteActions}>
      <ActionButton appearance="paper" label="Save voice note" disabled={busy} onPress={() => void saveVoiceNote()} />
      <ActionButton appearance="paper" label="Discard" variant="quiet" disabled={busy} onPress={() => audio.discard()} />
    </View>}
    <View style={[styles.tools, { borderTopColor: `${paper.ink}25` }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Page style: color and writing size"
        accessibilityState={{ disabled: busy || audio.recording }} disabled={busy || audio.recording}
        onPress={onStyle} style={({ pressed }) => [styles.tool, { opacity: busy || audio.recording ? 0.4 : pressed ? 0.65 : 1 }]}>
        <MaterialDesignIcons name="palette-outline" size={21} color={paper.primary} />
        <Text style={[typography.support, { color: paper.primary }]}>Page style</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={audio.recording ? 'Stop recording' : 'Record voice note'}
        accessibilityState={{ disabled: busy || !!audio.uri }} disabled={busy || !!audio.uri}
        onPress={() => { Keyboard.dismiss(); void (audio.recording ? audio.stop() : audio.start()); }}
        style={({ pressed }) => [styles.tool, { opacity: busy || audio.uri ? 0.4 : pressed ? 0.65 : 1 }]}>
        <MaterialDesignIcons name={audio.recording ? 'stop' : 'microphone-outline'} size={21} color={paper.primary} />
        <Text style={[typography.support, { color: paper.primary }]}>{audio.recording ? 'Stop recording' : 'Voice note'}</Text>
      </Pressable>
    </View>
    <View style={styles.actions}>
      <ActionButton appearance="paper" label="Save entry" loading={saving}
        disabled={!draft.trim() || unavailable} onPress={() => { Keyboard.dismiss(); void saveEntry(); }} style={styles.action} />
      <ActionButton appearance="paper" label="Finish session" variant="quiet"
        accessibilityLabel="Finish session. Saves this session as finished."
        disabled={unavailable || (!entries.length && !draft.trim() && !voiceNotes.length)}
        onPress={onFinish} style={styles.action} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 4 },
  tool: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { flexBasis: 130, flexGrow: 1, paddingHorizontal: 12 },
  noteActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
