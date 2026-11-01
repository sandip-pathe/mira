import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, HelpButton, useTheme } from '../../components/ui';
import { showHelpOptions } from '../../shared/showHelpOptions';
import { BrandArtwork } from '../../components/ui/BrandArtwork';
import { MemorySections } from './components/MemorySections';
import { ColorPicker, PromptPicker } from './components/JournalPickers';
import { JournalThread } from './components/JournalThread';
import { JournalWritingTools } from './components/JournalWritingTools';
import { styles } from './components/journalStyles';
import { useJournal } from './JournalProvider';

export default function JournalEntryScreen() {
  const journal = useJournal();
  const { colors, paper, typography } = useTheme();
  const [sheet, setSheet] = React.useState<'prompts' | 'style'>();
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  const closeRef = React.useRef(journal.closeJournal);
  React.useLayoutEffect(() => {
    closeRef.current = journal.closeJournal;
  }, [journal.closeJournal]);
  React.useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useFocusEffect(
    React.useCallback(
      () => () => {
        setSheet(undefined);
        setKeyboardOpen(false);
        closeRef.current();
      },
      [],
    ),
  );

  const {
    currentSaved,
    entries,
    memories,
    selectedEntry,
    setSelectedEntry,
    excerpt,
    setExcerpt,
    selectedPrompt,
    draft,
    setDraft,
    palette,
    setPalette,
    fontSize,
    setFontSize,
    loading,
    status,
    error,
    saving,
    busy,
    background,
    saveCurrentSession,
    saveExcerpt,
    memoryAction,
    choosePrompt,
  } = journal;

  async function finishSession() {
    Keyboard.dismiss();
    if (await saveCurrentSession()) router.replace('/you');
  }
  function openSheet(next: 'prompts' | 'style') {
    Keyboard.dismiss();
    setSheet(next);
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.canvas }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
            Journal
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="All journal entries"
              onPress={() => router.replace('/you')}
              style={({ pressed }) => [styles.headerAction, pressed && { backgroundColor: colors.soft }]}
            >
              <MaterialDesignIcons name="notebook-outline" size={26} color={colors.ink} />
            </Pressable>
            <HelpButton onPress={showHelpOptions} />
          </View>
        </View>
        <View style={[styles.page, { backgroundColor: background }]}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={paper.primary} />
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.thread}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
              >
                {!currentSaved &&
                  !draft.trim() &&
                  !entries.length &&
                  !keyboardOpen && (
                    <View style={styles.invitation}>
                      <Text
                        style={[
                          typography.journalInvitation,
                          styles.invitationText,
                          { color: paper.ink },
                        ]}
                      >
                        Start wherever you want.
                      </Text>
                      <BrandArtwork part="journal" size={104} />
                    </View>
                  )}
                {currentSaved && (
                  <View style={styles.readNotice}>
                    <Text style={[typography.body, { color: paper.muted }]}>
                      This session is saved. Start a new entry whenever you want.
                    </Text>
                    <ActionButton
                      appearance="paper"
                      label="Recent sessions"
                      variant="quiet"
                      style={styles.left}
                      onPress={() => router.replace('/you')}
                    />
                  </View>
                )}
                {!currentSaved && entries.length === 0 && (
                  <View style={styles.promptRow}>
                    <Text
                      style={[
                        typography.journalPrompt,
                        { color: paper.ink, flexGrow: 1, flexBasis: 150 },
                      ]}
                    >
                      {selectedPrompt}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      accessibilityState={{ disabled: busy }}
                      onPress={() => openSheet('prompts')}
                      style={({ pressed }) => [styles.pickPrompt, { opacity: busy ? 0.4 : pressed ? 0.65 : 1 }]}
                      accessibilityLabel="Change writing prompt"
                    >
                      <MaterialDesignIcons name="refresh" size={24} color={paper.primary} />
                    </Pressable>
                  </View>
                )}
                <JournalThread />
                {!currentSaved && (
                  <TextInput
                    accessibilityLabel="Journal entry"
                    multiline
                    value={draft}
                    maxLength={12000}
                    onChangeText={setDraft}
                    editable={!saving}
                    placeholder="Start writing…"
                    placeholderTextColor={paper.muted}
                    cursorColor={paper.ink}
                    selectionColor={paper.primary}
                    style={[
                      typography.journalWriting,
                      styles.input,
                      { color: paper.ink, fontSize, lineHeight: fontSize * 1.65 },
                    ]}
                  />
                )}
                {!!status && (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[typography.support, { color: error ? colors.error : paper.ink }]}
                  >
                    {status}
                  </Text>
                )}
                <MemorySections
                  selectedEntry={selectedEntry}
                  excerpt={excerpt}
                  setExcerpt={setExcerpt}
                  memories={memories}
                  showSavedContext={false}
                  busy={busy}
                  onPaper
                  onSaveExcerpt={() => void saveExcerpt()}
                  onCancel={() => setSelectedEntry(undefined)}
                  onAction={(id, action) => void memoryAction(id, action)}
                />
              </ScrollView>
              {!currentSaved && (
                <JournalWritingTools
                  onStyle={() => openSheet('style')}
                  onSave={() => void finishSession()}
                />
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      <PromptPicker
        visible={sheet === 'prompts'}
        selectedPrompt={selectedPrompt}
        onClose={() => setSheet(undefined)}
        onSelect={(prompt) => {
          void choosePrompt(prompt).then((changed) => {
            if (changed) setSheet(undefined);
          });
        }}
      />
      <ColorPicker
        visible={sheet === 'style'}
        palette={palette}
        fontSize={fontSize}
        onClose={() => setSheet(undefined)}
        onSelect={setPalette}
        onFontSize={setFontSize}
      />
    </SafeAreaView>
  );
}
