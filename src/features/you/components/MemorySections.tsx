import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, StatusPill, Surface, ui } from '../../../components/ui';
import { JournalEntry, MemoryItem } from '../types';

export function MemorySections({
  selectedEntry,
  excerpt,
  setExcerpt,
  memories,
  busy,
  recording,
  onSaveExcerpt,
  onCancel,
  onAction,
}: {
  selectedEntry?: JournalEntry;
  excerpt: string;
  setExcerpt: (value: string) => void;
  memories: MemoryItem[];
  busy: boolean;
  recording: boolean;
  onSaveExcerpt: () => void;
  onCancel: () => void;
  onAction: (id: string, action: 'approve' | 'revoke' | 'delete') => void;
}) {
  return (
    <>
      {selectedEntry && (
        <Surface style={{ gap: 10 }}>
          <Eyebrow>SHARE WITH TALK</Eyebrow>
          <Text style={ui.heading}>Review this excerpt</Text>
          <Text style={ui.muted}>It stays private until you approve it.</Text>
          <TextInput
            accessibilityLabel="Editable memory excerpt"
            multiline
            maxLength={500}
            value={excerpt}
            onChangeText={setExcerpt}
            style={[ui.input, { minHeight: 90 }]}
          />
          <ActionButton
            label="Save pending excerpt"
            disabled={busy || recording || !excerpt.trim()}
            onPress={onSaveExcerpt}
          />
          <ActionButton label="Cancel" variant="quiet" onPress={onCancel} />
        </Surface>
      )}
      {!!memories.length && (
        <View style={{ gap: 12 }}>
          <Eyebrow>MIRA’S CONTEXT</Eyebrow>
          {memories.map((item) => (
            <Surface key={item.id} style={{ gap: 9 }}>
              <Text style={ui.body}>{item.excerpt}</Text>
              <StatusPill tone={item.approved && !item.revoked ? 'good' : 'neutral'}>
                {item.revoked
                  ? 'Revoked'
                  : item.approved
                    ? 'Approved for Talk'
                    : 'Pending approval'}
              </StatusPill>
              {!item.approved && !item.revoked && (
                <ActionButton
                  label="Approve for Talk"
                  disabled={busy || recording}
                  onPress={() => onAction(item.id, 'approve')}
                />
              )}
              {item.approved === 1 && (
                <ActionButton
                  label="Revoke future use"
                  variant="secondary"
                  disabled={busy || recording}
                  onPress={() => onAction(item.id, 'revoke')}
                />
              )}
              <ActionButton
                label="Delete context"
                variant="quiet"
                disabled={busy || recording}
                onPress={() => onAction(item.id, 'delete')}
              />
            </Surface>
          ))}
        </View>
      )}
    </>
  );
}
