import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, ui } from '../../../components/ui';
import { Intervention } from '../../../shared/interventions';
import { useInterventionRun } from '../hooks/useInterventionRun';

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
  if (!run.readyToStart) return null;
  const destination = origin === 'talk' ? 'Talk' : 'Actions';
  return (
    <Surface style={{ gap: 12 }}>
      <Eyebrow>YOUR CHOICE</Eyebrow>
      <Text style={ui.body}>
        Start this activity when you are ready. You can skip it or return to {destination}.
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
    </Surface>
  );
}

export function SortActivityPanel({ run, onKeep }: CommonProps) {
  if (run.phase !== 'active' || run.intervention?.presentation.pattern !== 'sort') return null;
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
                  label={`Move ${target}`}
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
    <Surface style={{ gap: 12 }}>
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
      <Text style={ui.muted}>This list is temporary. It is not saved to Journal.</Text>
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
          {group('IGNORE', 'ignore')}
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
    </Surface>
  );
}

export function CaptureActivityPanel({ run, onKeep }: CommonProps) {
  if (run.phase !== 'active' || run.intervention?.presentation.pattern !== 'capture') return null;
  return (
    <Surface style={{ gap: 12 }}>
      <Eyebrow>JUST FOR THIS MOMENT</Eyebrow>
      <Text style={ui.heading}>Write freely</Text>
      <TextInput
        accessibilityLabel="Temporary brain dump"
        multiline
        value={run.draft}
        onChangeText={run.setDraft}
        placeholder="Write whatever is on your mind…"
        style={[ui.input, { minHeight: 150 }]}
      />
      <Text style={ui.muted}>This is temporary and will not be saved to Journal.</Text>
      {!!run.draft.trim() && (
        <ActionButton
          label={
            run.continueSaved
              ? 'Update saved draft in Actions'
              : 'Keep this unfinished dump in Actions'
          }
          variant="secondary"
          loading={run.busy}
          onPress={() => onKeep(run.draft)}
        />
      )}
      <ActionButton label="Done" onPress={() => void run.finishRun('completed')} />
      <ActionButton label="Stop" variant="quiet" onPress={() => void run.finishRun('stopped')} />
    </Surface>
  );
}

export function StepsActivityPanel({ run, onKeep }: CommonProps) {
  const intervention: Intervention | undefined = run.intervention;
  if (run.phase !== 'active' || intervention?.presentation.pattern !== 'steps') return null;
  const input = intervention.presentation.input;
  const value = input === 'next_step' ? run.tinyStep : run.draft;
  return (
    <Surface style={{ gap: 13 }}>
      <Eyebrow>ONE STEP AT A TIME</Eyebrow>
      <Text style={ui.heading}>
        {intervention.steps[Math.min(run.step, intervention.steps.length - 1)]}
      </Text>
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
      {input !== 'none' && !!value.trim() && (
        <ActionButton
          label={
            run.continueSaved ? 'Update saved item in Actions' : 'Keep this in Actions for later'
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
    </Surface>
  );
}

export function PausedPanel({ run }: { run: RunState }) {
  if (run.phase !== 'paused') return null;
  return (
    <Surface style={{ gap: 12 }}>
      <Eyebrow>PAUSED</Eyebrow>
      <Text style={ui.body}>Your activity is paused. Continue whenever you are ready.</Text>
      <ActionButton label="Resume activity" onPress={run.resumeActivity} />
      <ActionButton label="Stop" variant="quiet" onPress={() => void run.finishRun('stopped')} />
    </Surface>
  );
}
