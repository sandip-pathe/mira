import React from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { LetterEnvelope } from '../../art/LetterEnvelope';
import type { UnsentLetterExperience } from './useUnsentLetterExperience';
import { useLetterRelease } from './useLetterRelease';
import { styles } from './letterStyles';

export function LetterEditor({ experience }: {
  experience: UnsentLetterExperience;
}) {
  const { colors, paper, typography } = useTheme();
  const [promptsOpen, setPromptsOpen] = React.useState(false);
  const [countWords, setCountWords] = React.useState(false);
  const { draft, saving } = experience;
  const release = useLetterRelease(experience.discardNewDraft, !draft.id && !saving);
  function close() {
    if (draft.id) experience.closeSavedEditor();
    else release.confirm();
  }
  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0;
  return <>
    <View style={styles.art}>
      <LetterEnvelope releaseProgress={release.progress} />
      <Text style={[typography.support, { color: colors.muted }]}>A letter for you to write, at your pace</Text>
    </View>
    <Eyebrow>{draft.id ? 'EDIT SAVED LETTER' : 'UNSENT LETTER'}</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{draft.id ? 'Your words, your choice.' : 'Write what you wish you could say.'}</Text>
    <TextInput accessibilityLabel="Letter title" maxLength={100} value={draft.title} editable={!saving}
      onChangeText={(value) => experience.updateDraft('title', value)} placeholder="Letter title"
      placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.field, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
    <TextInput accessibilityLabel="Optional addressee" maxLength={100} value={draft.recipient} editable={!saving}
      onChangeText={(value) => experience.updateDraft('recipient', value)} placeholder="To… (optional)"
      placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.field, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: promptsOpen, disabled: saving }} disabled={saving}
      onPress={() => setPromptsOpen((value) => !value)} style={styles.quietRow}>
      <Text style={[typography.button, { color: colors.primary }]}>{promptsOpen ? 'Hide starting lines' : 'Need a starting line?'}</Text>
      <MaterialDesignIcons name={promptsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
    </Pressable>
    {promptsOpen && <View style={styles.prompts}>
      {['What happened?', 'What I wish you understood', 'What I needed', 'What I want now'].map((prompt) => (
        <Pressable key={prompt} accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
          onPress={() => experience.updateDraft('body', `${draft.body}${draft.body && !draft.body.endsWith('\n') ? '\n\n' : ''}${prompt}\n`)}
          style={({ pressed }) => [styles.quietRow, { opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[typography.support, { color: colors.primary }]}>{prompt}</Text>
        </Pressable>
      ))}
    </View>}
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: countWords }}
      onPress={() => setCountWords((value) => !value)} style={styles.quietRow}>
      <MaterialDesignIcons name={countWords ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={22} color={colors.primary} />
      <Text style={[typography.support, styles.rowText, { color: colors.muted }]}>Try around 100 words (optional)</Text>
    </Pressable>
    {countWords && <Text style={[typography.support, { color: colors.muted }]}>{words} words · the target never blocks you</Text>}
    <TextInput accessibilityLabel="Letter draft" maxLength={12000} multiline value={draft.body} editable={!saving}
      onChangeText={(value) => experience.updateDraft('body', value)} placeholder="Write a few words, or as much as you want…"
      placeholderTextColor={paper.muted} cursorColor={paper.ink} selectionColor={paper.primary}
      style={[typography.journalWriting, styles.paper, { color: paper.ink, backgroundColor: paper.background }]} />
    {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
    <ActionButton label="Read letter" disabled={!draft.body.trim() || saving}
      onPress={() => { release.reset(); Keyboard.dismiss(); experience.setScreen('read'); }} />
    <ActionButton label={draft.id ? 'Save changes on this device' : 'Save letter on this device'} variant="secondary"
      loading={saving} disabled={!draft.body.trim()} onPress={() => { release.reset(); Keyboard.dismiss(); void experience.saveCurrent(); }} />
    {!draft.id && <>
      <Pressable accessibilityRole="button" accessibilityLabel="Tap to confirm or hold to release and discard this unsaved letter"
        accessibilityState={{ disabled: saving }} disabled={saving} delayLongPress={350}
        onPressIn={release.start} onLongPress={release.preview} onPressOut={release.cancel} onPress={release.press}
        style={({ pressed }) => [styles.discard, { opacity: saving ? 0.4 : pressed ? 0.65 : 1 }]}>
        <Text style={[typography.support, styles.centered, { color: colors.muted }]}>Tap to discard, or hold to release this draft</Text>
      </Pressable>
      {!!release.status && <Text accessibilityLiveRegion="polite" style={[typography.support, styles.centered, { color: colors.muted }]}>{release.status}</Text>}
    </>}
    <ActionButton label={draft.id ? 'Return to saved letter' : 'Back to Letter home'} variant="quiet" disabled={saving} onPress={close} />
  </>;
}
