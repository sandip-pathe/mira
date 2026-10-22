import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { bodyLocations } from './noticeNameData';
import { ActivityPreferencePrompt } from '../../components/ActivityPreferencePrompt';
import { NoticeNameArtwork } from '../../art/NoticeNameArtwork';
import { FeelingSelection } from './FeelingSelection';
import { ThoughtAngles } from './ThoughtAngles';
import { NoticeNameChip } from './NoticeNameChip';
import { useNoticeNameExperience } from './useNoticeNameExperience';
import { styles } from './noticeNameStyles';

export function NoticeNameScreen({ onBack, onTalkTransfer }: ActivityExperienceProps) {
  const { colors, art, typography } = useTheme();
  const experience = useNoticeNameExperience();
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    Keyboard.dismiss();
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [experience.stage]);

  function talkAboutSentence() {
    if (!experience.sentence.trim() || experience.saving) return;
    try {
      if (!onTalkTransfer(`${experience.runId}:selected-wording`, experience.sentence.trim()))
        experience.setStatus('Your wording is still here. Talk could not be opened.');
    } catch {
      experience.setStatus('Your wording is still here. Talk could not be opened.');
    }
  }
  function keepWording() {
    Keyboard.dismiss();
    void experience.saveCurrentWording().then((id) => { if (id) router.push({ pathname: '/saved-wording', params: { id } }); });
  }

  return <ActivityFrame>
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {experience.stage === 'feelings' && <FeelingSelection experience={experience} onBack={onBack} />}
        {experience.stage === 'body' && <>
          <Eyebrow>OPTIONAL · BODY WORDS</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Notice anything in your body?</Text>
          <Text style={[typography.support, { color: colors.muted }]}>Only if useful. This is not an assessment, and you can skip it.</Text>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.bodyArt}>
            <View style={[styles.bodyShape, { backgroundColor: art.ground }]} />
            <View style={[styles.arms, { backgroundColor: art.primary }]} />
          </View>
          <View style={styles.chips}>{bodyLocations.map((part) => <NoticeNameChip key={part} label={part}
            selected={experience.body.includes(part)} onPress={() => experience.toggleBody(part)} />)}</View>
          {!!experience.body.length && <Text style={[typography.support, { color: colors.muted }]}>You chose: {experience.body.join(', ')}</Text>}
          <View style={styles.spacer} />
          <ActionButton label="Continue" onPress={() => experience.setStage('phrase')} />
          <ActionButton label="Skip body words" variant="quiet" onPress={() => experience.setStage('phrase')} />
          <ActionButton label="Back to feeling words" variant="quiet" onPress={() => experience.setStage('feelings')} />
        </>}
        {experience.stage === 'phrase' && <>
          <Eyebrow>YOUR WORDS</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A sentence for this moment.</Text>
          <Text style={[typography.support, { color: colors.muted }]}>Change it to sound like you. Only the sentence you choose can go to Talk or be saved.</Text>
          <TextInput accessibilityLabel="Edit your feeling sentence" multiline value={experience.sentence} editable={!experience.saving}
            onChangeText={experience.setSentence} placeholder="Write a sentence in your own words"
            placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
            style={[typography.body, styles.input, styles.writing, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
          <ActionButton label="Keep this wording" variant="secondary" loading={experience.saving}
            disabled={!experience.sentence.trim()} onPress={keepWording} />
          <ActionButton label="Talk about this wording" onPress={talkAboutSentence} disabled={!experience.sentence.trim() || experience.saving} />
          <ActionButton label="Explore another angle" variant="quiet" disabled={experience.saving} onPress={() => experience.setStage('thought_inputs')} />
          <ActionButton label="Finish" variant="quiet" disabled={experience.saving} onPress={experience.finish} />
          <ActionButton label="Edit feeling words" variant="quiet" disabled={experience.saving} onPress={() => experience.setStage('feelings')} />
        </>}
        {(experience.stage === 'thought_inputs' || experience.stage === 'thought_results') && <ThoughtAngles experience={experience} />}
        {experience.stage === 'done' && <>
          <Eyebrow>NOTICE & NAME</Eyebrow>
          <NoticeNameArtwork selectedCount={experience.feelings.length} complete />
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>You found words for this moment.</Text>
          <Text style={[typography.support, { color: colors.muted }]}>Your activity entries are not saved. Any wording you chose to keep remains on this device.</Text>
          <ActivityPreferencePrompt run={experience.run} title="Notice & Name" />
          <ActionButton label="Return to where you started" onPress={onBack} />
        </>}
        {!!experience.status && experience.stage !== 'thought_inputs' && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  </ActivityFrame>;
}


