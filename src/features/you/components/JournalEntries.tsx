import React from 'react';
import { Text, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, ui } from '../../../components/ui';
import { JournalEntry } from '../types';

export function JournalEntries({
  entries,
  busy,
  recording,
  onChoose,
  onDelete,
}: {
  entries: JournalEntry[];
  busy: boolean;
  recording: boolean;
  onChoose: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  if (!entries.length) return null;
  return (
    <View style={{ gap: 12 }}>
      <Eyebrow>YOUR ENTRIES</Eyebrow>
      {entries.map((entry) => (
        <Surface key={entry.id} style={{ gap: 12 }}>
          <Text style={ui.body}>{entry.text}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ActionButton
              label="Choose excerpt for Talk"
              variant="secondary"
              onPress={() => onChoose(entry)}
              style={{ flex: 1 }}
            />
            <ActionButton
              label="Delete"
              variant="quiet"
              disabled={busy || recording}
              onPress={() => onDelete(entry.id)}
            />
          </View>
        </Surface>
      ))}
    </View>
  );
}
