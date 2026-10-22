import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, HelpButton, useTheme } from '../../components/ui';
import { showHelpOptions } from '../../shared/showHelpOptions';
import { BrandArtwork } from '../../components/ui/BrandArtwork';
import { FeedbackSection } from './components/FeedbackSection';
import { MemorySections } from './components/MemorySections';
import { ColorPicker, PromptPicker } from './components/JournalPickers';
import { JournalThread } from './components/JournalThread';
import { JournalWritingTools } from './components/JournalWritingTools';
import { VoiceNoteRow } from './components/VoiceNoteRow';
import { styles } from './components/journalStyles';
import { useJournal } from './JournalProvider';

export default function JournalEntryScreen() {
  const journal = useJournal();
  const { colors, paper, typography, isDark } = useTheme();
  const [sheet, setSheet] = React.useState<'prompts' | 'style'>();
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  const closeRef = React.useRef(journal.closeJournal);
  React.useLayoutEffect(() => { closeRef.current = journal.closeJournal; }, [journal.closeJournal]);
  React.useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useFocusEffect(React.useCallback(() => () => {
    setSheet(undefined);
    setKeyboardOpen(false);
    closeRef.current();
  }, []));

  const {
    currentSaved, entries, memories, feedback, selectedEntry, setSelectedEntry, excerpt, setExcerpt,
    voiceNotes, deleteVoiceNote, selectedPrompt, draft, setDraft, palette, setPalette, fontSize, setFontSize,
    loading, status, audio, busy, background, saveCurrentSession, saveExcerpt, memoryAction, feedbackAction,
    choosePrompt, followUpRetry, retryFollowUp, followingUp,
  } = journal;

  async function finishSession() {
    Keyboard.dismiss();
    if (await saveCurrentSession()) router.back();
  }
  function openSheet(next: 'prompts' | 'style') {
    Keyboard.dismiss();
    setSheet(next);
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.canvas }]}>
    <Stack.Screen options={{ headerShown: false, statusBarStyle: isDark ? 'light' : 'dark' }} />
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Journal</Text>
        <HelpButton onPress={showHelpOptions} />
      </View>
      <View style={[styles.page, { backgroundColor: background }]}>
        {loading ? <View style={styles.loading}><ActivityIndicator color={paper.primary} /></View> : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.thread}
            keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
            {!currentSaved && !draft.trim() && !entries.length && !voiceNotes.length && !keyboardOpen && (
              <View style={styles.invitation}>
                <Text style={[typography.journalInvitation, styles.invitationText, { color: paper.ink }]}>Start wherever you want.</Text>
                <BrandArtwork part="journal" size={104} />
              </View>
            )}
            {currentSaved && <View style={styles.readNotice}>
              <Text style={[typography.body, { color: paper.muted }]}>This session is saved. Start a new entry whenever you want.</Text>
              <ActionButton appearance="paper" label="Recent sessions" variant="quiet" style={styles.left}
                onPress={() => router.replace('/you')} />
            </View>}
            {!currentSaved && entries.length === 0 && <View style={styles.promptRow}>
              <Text style={[typography.journalPrompt, { color: paper.ink, flexGrow: 1, flexBasis: 150 }]}>{selectedPrompt}</Text>
              <Pressable accessibilityRole="button" disabled={busy || audio.recording}
                accessibilityState={{ disabled: busy || audio.recording }}
                onPress={() => openSheet('prompts')} style={styles.pickPrompt}>
                <Text style={[typography.support, { color: paper.primary }]}>Pick a prompt</Text>
                <MaterialDesignIcons name="chevron-down" size={18} color={paper.primary} />
              </Pressable>
            </View>}
            <JournalThread />
            {!currentSaved && <TextInput accessibilityLabel="Journal entry" multiline value={draft} maxLength={12000}
              onChangeText={setDraft} editable={!busy && !audio.recording} placeholder="Start writing…"
              placeholderTextColor={paper.muted} cursorColor={paper.ink} selectionColor={paper.primary}
              style={[typography.journalWriting, styles.input, { color: paper.ink, fontSize, lineHeight: fontSize * 1.65 }]} />}
            {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: paper.ink }]}>{status}</Text>}
            {followUpRetry && <ActionButton appearance="paper" label="Retry follow-up" variant="quiet"
              disabled={busy || audio.recording || followingUp} onPress={() => void retryFollowUp()} />}
            {!currentSaved && <JournalWritingTools onStyle={() => openSheet('style')} onFinish={() => void finishSession()} />}
            {!!voiceNotes.length && <View style={styles.supportingSection}>
              <Text style={[typography.eyebrow, { color: paper.muted }]}>VOICE NOTES · THIS DEVICE</Text>
              {voiceNotes.map((note) => <VoiceNoteRow key={note.id} uri={note.uri} createdAt={note.created_at}
                disabled={busy || audio.recording}
                onDelete={() => { if (!busy && !audio.recording) void deleteVoiceNote(note.id); }} />)}
            </View>}
            <MemorySections selectedEntry={selectedEntry} excerpt={excerpt} setExcerpt={setExcerpt}
              memories={memories} busy={busy} recording={audio.recording} onPaper
              onSaveExcerpt={() => void saveExcerpt()} onCancel={() => setSelectedEntry(undefined)}
              onAction={(id, action) => void memoryAction(id, action)} />
            <FeedbackSection items={feedback} busy={busy} recording={audio.recording} onPaper
              onAction={(id, action, enabled) => void feedbackAction(id, action, enabled)} />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
    <PromptPicker visible={sheet === 'prompts'} selectedPrompt={selectedPrompt}
      onClose={() => setSheet(undefined)}
      onSelect={(prompt) => { void choosePrompt(prompt).then((changed) => { if (changed) setSheet(undefined); }); }} />
    <ColorPicker visible={sheet === 'style'} palette={palette} fontSize={fontSize}
      onClose={() => setSheet(undefined)} onSelect={setPalette} onFontSize={setFontSize} />
  </SafeAreaView>;
}
