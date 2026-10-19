import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { ActionButton, Eyebrow, Surface, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { OneSmallStepIllustration } from './OneSmallStepIllustration';

type RunState = ReturnType<typeof useInterventionRun>;
type Bucket = 'now' | 'later' | 'not_now';
const examples = [
  'Open the presentation and write one heading.',
  'Reply with one sentence to confirm I saw the message.',
  'Put the items I need on the table without starting yet.',
  'Spend 2 minutes listing just the rough bullet points.',
];
const bucketLabels: { key: Bucket; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: 'later', label: 'Later' },
  { key: 'not_now', label: 'Not now' },
];

export function OneSmallStepPanel({ run, onBack }: { run: RunState; onBack: () => void }) {
  const [examplesOpen, setExamplesOpen] = React.useState(false);
  const [triedThisMove, setTriedThisMove] = React.useState<boolean>();
  if (run.phase !== 'active' || run.activeId !== 'one_small_step') return null;

  const updateSlip = (id: string, patch: Partial<{ text: string; bucket: Bucket }>) => {
    const prior = run.taskSlips.find((slip) => slip.id === id);
    if (patch.text !== undefined && prior?.text.trim() === run.selectedTask.trim()) run.setSelectedTask(patch.text);
    run.setTaskSlips((current) => current.map((slip) => slip.id === id ? { ...slip, ...patch } : slip));
  };
  const removeSlip = (id: string) => {
    const prior = run.taskSlips.find((slip) => slip.id === id);
    if (prior?.text.trim() === run.selectedTask.trim()) run.setSelectedTask('');
    run.setTaskSlips((current) => current.filter((slip) => slip.id !== id));
  };
  const taskText = run.selectedTask;
  const setStage = (step: number) => run.setStep(() => step);
  const continueFromTasks = () => {
    if (taskText.trim()) setStage(2);
  };
  const tryStatus = triedThisMove === undefined ? '' : triedThisMove ? 'You marked that you tried the first move.' : 'You marked that you did not try it this time.';

  if (run.step === 0) {
    return (
      <ActivityPanel style={{ gap: 13 }}>
        <OneSmallStepIllustration />
        <Eyebrow>CHOOSE A STARTING PATH</Eyebrow>
        <Text style={ui.heading}>Make one thing easier to start.</Text>
        <ActionButton label="Too many things" onPress={() => {
          run.setSmallStepMode('many');
          run.setTaskSlips([{ id: randomUUID(), text: '', bucket: 'now' }]);
          run.setStep(() => 1);
        }} />
        <ActionButton label="I know the task" variant="secondary" onPress={() => {
          run.setSmallStepMode('known');
          run.setSelectedTask('');
          run.setStep(() => 1);
        }} />
        <ActionButton label="Return to Actions" variant="quiet" onPress={onBack} />
      </ActivityPanel>
    );
  }

  if (run.step === 1) {
    return (
      <ActivityPanel style={{ gap: 13 }}>
        <Eyebrow>{run.smallStepMode === 'many' ? 'TASK SLIPS' : 'YOUR TASK'}</Eyebrow>
        <Text style={ui.heading}>{run.smallStepMode === 'many' ? 'What is taking up space?' : 'What task do you want to start?'}</Text>
        {run.smallStepMode === 'known' ? (
          <TextInput accessibilityLabel="Task you want to start" value={run.selectedTask} onChangeText={run.setSelectedTask} placeholder="Name the task" style={ui.input} />
        ) : (
          <>
            <Text style={ui.muted}>Add only what you want to work with here. This list stays temporary.</Text>
            {run.taskSlips.map((slip, index) => (
              <Surface key={slip.id} style={{ gap: 8 }}>
                <TextInput accessibilityLabel={`Task slip ${index + 1}`} value={slip.text} onChangeText={(text) => updateSlip(slip.id, { text })} placeholder="One task" style={ui.input} />
                <Text style={ui.muted}>Optional: place this task in a bucket</Text>
                {bucketLabels.map((bucket) => (
                  <ActionButton key={bucket.key} label={bucket.label} variant={slip.bucket === bucket.key ? 'primary' : 'secondary'} onPress={() => updateSlip(slip.id, { bucket: bucket.key })} />
                ))}
                {!!slip.text.trim() && <ActionButton label="Choose this task" variant="outline" onPress={() => run.setSelectedTask(slip.text.trim())} />}
                {run.selectedTask === slip.text.trim() && !!slip.text.trim() && <Text accessibilityLiveRegion="polite" style={ui.muted}>Selected for your first move</Text>}
                {run.taskSlips.length > 1 && <ActionButton label="Remove task slip" variant="quiet" onPress={() => removeSlip(slip.id)} />}
              </Surface>
            ))}
            <ActionButton label="Add another" variant="secondary" onPress={() => run.setTaskSlips((current) => [...current, { id: randomUUID(), text: '', bucket: 'now' }])} />
          </>
        )}
        <ActionButton label="Continue" disabled={!taskText.trim()} onPress={continueFromTasks} />
        <ActionButton label="Back" variant="quiet" onPress={() => setStage(0)} />
        <ActionButton label="Leave activity" variant="quiet" onPress={onBack} />
      </ActivityPanel>
    );
  }

  if (run.step === 2) {
    return (
      <ActivityPanel style={{ gap: 13 }}>
        <Eyebrow>MAKE THE FIRST MOVE SMALLER</Eyebrow>
        <Text style={ui.muted}>Task</Text>
        <Text style={ui.heading}>{run.selectedTask}</Text>
        <Text style={ui.label}>What is the first small move?</Text>
        <TextInput accessibilityLabel="First small move" value={run.tinyStep} onChangeText={run.setTinyStep} placeholder="One clear action" style={[ui.input, { minHeight: 76 }]} />
        <ActionButton label={examplesOpen ? 'Hide examples' : 'Need an example?'} variant="quiet" onPress={() => setExamplesOpen((open) => !open)} />
        {examplesOpen && <View style={{ gap: 7 }}>{examples.map((example) => <ActionButton key={example} label={example} variant="secondary" onPress={() => run.setTinyStep(example)} />)}</View>}
        <TextInput accessibilityLabel="When would this fit? Optional" value={run.smallStepCue} onChangeText={run.setSmallStepCue} placeholder="When would this fit? (Optional)" style={ui.input} />
        <Text style={ui.muted}>This cue is saved as text only. Mira will not set a reminder.</Text>
        <ActionButton label="Make my action card" disabled={!run.tinyStep.trim()} onPress={() => setStage(3)} />
        <ActionButton label="Back to tasks" variant="quiet" onPress={() => setStage(1)} />
        <ActionButton label="Leave activity" variant="quiet" onPress={onBack} />
      </ActivityPanel>
    );
  }

  if (run.step === 4) {
    return (
      <ActivityPanel style={{ gap: 13 }}>
        <Eyebrow>YOUR CHOICE</Eyebrow>
        <Text style={ui.heading}>Try the first move, if you want.</Text>
        <Text style={ui.body}>{run.tinyStep}</Text>
        {!!run.smallStepCue && <Text style={ui.muted}>When you chose: {run.smallStepCue}</Text>}
        <Text style={ui.muted}>Come back whenever you are ready.</Text>
        <ActionButton label="I’m back" onPress={() => setStage(5)} />
        <ActionButton label="Return to Actions" variant="quiet" onPress={onBack} />
      </ActivityPanel>
    );
  }

  if (run.step === 5) {
    return (
      <ActivityPanel style={{ gap: 13 }}>
        <Eyebrow>CHECK IN</Eyebrow>
        <Text style={ui.heading}>Did you try the first move?</Text>
        <Text style={ui.body}>This is just your check-in. Mira cannot tell what happened away from the app.</Text>
        <ActionButton label="I tried it" onPress={() => { setTriedThisMove(true); setStage(3); }} />
        <ActionButton label="I didn’t try it this time" variant="secondary" onPress={() => { setTriedThisMove(false); setStage(3); }} />
        <ActionButton label="Back to the card" variant="quiet" onPress={() => setStage(3)} />
      </ActivityPanel>
    );
  }

  return (
    <ActivityPanel style={{ gap: 13 }}>
      <OneSmallStepIllustration />
      <Eyebrow>YOUR NEXT ACTION</Eyebrow>
      <Text style={ui.muted}>Task</Text>
      <Text style={ui.heading}>{run.selectedTask || 'Your task'}</Text>
      <Text style={ui.label}>First move</Text>
      <Text style={ui.body}>{run.tinyStep}</Text>
      {!!run.smallStepCue && <Text style={ui.muted}>When: {run.smallStepCue}</Text>}
      {!!tryStatus && <Text accessibilityLiveRegion="polite" style={ui.muted}>{tryStatus}</Text>}
      <ActionButton label="Try now" onPress={() => setStage(4)} />
      <ActionButton label={run.continueSaved ? 'Update in Continue' : 'Keep in Actions'} variant="secondary" loading={run.busy} onPress={() => run.confirmKeepInActions(run.tinyStep, { source_task: run.selectedTask, cue: run.smallStepCue })} />
      {!!run.localStatus && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.localStatus}</Text>}
      <ActionButton label="Edit first move" variant="outline" onPress={() => setStage(2)} />
      <ActionButton label="Return to Actions" variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );
}
