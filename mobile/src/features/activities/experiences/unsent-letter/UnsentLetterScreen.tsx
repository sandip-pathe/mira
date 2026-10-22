import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { LetterEnvelope } from '../../art/LetterEnvelope';
import { useUnsentLetterExperience } from './useUnsentLetterExperience';
import { LetterEditor } from './LetterEditor';
import { LetterReadView } from './LetterReadView';
import { LetterShelf } from './LetterShelf';
import { styles } from './letterStyles';

export function UnsentLetterScreen({ origin, letterId, onBack, onTalkTransfer }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const experience = useUnsentLetterExperience({ origin, letterId });
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    Keyboard.dismiss();
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [experience.screen]);

  return <ActivityFrame>
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {experience.screen === 'loading' && <>
          <Eyebrow>UNSENT LETTER</Eyebrow>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening your letter…</Text>
          </View>
        </>}
        {experience.screen === 'home' && <>
          <Eyebrow>EXPRESS · UNSENT LETTER</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A letter that stays yours.</Text>
          <LetterEnvelope />
          <Text style={[typography.support, { color: colors.muted }]}>Write what you wish you could say. Read it back, save it privately, or close it when you are ready.</Text>
          <ActionButton label="Write a new letter" onPress={experience.createNew} />
          {!!experience.letters.length && <>
            <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Recent letters</Text>
            <LetterShelf letters={experience.letters} onOpen={(letter) => experience.openSaved(letter)} />
            <ActionButton label="See all saved letters" variant="secondary" onPress={() => experience.setScreen('collection')} />
          </>}
          {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
          <View style={styles.spacer} />
          <ActionButton label="Back to Activities" variant="quiet" onPress={onBack} />
        </>}
        {experience.screen === 'collection' && <>
          <ActionButton label="Back to Letter home" variant="quiet" onPress={() => experience.setScreen('home')} />
          <Eyebrow>UNSENT LETTER · PRIVATE ON THIS DEVICE</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Saved letters</Text>
          {experience.letters.length
            ? <LetterShelf letters={experience.letters} expanded onOpen={(letter) => experience.openSaved(letter, true)} onDelete={experience.confirmRemove} />
            : <Text style={[typography.support, { color: colors.muted }]}>No saved letters yet. A letter appears here only when you choose Save.</Text>}
          {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
          <ActionButton label="Write a new letter" variant="secondary" onPress={experience.createNew} />
        </>}
        {experience.screen === 'editor' && <LetterEditor experience={experience} />}
        {experience.screen === 'read' && <LetterReadView experience={experience} onTalkTransfer={onTalkTransfer} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </ActivityFrame>;
}
