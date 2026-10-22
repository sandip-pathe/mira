import React from 'react';
import { Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { LetterEnvelope } from '../../art/LetterEnvelope';
import { LetterTakeawayView } from './LetterTakeawayView';
import { useLetterRelease } from './useLetterRelease';
import type { UnsentLetterExperience } from './useUnsentLetterExperience';
import { styles } from './letterStyles';

export function LetterReadView({ experience, onTalkTransfer }: {
  experience: UnsentLetterExperience; onTalkTransfer: (runId: string, text: string) => boolean;
}) {
  const { colors, paper, typography } = useTheme();
  const { draft, letter, saving } = experience;
  const release = useLetterRelease(experience.discardNewDraft, !draft.id && !saving, false);
  return <>
    <View style={styles.art}><LetterEnvelope opened /></View>
    <Eyebrow>{letter ? 'SAVED LETTER' : 'YOUR LETTER'}</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{draft.title.trim() || 'Unsent letter'}</Text>
    {!!draft.recipient.trim() && <Text style={[typography.activityTitle, { color: colors.ink }]}>To {draft.recipient.trim()}</Text>}
    <View style={[styles.readPaper, { backgroundColor: paper.background }]}>
      <Text selectable style={[typography.journalWriting, { color: paper.ink }]}>{draft.body}</Text>
    </View>
    <Text style={[typography.support, { color: colors.muted }]}>{letter
      ? 'Saved on this device. It stays inside Unsent Letter and is not shared context.' : 'This draft is temporary unless you choose to save it.'}</Text>
    {experience.takeaway ? <LetterTakeawayView experience={experience} onTalkTransfer={onTalkTransfer} /> : <>
      <ActionButton label="Find what I need here" variant="secondary" loading={experience.suggesting} disabled={!draft.body.trim() || saving}
        onPress={() => void experience.findWhatINeed()} />
      <Text style={[typography.support, { color: colors.muted }]}>Only when you ask, this letter is sent for a one-time suggestion. The service does not save it.</Text>
      {experience.suggesting && <ActionButton label="Cancel suggestion" variant="quiet" onPress={experience.cancelSuggestion} />}
    </>}
    {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
    <ActionButton label={letter ? 'Edit letter' : 'Return to writing'} variant="secondary" disabled={saving} onPress={experience.edit} />
    {!draft.id && <ActionButton label="Save letter on this device" onPress={() => void experience.saveCurrent()} loading={saving} />}
    <ActionButton label={experience.returnToCollection ? 'Back to Saved letters' : 'Back to Letter home'} variant="quiet" disabled={saving} onPress={experience.backFromRead} />
    {!letter && <ActionButton label="Discard draft" variant="quiet" disabled={saving} onPress={release.confirm} />}
  </>;
}
