import React from 'react';
import { AccessibilityInfo, Animated, Text, TextInput, useAnimatedValue, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { getContinueKind, Intervention } from '../../../shared/interventions';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { GroundingIllustration } from './GroundingIllustration';
import { OneSmallStepIllustration } from './OneSmallStepIllustration';
import { NoticeNameIllustration } from './NoticeNamePanel';

type RunState = ReturnType<typeof useInterventionRun>;
type CommonProps = { run: RunState; onKeep: (content: string) => void };

export function ReadyPanel({
  run,
  origin,
  onBack,
}: {
  run: RunState;
  origin: string;
  onBack: () => void;
}) {
  if (!run.readyToStart || (origin === 'talk' && run.busy) || run.intervention?.id === 'paced_breathing' || run.intervention?.id === 'reach_out') return null;
  const destination = origin === 'talk' ? 'Talk' : 'Actions';
  return (
    <ActivityPanel style={{ gap: 12 }}>
      {run.intervention?.presentation.pattern === 'grounding' && <GroundingIllustration sense={0} />}
      {run.intervention?.id === 'one_small_step' && <OneSmallStepIllustration />}
      {run.intervention?.id === 'name_a_feeling' && <NoticeNameIllustration />}
      <Eyebrow>YOUR CHOICE</Eyebrow>
      <Text style={ui.body}>
        {run.intervention?.presentation.pattern === 'grounding'
          ? 'Take a moment to notice what is around you. Follow at your pace. Skip any prompt.'
          : run.intervention?.id === 'one_small_step'
            ? 'Make one thing easier to start. Choose the path that fits, and keep only the action you want to take forward.'
            : run.intervention?.id === 'name_a_feeling'
              ? 'What comes closest to this moment? Choose words, use your own, or leave it uncertain.'
            : `Start this activity when you are ready. You can skip it or return to ${destination}.`}
      </Text>
      <ActionButton
        label="Start activity"
        loading={run.busy}
        onPress={() => void run.startActivity()}
      />
      <ActionButton label="Skip" variant="secondary" onPress={onBack} />
      {origin === 'actions_continue' && (
        <Text style={ui.muted}>
          This item was saved on this device. Start is still checked by Mira when online.
        </Text>
      )}
      <ActionButton label={`Return to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );
}

export function SortActivityPanel({ run, onKeep }: CommonProps) {
  if (run.phase !== 'active' || run.intervention?.id !== 'task_reset_60s') return null;
  const group = (label: string, key: 'now' | 'later' | 'ignore') => (
    <View style={{ gap: 8 }} key={key}>
      <Eyebrow>{label}</Eyebrow>
      {(run.groups?.[key] ?? []).map((item, index) => (
        <Surface key={`${key}-${index}`} style={{ gap: 7 }}>
          <Text style={ui.body}>{item}</Text>
          {key === 'now' && (
            <ActionButton
              label="Use as tiny next step"
              variant="secondary"
              onPress={() => run.setTinyStep(item)}
            />
          )}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {(['now', 'later', 'ignore'] as const)
              .filter((target) => target !== key)
              .map((target) => (
                <ActionButton
                  key={target}
                  label={`Move to ${target === 'ignore' ? 'not for now' : target}`}
                  variant="quiet"
                  onPress={() => run.move(item, key, target)}
                  style={{ flex: 1 }}
                />
              ))}
          </View>
        </Surface>
      ))}
    </View>
  );
  return (
    <ActivityPanel style={{ gap: 12 }}>
      <Eyebrow>GET IT OUT OF YOUR HEAD</Eyebrow>
      <Text style={ui.heading}>What is taking up space?</Text>
      <TextInput
        accessibilityLabel="Temporary brain dump"
        multiline
        value={run.draft}
        onChangeText={run.setDraft}
        placeholder="One thing per line"
        style={[ui.input, { minHeight: 110 }]}
      />
      <Text style={ui.muted}>
        This list is temporary. “Sort it for me” sends these lines to Mira’s AI provider for
        one-time suggestions.
      </Text>
      {!run.groups && (
        <>
          <ActionButton
            label="Sort it for me"
            loading={run.busy}
            disabled={!run.draft.trim()}
            onPress={() => void run.organize()}
          />
          <ActionButton
            label="Choose one without sorting"
            variant="quiet"
            onPress={() =>
              run.setGroups({
                now: run.draft
                  .split('\n')
                  .map((value) => value.trim())
                  .filter(Boolean),
                later: [],
                ignore: [],
              })
            }
          />
        </>
      )}
      {run.groups && (
        <>
          {group('NOW', 'now')}
          {group('LATER', 'later')}
          {group('NOT FOR NOW', 'ignore')}
          <TextInput
            accessibilityLabel="One tiny next step"
            value={run.tinyStep}
            onChangeText={run.setTinyStep}
            placeholder="One small next step"
            style={ui.input}
          />
          {!!run.tinyStep.trim() && (
            <ActionButton
              label={
                run.continueSaved
                  ? 'Update saved item in Actions'
                  : 'Keep this next step in Actions'
              }
              variant="secondary"
              loading={run.busy}
              onPress={() => onKeep(run.tinyStep)}
            />
          )}
          <ActionButton
            label="Done"
            disabled={run.busy}
            onPress={() => void run.finishRun('completed')}
          />
          <ActionButton
            label="Stop"
            variant="quiet"
            disabled={run.busy}
            onPress={() => void run.finishRun('stopped')}
          />
        </>
      )}
    </ActivityPanel>
  );
}

export function StepsActivityPanel({ run, onKeep }: CommonProps) {
  const intervention: Intervention | undefined = run.intervention;
  if (run.phase !== 'active' || intervention?.presentation.pattern !== 'steps' || intervention.id === 'name_a_feeling') return null;
  const input = intervention.presentation.input;
  const value = input === 'next_step' ? run.tinyStep : run.draft;
  const choices =
    intervention.id === 'short_movement'
      ? ['Short walk', 'Change rooms', 'Sit somewhere different', 'Something else']
      : intervention.id === 'name_a_feeling'
        ? ['Disappointed', 'Frustrated', 'Unsure', 'Something else']
        : [];
  const perspectiveStep = intervention.id === 'perspective_shift';
  const choiceInputStep = intervention.id === 'name_a_feeling' ? 1 : 0;
  const visibleChoices = run.step === choiceInputStep ? choices : [];
  const showInput = input !== 'none' && (!perspectiveStep || run.step < 2);
  return (
    <StepTransition step={run.step}>
      <ActivityPanel style={{ gap: 13 }}>
        <Eyebrow>ONE STEP AT A TIME</Eyebrow>
        <Text accessibilityLiveRegion="polite" style={ui.heading}>
          {intervention.steps[Math.min(run.step, intervention.steps.length - 1)]}
        </Text>
        <Text style={ui.muted}>
          Step {run.step + 1} of {intervention.steps.length}
        </Text>
        {visibleChoices.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {visibleChoices.map((choice) => (
              <ActionButton
                key={choice}
                label={choice}
                variant={run.draft === choice ? 'primary' : 'secondary'}
                onPress={() => run.setDraft(choice)}
              />
            ))}
          </View>
        )}
        {input === 'next_step' && (
          <TextInput
            accessibilityLabel="Your tiny next step"
            value={run.tinyStep}
            onChangeText={run.setTinyStep}
            placeholder="One small thing"
            style={ui.input}
          />
        )}
        {input === 'draft' && (
          <TextInput
            accessibilityLabel="Draft a message you may want to send"
            multiline
            value={run.draft}
            onChangeText={run.setDraft}
            placeholder="What would you like them to know?"
            style={[ui.input, { minHeight: 110 }]}
          />
        )}
        {input === 'choice_or_text' && run.step === choiceInputStep && (
          <TextInput
            accessibilityLabel="Your choice or note"
            multiline
            value={run.draft}
            onChangeText={run.setDraft}
            placeholder={
              intervention.id === 'one_song_reset'
                ? 'Song or artist (optional)'
                : intervention.id === 'short_movement'
                  ? 'Or choose your own comfortable option'
                  : 'Or use your own words'
            }
            style={[ui.input, { minHeight: 100 }]}
          />
        )}
        {perspectiveStep && run.step === 0 && (
          <TextInput
            accessibilityLabel="What you know for sure"
            multiline
            value={run.draft}
            onChangeText={run.setDraft}
            placeholder="What do you know for sure?"
            style={[ui.input, { minHeight: 110 }]}
          />
        )}
        {perspectiveStep && run.step === 1 && (
          <TextInput
            accessibilityLabel="Possible perspectives, not facts"
            multiline
            value={run.reflection}
            onChangeText={run.setReflection}
            placeholder="What are a few things they might have been thinking? These are only possibilities."
            style={[ui.input, { minHeight: 130 }]}
          />
        )}
        {showInput &&
          !!value.trim() &&
          input !== 'reflection' &&
          getContinueKind(intervention.id) && (
            <ActionButton
              label={
                run.continueSaved
                  ? 'Update saved item in Actions'
                  : 'Keep this in Actions for later'
              }
              variant="secondary"
              loading={run.busy}
              onPress={() => onKeep(value)}
            />
          )}
        {intervention.presentation.optional_timer && run.seconds > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#3F6852' }}>
              {run.seconds}
              <Text style={{ fontSize: 15 }}> sec</Text>
            </Text>
            {!run.timerRunning && (
              <ActionButton
                label={run.timerPaused ? 'Resume timer' : 'Start optional timer'}
                variant="secondary"
                onPress={() => run.setTimerState('running')}
              />
            )}
            {run.timerRunning && (
              <ActionButton
                label="Pause timer"
                variant="secondary"
                onPress={() => run.setTimerState('paused')}
              />
            )}
          </View>
        )}
        {run.step < intervention.steps.length - 1 ? (
          <ActionButton label="Next" onPress={() => run.setStep((value) => value + 1)} />
        ) : (
          <ActionButton
            label="Done"
            disabled={run.busy || (input === 'next_step' && !run.tinyStep.trim())}
            onPress={() => void run.finishRun('completed')}
          />
        )}
        <ActionButton
          label="Stop"
          variant="quiet"
          disabled={run.busy}
          onPress={() => void run.finishRun('stopped')}
        />
        <ActionButton
          label="Pause activity"
          variant="quiet"
          disabled={run.busy}
          onPress={run.pauseActivity}
        />
      </ActivityPanel>
    </StepTransition>
  );
}

function StepTransition({ step, children }: { step: number; children: React.ReactNode }) {
  const progress = useAnimatedValue(1);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion, step]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function PausedPanel({ run }: { run: RunState }) {
  if (run.phase !== 'paused') return null;
  return (
    <ActivityPanel style={{ gap: 12 }}>
      <Eyebrow>PAUSED</Eyebrow>
      <Text style={ui.body}>Your activity is paused. Continue whenever you are ready.</Text>
      <ActionButton label="Resume activity" onPress={run.resumeActivity} />
      <ActionButton label="Stop" variant="quiet" onPress={() => void run.finishRun('stopped')} />
    </ActivityPanel>
  );
}
