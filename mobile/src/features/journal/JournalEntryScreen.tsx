import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Eyebrow, ui, colors } from '../../components/ui';
import { FeedbackSection } from './components/FeedbackSection';
import { MemorySections } from './components/MemorySections';
import { ColorPicker, PromptPicker, VoiceNoteRow } from './components/JournalPickers';
import { styles } from './components/journalStyles';
import { useJournal } from './JournalProvider';

export default function JournalEntryScreen() {
  const journal = useJournal();
  const [showPrompts, setShowPrompts] = React.useState(false);
  const [showColors, setShowColors] = React.useState(false);
  const closeRef = React.useRef(journal.closeJournal);
  React.useEffect(() => {
    closeRef.current = journal.closeJournal;
  }, [journal.closeJournal]);
  const {
    currentSaved,
    messages,
    entries,
    memories,
    feedback,
    selectedEntry,
    setSelectedEntry,
    excerpt,
    setExcerpt,
    voiceNotes,
    deleteVoiceNote,
    selectedPrompt,
    draft,
    setDraft,
    palette,
    setPalette,
    fontSize,
    setFontSize,
    loading,
    saving,
    status,
    error,
    audio,
    busy,
    background,
    foreground,
    subtle,
    saveCurrentSession,
    saveEntry,
    saveExcerpt,
    memoryAction,
    feedbackAction,
    saveVoiceNote,
    choosePrompt,
    deleteEntry,
    followUpRetry,
    retryFollowUp,
    followingUp,
  } = journal;

  useFocusEffect(React.useCallback(() => () => closeRef.current(), []));

  async function saveAndReturn() {
    if (await saveCurrentSession()) router.back();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <Stack.Screen options={{ headerShown: false, statusBarStyle: 'dark' }} />
      <View style={[styles.page, { backgroundColor: background }]}>
        <View style={styles.header}>
          <Text
            style={{
              fontSize: 32,
              lineHeight: 42,
              fontWeight: '700',
              color: '#0474f3',
              letterSpacing: -1.2,
            }}
          >
            Journal
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change journal colors"
            onPress={() => setShowColors(true)}
            hitSlop={10}
          >
            <MaterialDesignIcons name="palette-outline" size={27} color={foreground} />
          </Pressable>
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
            {messages
              .filter((message) => currentSaved || entries.length > 0 || message.entry_id)
              .map((message) =>
                message.role === 'assistant' ? (
                  <View key={message.id} style={styles.exchange}>
                    <Text
                      style={[styles.promptText, { color: foreground, fontSize: fontSize + 3 }]}
                    >
                      {message.content}
                    </Text>
                  </View>
                ) : (
                  (() => {
                    const entry = entries.find((item) => item.id === message.entry_id);
                    return (
                      <View key={message.id} style={styles.exchange}>
                        <Pressable
                          onLongPress={() => !busy && entry && deleteEntry(entry)}
                          delayLongPress={450}
                          accessibilityHint={'Long press to delete this entry'}
                        >
                          <Text style={[styles.entryText, { color: foreground, fontSize }]}>
                            {message.content}
                          </Text>
                          <Text style={[styles.entryDate, { color: subtle }]}>
                            {new Date(message.created_at * 1000).toLocaleDateString()}
                          </Text>
                        </Pressable>
                        {entry && (
                          <Pressable
                            onPress={() => {
                              setSelectedEntry(entry);
                              setExcerpt(entry.text.slice(0, 500));
                            }}
                            style={styles.changePrompt}
                          >
                            <Text style={[styles.changePromptText, { color: subtle }]}>
                              Choose excerpt for Talk
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })()
                ),
              )}

            {!currentSaved ? (
              <View style={styles.activeExchange}>
                {entries.length === 0 && (
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowPrompts(true);
                    }}
                    style={styles.pickPrompt}
                  >
                    <Text style={[styles.pickPromptText, { color: foreground }]}>
                      Pick a Prompt
                    </Text>
                    <MaterialDesignIcons name="chevron-right" size={20} color={foreground} />
                  </Pressable>
                )}
                {entries.length === 0 && (
                  <Text style={[styles.promptText, { color: foreground, fontSize: fontSize + 3 }]}>
                    {selectedPrompt}
                  </Text>
                )}
                <TextInput
                  accessibilityLabel="Journal response"
                  multiline
                  value={draft}
                  maxLength={12000}
                  onChangeText={setDraft}
                  editable={!busy && !audio.recording}
                  placeholder="Start writing..."
                  placeholderTextColor={subtle}
                  cursorColor={foreground}
                  selectionColor={foreground}
                  style={[styles.input, { color: foreground, fontSize }]}
                />
                <View style={styles.composerActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={audio.recording ? 'Stop voice note' : 'Record voice note'}
                    disabled={busy || !!audio.uri}
                    onPress={() => void (audio.recording ? audio.stop() : audio.start())}
                    style={[
                      styles.recordButton,
                      { borderColor: `${foreground}55` },
                      (busy || !!audio.uri) && styles.disabled,
                    ]}
                  >
                    <MaterialDesignIcons
                      name={audio.recording ? 'stop' : 'microphone-outline'}
                      size={22}
                      color={foreground}
                    />
                    <Text style={{ color: foreground }}>
                      {audio.recording ? 'Stop recording' : 'Voice note'}
                    </Text>
                  </Pressable>
                  {audio.uri && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <ActionButton
                        label="Save voice note"
                        disabled={busy}
                        onPress={() => void saveVoiceNote()}
                      />
                      <ActionButton
                        label="Discard"
                        variant="quiet"
                        disabled={busy}
                        onPress={() => audio.discard()}
                      />
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <Text style={[ui.muted, { color: subtle }]}>
                This session is saved. Start a new entry whenever you’re ready.
              </Text>
            )}
            {!!voiceNotes.length && (
              <View style={styles.supportingSection}>
                <Eyebrow>VOICE NOTES · THIS DEVICE</Eyebrow>
                {voiceNotes.map((note) => (
                  <VoiceNoteRow
                    key={note.id}
                    uri={note.uri}
                    createdAt={note.created_at}
                    onDelete={() => {
                      if (!busy) void deleteVoiceNote(note.id);
                    }}
                  />
                ))}
              </View>
            )}
            <MemorySections
              selectedEntry={selectedEntry}
              excerpt={excerpt}
              setExcerpt={setExcerpt}
              memories={memories}
              busy={busy}
              recording={audio.recording}
              onSaveExcerpt={() => void saveExcerpt()}
              onCancel={() => setSelectedEntry(undefined)}
              onAction={(id, action) => void memoryAction(id, action)}
            />
            <FeedbackSection
              items={feedback}
              busy={busy}
              recording={audio.recording}
              onAction={(id, action, enabled) => void feedbackAction(id, action, enabled)}
            />
            {followUpRetry && (
              <ActionButton
                label="Retry follow-up"
                variant="quiet"
                disabled={busy || followingUp}
                onPress={() => void retryFollowUp()}
              />
            )}
            <ActionButton
              label="Save session"
              variant="quiet"
              disabled={
                busy ||
                audio.recording ||
                !!audio.uri ||
                currentSaved ||
                (!entries.length && !draft.trim() && !voiceNotes.length)
              }
              onPress={() => void saveAndReturn()}
            />
            <View style={{ height: 110 }} />
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
        {!currentSaved && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save journal entry"
            accessibilityState={{
              disabled: !draft.trim() || busy || audio.recording,
              busy: saving || audio.busy,
            }}
            disabled={!draft.trim() || busy || audio.recording}
            onPress={() => void saveEntry()}
            style={[
              styles.saveButton,
              { backgroundColor: palette.dark },
              (!draft.trim() || busy || audio.recording) && styles.disabled,
            ]}
          >
            {saving || audio.busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <MaterialDesignIcons name="auto-fix" size={28} color="#FFFFFF" />
            )}
          </Pressable>
        )}
      </View>
      <PromptPicker
        visible={showPrompts}
        onClose={() => setShowPrompts(false)}
        onSelect={(prompt) => {
          void choosePrompt(prompt).then((changed) => {
            if (changed) setShowPrompts(false);
          });
        }}
        background={background}
        foreground={foreground}
        subtle={subtle}
      />
      <ColorPicker
        visible={showColors}
        palette={palette}
        fontSize={fontSize}
        background={background}
        foreground={foreground}
        onClose={() => setShowColors(false)}
        onSelect={setPalette}
        onFontSize={setFontSize}
      />
    </SafeAreaView>
  );
}
