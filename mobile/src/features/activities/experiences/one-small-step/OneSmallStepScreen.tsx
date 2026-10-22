import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { SmallStepScene } from '../../art/SmallStepScene';
import { ActivityPreferencePrompt } from '../../components/ActivityPreferencePrompt';
import { useOneSmallStepExperience } from './useOneSmallStepExperience';
import { SmallStepEditor } from './SmallStepEditor';
import { SmallStepActionCard } from './SmallStepActionCard';
import { SmallStepTrying } from './SmallStepTrying';
import { styles } from './smallStepStyles';

export function OneSmallStepScreen({ origin, continueItemId, handoffId, onBack, onFinish }: ActivityExperienceProps & {
  onFinish?: (state: 'completed' | 'skipped' | 'stopped') => void;
}) {
  const { colors, typography } = useTheme();
  const experience = useOneSmallStepExperience({ origin, continueItemId, handoffId, onFinish });
  const [pendingOutcome, setPendingOutcome] = React.useState<'tried' | 'not_tried'>();
  const scroll = React.useRef<ScrollView>(null);
  const view = experience.phase === 'generating' ? 'edit' : experience.phase;
  React.useEffect(() => {
    Keyboard.dismiss();
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [view]);

  async function complete(outcome: 'tried' | 'not_tried') {
    setPendingOutcome(outcome);
    try { await experience.complete(outcome); }
    finally { setPendingOutcome(undefined); }
  }

  return <ActivityFrame>
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {experience.phase === 'loading' && <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening your saved action…</Text>
        </View>}
        {experience.phase === 'error' && <>
          <Eyebrow>ONE SMALL STEP</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>This action isn’t ready</Text>
          <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>
          <ActionButton label="Back" onPress={onBack} />
        </>}
        {experience.phase === 'ready' && <>
          <SmallStepScene state="thought" />
          <Eyebrow>ONE SMALL STEP</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Make one thing easier to start.</Text>
          <Text style={[typography.support, { color: colors.muted }]}>Name one task. Mira can suggest a first move, or you can write your own.</Text>
          <View style={styles.spacer} />
          <ActionButton label="Start with a task" onPress={experience.start} />
        </>}
        {(experience.phase === 'edit' || experience.phase === 'generating') && <SmallStepEditor experience={experience} onBack={onBack} />}
        {experience.phase === 'card' && <SmallStepActionCard experience={experience} onBack={onBack} />}
        {experience.phase === 'trying' && <SmallStepTrying experience={experience} />}
        {experience.phase === 'checkin' && <>
          <SmallStepScene state="action" />
          <Eyebrow>CHECK IN</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>How did that go?</Text>
          <Text style={[typography.body, { color: colors.ink }]}>{experience.firstMove}</Text>
          <Text style={[typography.support, { color: colors.muted }]}>Only you know what happened. Choose what fits.</Text>
          {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
          <ActionButton label="I tried it" loading={pendingOutcome === 'tried'}
            disabled={experience.busy || !!pendingOutcome} onPress={() => void complete('tried')} />
          <ActionButton label="Not this time" variant="secondary" loading={pendingOutcome === 'not_tried'}
            disabled={experience.busy || !!pendingOutcome} onPress={() => void complete('not_tried')} />
          <ActionButton label="Back to action card" variant="quiet" disabled={experience.busy || !!pendingOutcome} onPress={experience.backToCard} />
        </>}
        {experience.phase === 'done' && <>
          <SmallStepScene state="complete" />
          <Eyebrow>YOUR CHOICE</Eyebrow>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
            {experience.outcome === 'tried' ? 'You marked this move as tried.' : 'You can return to this when you want.'}
          </Text>
          <Text style={[typography.body, { color: colors.ink }]}>{experience.firstMove}</Text>
          {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
          <ActivityPreferencePrompt run={experience.run} title="One Small Step" />
          {experience.savedAction && <ActionButton label="Open saved action" variant="secondary"
            onPress={() => router.push({ pathname: '/saved-action', params: { id: experience.savedAction!.id } })} />}
          <ActionButton label="Return to where you started" onPress={onBack} />
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </ActivityFrame>;
}
