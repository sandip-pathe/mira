import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, StatusPill, Surface, useTheme } from '../../../components/ui';
import { JournalEntry, MemoryItem } from '../types';

export function MemorySections({
  selectedEntry,
  excerpt,
  setExcerpt,
  memories,
  busy,
  onSaveExcerpt,
  onCancel,
  onAction,
  onPaper = false,
  showSavedContext = true,
}: {
  selectedEntry?: JournalEntry;
  excerpt: string;
  setExcerpt: (value: string) => void;
  memories: MemoryItem[];
  busy: boolean;
  onSaveExcerpt: () => void;
  onCancel: () => void;
  onAction: (id: string, action: 'approve' | 'revoke' | 'delete') => void;
  onPaper?: boolean;
  showSavedContext?: boolean;
}) {
  const { colors, paper, typography } = useTheme();
  return (
    <>
      {selectedEntry && (
        <Surface style={{ gap: 10 }}>
          <Eyebrow>SHARE WITH TALK</Eyebrow>
          <Text style={[typography.sheetTitle, { color: colors.ink }]}>Review this excerpt</Text>
          <Text style={[typography.support, { color: colors.muted }]}>Talk can use this only after you approve it.</Text>
          <TextInput
            accessibilityLabel="Editable memory excerpt"
            multiline
            maxLength={500}
            value={excerpt}
            onChangeText={setExcerpt}
            cursorColor={paper.ink}
            selectionColor={paper.primary}
            style={[typography.body, { minHeight: 90, padding: 12, textAlignVertical: 'top', borderRadius: 12,
              backgroundColor: paper.background, color: paper.ink, borderWidth: 1, borderColor: colors.line }]}
          />
          <ActionButton
            label="Save for review"
            disabled={busy || !excerpt.trim()}
            onPress={onSaveExcerpt}
          />
          <ActionButton label="Cancel" variant="quiet" onPress={onCancel} />
        </Surface>
      )}
      {showSavedContext && !!memories.length && (
        <View style={{ gap: 12 }}>
          <Text style={[typography.eyebrow, { color: onPaper ? paper.muted : colors.muted }]}>MIRA’S CONTEXT</Text>
          {memories.map((item) => (
            <Surface key={item.id} style={{ gap: 9 }}>
              <Text style={[typography.body, { color: colors.ink }]}>{item.excerpt}</Text>
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
                  disabled={busy}
                  onPress={() => onAction(item.id, 'approve')}
                />
              )}
              {item.approved === 1 && (
                <ActionButton
                  label="Revoke future use"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => onAction(item.id, 'revoke')}
                />
              )}
              <ActionButton
                label="Delete context"
                variant="quiet"
                disabled={busy}
                onPress={() => onAction(item.id, 'delete')}
              />
            </Surface>
          ))}
        </View>
      )}
    </>
  );
}
