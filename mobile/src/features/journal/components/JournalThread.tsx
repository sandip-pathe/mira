import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useJournal } from '../JournalProvider';

export function JournalThread() {
  const { entries, fontSize, busy, deleteEntry, setSelectedEntry, setExcerpt } = useJournal();
  const { paper, typography } = useTheme();
  const timeline = entries
    .map((entry) => ({ createdAt: entry.created_at * 1000, entry }))
    .sort((left, right) => left.createdAt - right.createdAt);

  return <>
    {timeline.map((item) => {
      const { entry } = item;
      return <View key={`entry-${entry.id}`} style={[styles.exchange, { borderBottomColor: `${paper.ink}25` }]}>
        <Pressable onLongPress={() => !busy && deleteEntry(entry)} delayLongPress={450}
          accessibilityHint="Long press to delete this entry">
          <Text style={[typography.journalWriting, { color: paper.ink, fontSize, lineHeight: fontSize * 1.65 }]}>
            {entry.text}
          </Text>
          <Text style={[typography.support, styles.date, { color: paper.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy}
          onPress={() => { setSelectedEntry(entry); setExcerpt(entry.text.slice(0, 500)); }}
          style={({ pressed }) => [styles.excerpt, { opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[typography.support, { color: paper.primary }]}>Choose an excerpt for Talk</Text>
        </Pressable>
      </View>;
    })}
  </>;
}

const styles = StyleSheet.create({
  exchange: { gap: 10, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  date: { marginTop: 8 },
  excerpt: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center' },
});
