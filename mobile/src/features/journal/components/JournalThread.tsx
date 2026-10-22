import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useJournal } from '../JournalProvider';

export function JournalThread() {
  const { messages, currentSaved, entries, fontSize, busy, deleteEntry, setSelectedEntry, setExcerpt } = useJournal();
  const { paper, typography } = useTheme();
  return <>
    {messages.filter((message) => currentSaved || entries.length > 0 || message.entry_id).map((message) => {
      const entry = entries.find((item) => item.id === message.entry_id);
      return <View key={message.id} style={[styles.exchange, { borderBottomColor: `${paper.ink}25` }]}>
        {message.role === 'assistant' ? (
          <Text style={[typography.body, { color: paper.primary }]}>{message.content}</Text>
        ) : <>
          <Pressable onLongPress={() => !busy && entry && deleteEntry(entry)} delayLongPress={450}
            accessibilityHint="Long press to delete this entry">
            <Text style={[typography.journalWriting, { color: paper.ink, fontSize, lineHeight: fontSize * 1.65 }]}>
              {message.content}
            </Text>
            <Text style={[typography.support, styles.date, { color: paper.muted }]}>
              {new Date(message.created_at * 1000).toLocaleDateString()}
            </Text>
          </Pressable>
          {entry && <Pressable accessibilityRole="button" disabled={busy}
            onPress={() => { setSelectedEntry(entry); setExcerpt(entry.text.slice(0, 500)); }}
            style={({ pressed }) => [styles.excerpt, { opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[typography.support, { color: paper.primary }]}>Choose an excerpt for Talk</Text>
          </Pressable>}
        </>}
      </View>;
    })}
  </>;
}

const styles = StyleSheet.create({
  exchange: { gap: 10, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  date: { marginTop: 8 },
  excerpt: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center' },
});
