import React from 'react';
import { Text, View } from 'react-native';
import { ActionButton, Eyebrow, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { GroundingIllustration } from './GroundingIllustration';
import { useInterventionRun } from '../hooks/useInterventionRun';

type RunState = ReturnType<typeof useInterventionRun>;
const senses = [
  { label: 'See', target: 3, prompt: 'Notice 3 things you can see.' },
  { label: 'Hear', target: 2, prompt: 'Notice 2 things you can hear.' },
  {
    label: 'Feel',
    target: 1,
    prompt: 'Notice one comfortable point of contact, such as your feet or the chair.',
  },
];

export function GroundingActivityPanel({ run, onBack }: { run: RunState; onBack: () => void }) {
  if (
    run.intervention?.presentation.pattern !== 'grounding' ||
    !['active', 'paused'].includes(run.phase)
  )
    return null;
  const index = Math.max(0, Math.min(run.step, senses.length - 1));
  const sense = senses[index];
  const count = run.groundingCounts[index] ?? 0;
  const skipped = run.groundingSkipped[index] ?? false;
  const canContinue = skipped || count >= sense.target;

  function updateCount(value: number) {
    run.setGroundingCounts((current) =>
      current.map((item, at) => (at === index ? Math.max(0, Math.min(sense.target, value)) : item)),
    );
  }
  function updateSkipped(value: boolean) {
    run.setGroundingSkipped((current) => current.map((item, at) => (at === index ? value : item)));
  }
  function finish() {
    const summary = senses
      .map((item, at) => {
        const total = run.groundingCounts[at] ?? 0;
        return `${item.label}: ${run.groundingSkipped[at] ? 'skipped' : `${total} of ${item.target} acknowledged`}`;
      })
      .join('\n');
    run.setGroundingSummary(summary);
    void run.finishRun('completed');
  }
  return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>NOTICE AT YOUR PACE · {index + 1} OF 3</Eyebrow>
      <GroundingIllustration sense={index} />
      <Text accessibilityLiveRegion="polite" style={ui.heading}>
        {sense.prompt}
      </Text>
      <Text style={ui.muted}>{skipped ? 'Skipped' : `${count} of ${sense.target}`}</Text>
      <View
        accessibilityLabel={`${count} of ${sense.target} noticed`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: sense.target, now: count }}
        style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 3 }}
      >
        {Array.from({ length: sense.target }, (_, at) => (
          <View
            key={at}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: '#3F6852',
              backgroundColor: at < count ? '#3F6852' : '#FFFEFB',
            }}
          />
        ))}
      </View>
      <ActionButton
        label="Noticed one"
        disabled={count >= sense.target || skipped}
        onPress={() => updateCount(count + 1)}
      />
      {count > 0 && (
        <ActionButton
          label="Undo"
          variant="quiet"
          onPress={() => {
            updateCount(count - 1);
            updateSkipped(false);
          }}
        />
      )}
      {index > 0 && (
        <ActionButton
          label="Previous sense"
          variant="secondary"
          onPress={() => run.setStep((value) => Math.max(0, value - 1))}
        />
      )}
      <ActionButton
        label={index === senses.length - 1 ? 'Finish' : 'Continue'}
        disabled={!canContinue}
        onPress={() => (index === senses.length - 1 ? finish() : run.setStep((value) => value + 1))}
      />
      {!skipped && (
        <ActionButton label="Skip this sense" variant="quiet" onPress={() => updateSkipped(true)} />
      )}
      {skipped && (
        <ActionButton label="Undo skip" variant="quiet" onPress={() => updateSkipped(false)} />
      )}
      <ActionButton label="Leave activity" variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );
}
