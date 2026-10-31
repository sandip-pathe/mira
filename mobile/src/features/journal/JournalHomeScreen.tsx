import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { ActionButton, HelpButton, ThemePickerButton, useTheme } from '../../components/ui';
import { showHelpOptions } from '../../shared/showHelpOptions';
import { BrandArtwork } from '../../components/ui/BrandArtwork';
import { FeedbackSection } from './components/FeedbackSection';
import { MemorySections } from './components/MemorySections';
import { styles } from './components/journalStyles';
import { useJournal } from './JournalProvider';
import { firebaseAuth } from '../../shared/firebase';

export default function JournalHomeScreen() {
  const {
    journalSessions,
    memories,
    feedback,
    busy,
    loading,
    status,
    error,
    memoryAction,
    feedbackAction,
    startJournal,
    openJournal,
    refreshJournalSessions,
    deleteJournal,
  } = useJournal();
  const { colors, typography, isDark } = useTheme();

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
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.canvas }]}
    >
      <Stack.Screen options={{ headerShown: false, statusBarStyle: isDark ? 'light' : 'dark' }} />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
          Journal
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => void signOut(firebaseAuth)}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={[typography.support, { color: colors.primary }]}>Sign out</Text>
          </Pressable>
          <ThemePickerButton />
          <HelpButton onPress={showHelpOptions} />
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.homeContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.homeArt}>
          <BrandArtwork part="journal" size={135} />
        </View>
        <Text style={[typography.journalHomeTitle, { color: colors.ink }]}>
          A new page, whenever you want.
        </Text>
        <ActionButton
          label="+  New entry"
          accessibilityLabel="New journal entry"
          disabled={busy || loading}
          onPress={startNewEntry}
        />
        {!!status && (
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.support, { color: error ? colors.error : colors.muted }]}
          >
            {status}
          </Text>
        )}
        <Text
          accessibilityRole="header"
          style={[typography.groupHeading, styles.recentHeading, { color: colors.ink }]}
        >
          Recent sessions
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : journalSessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[typography.body, { color: colors.ink }]}>
              {error ? 'Recent sessions could not be loaded.' : 'No entries yet.'}
            </Text>
            <Text style={[typography.support, { color: colors.muted }]}>
              {error ? 'Try opening Journal again.' : 'You can start with a few words.'}
            </Text>
          </View>
        ) : (
          journalSessions.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              onPress={() => openExistingEntry(item.id)}
              onLongPress={() => !busy && deleteJournal(item.id)}
              accessibilityHint="Long press to delete this session"
              style={({ pressed }) => [
                styles.recentRow,
                { borderBottomColor: colors.line, opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text numberOfLines={2} style={[typography.recentTitle, { color: colors.ink }]}>
                {item.preview || item.title}
              </Text>
              <Text style={[typography.recentMeta, { color: colors.muted }]}>
                {item.saved ? 'Saved' : 'Draft'} · {item.entry_count}{' '}
                {item.entry_count === 1 ? 'entry' : 'entries'} ·{' '}
                {new Date(item.updated_at * 1000).toLocaleDateString()}
              </Text>
            </Pressable>
          ))
        )}
        <MemorySections
          selectedEntry={undefined}
          excerpt=""
          setExcerpt={() => {}}
          memories={memories}
          busy={busy}
          onSaveExcerpt={() => {}}
          onCancel={() => {}}
          onAction={(id, action) => void memoryAction(id, action)}
        />
        <FeedbackSection
          items={feedback}
          busy={busy}
          onAction={(id, action, enabled) => void feedbackAction(id, action, enabled)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
