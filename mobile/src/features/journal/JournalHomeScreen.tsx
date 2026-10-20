import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ui, colors } from '../../components/ui';
import { FeedbackSection } from './components/FeedbackSection';
import { MemorySections } from './components/MemorySections';
import { styles } from './components/journalStyles';
import { useJournal } from './JournalProvider';

export default function JournalHomeScreen() {
  const journal = useJournal();
  const {
    journalSessions,
    memories,
    feedback,
    busy,
    loading,
    status,
    error,
    background,
    foreground,
    subtle,
    palette,
    memoryAction,
    feedbackAction,
    startJournal,
    openJournal,
    refreshJournalSessions,
    deleteJournal,
  } = journal;

  useFocusEffect(
    React.useCallback(() => {
      void refreshJournalSessions().catch(() => {});
    }, [refreshJournalSessions]),
  );

  function startNewEntry() {
    startJournal();
    router.push('/you/entry');
  }

  function openExistingEntry(id: string) {
    void openJournal(id).then((opened) => {
      if (opened) router.push('/you/entry');
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <Stack.Screen options={{ headerShown: false, statusBarStyle: 'dark' }} />
      <View style={[styles.page, { backgroundColor: background }]}>
        <View style={styles.header}>
          <Text style={[styles.date, { color: foreground }]}>Journal</Text>
        </View>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={foreground} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.thread}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 16 }}>
              <View style={{ gap: 6 }}>
                <Text style={[styles.homeTitle, { color: foreground }]}>
                  A space to put it into words.
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={startNewEntry}>
                <View style={[styles.newCard, { backgroundColor: palette.dark }]}>
                  <MaterialDesignIcons name="plus" size={25} color="#FFFFFF" />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                      New entry
                    </Text>
                    <Text style={{ color: '#FFFFFFCC', fontSize: 13 }}>
                      Choose a prompt and begin writing
                    </Text>
                  </View>
                  <MaterialDesignIcons name="chevron-right" size={24} color="#FFFFFF" />
                </View>
              </Pressable>
              <Text style={[ui.heading, { color: foreground, marginTop: 4 }]}>Recent sessions</Text>
              {journalSessions.length === 0 ? (
                <View style={[styles.emptyCard, { borderColor: `${foreground}30` }]}>
                  <Text style={{ color: foreground, fontWeight: '600' }}>No sessions yet</Text>
                  <Text style={{ color: subtle, lineHeight: 20 }}>
                    Your saved writing and drafts appear here on this device.
                  </Text>
                </View>
              ) : (
                journalSessions.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => openExistingEntry(item.id)}
                    onLongPress={() => !busy && deleteJournal(item.id)}
                    accessibilityHint="Long press to delete this session"
                  >
                    <View
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: `${foreground}08`,
                          borderColor: `${foreground}20`,
                        },
                      ]}
                    >
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}
                      >
                        <Text
                          style={{ color: foreground, fontSize: 16, fontWeight: '700', flex: 1 }}
                        >
                          {item.title}
                        </Text>
                        <Text style={{ color: subtle, fontSize: 12 }}>
                          {item.saved ? 'SAVED' : 'DRAFT'}
                        </Text>
                      </View>
                      <Text numberOfLines={2} style={{ color: subtle, lineHeight: 21 }}>
                        {item.preview || item.initial_prompt}
                      </Text>
                      <Text style={{ color: subtle, fontSize: 12 }}>
                        {item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'} ·{' '}
                        {new Date(item.updated_at * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
              <MemorySections
                selectedEntry={undefined}
                excerpt=""
                setExcerpt={() => {}}
                memories={memories}
                busy={busy}
                recording={false}
                onSaveExcerpt={() => {}}
                onCancel={() => {}}
                onAction={(id, action) => void memoryAction(id, action)}
              />
              <FeedbackSection
                items={feedback}
                busy={busy}
                recording={false}
                onAction={(id, action, enabled) => void feedbackAction(id, action, enabled)}
              />
            </View>
          </ScrollView>
        )}
        {!!status && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.status, { color: error ? colors.danger : subtle }]}
          >
            {status}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
