import React from 'react';
import { AppState, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { AwaySessionCard } from './AwaySessionCard';

type RunState = ReturnType<typeof useInterventionRun>;
type Choice = 'walk' | 'move_here' | 'change_spot' | 'custom' | 'skip';
type Stage = 'intro' | 'choose' | 'prepare' | 'away' | 'returned';

const choices: { id: Choice; title: string; detail: string }[] = [
  { id: 'walk', title: 'A short walk', detail: 'Only if walking feels comfortable.' },
  { id: 'move_here', title: 'Move comfortably where I am', detail: 'Seated or gentle movement is fine. Stop if uncomfortable.' },
  { id: 'change_spot', title: 'Change spot', detail: 'Choose another place that feels comfortable.' },
  { id: 'custom', title: 'My own break', detail: 'Choose what would suit you.' },
  { id: 'skip', title: 'Skip / stay where I am', detail: 'No movement is needed.' },
];

const instructions: Record<Choice, string> = {
  walk: 'Choose a nearby route or place that feels comfortable. Stop whenever you like.',
  move_here: 'Choose a gentle movement or stay seated. Stop if anything feels uncomfortable.',
  change_spot: 'Choose a different spot that feels comfortable. There is no need to hurry.',
  custom: 'Take your break in the way you chose. Stop or change your plan whenever you like.',
  skip: 'You can stay where you are. No movement is needed; come back whenever you want.',
};

function restoreChoice(value: string): { choice: Choice; custom: string } | undefined {
  if (value.startsWith('My own break: ')) return { choice: 'custom', custom: value.slice(14) };
  const found = choices.find((item) => item.title === value);
  return found ? { choice: found.id, custom: '' } : undefined;
}

function monotonicNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : undefined;
}

function formatElapsed(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return 'Less than a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function MoveScenePanel({
  run,
  origin,
  onBack,
}: {
  run: RunState;
  origin: string;
  onBack: () => void;
}) {
  const active = run.activeId === 'short_movement';
  const [resumeChoice] = React.useState(() => run.continueSaved ? restoreChoice(run.draft) : undefined);
  const [stage, setStageState] = React.useState<Stage>(resumeChoice ? 'prepare' : run.phase === 'active' ? 'choose' : 'intro');
  const [choice, setChoice] = React.useState<Choice | undefined>(resumeChoice?.choice);
  const [custom, setCustom] = React.useState(resumeChoice?.custom ?? '');
  const [showElapsed, setShowElapsed] = React.useState(false);
  const [elapsed, setElapsed] = React.useState<string>();
  const [startRequested, setStartRequested] = React.useState(false);
  const stageRef = React.useRef<Stage>(resumeChoice ? 'prepare' : run.phase === 'active' ? 'choose' : 'intro');
  const choiceRef = React.useRef<Choice | undefined>(resumeChoice?.choice);
  const customRef = React.useRef(resumeChoice?.custom ?? '');
  const startWallRef = React.useRef<number | undefined>(undefined);
  const startMonotonicRef = React.useRef<number | undefined>(undefined);
  const lastAppStateRef = React.useRef(AppState.currentState);
  const returnedRef = React.useRef(false);
  const destination = origin === 'talk' ? 'Talk' : 'Actions';

  function moveTo(next: Stage) {
    stageRef.current = next;
    setStageState(next);
  }

  function setSelectedChoice(next: Choice, nextCustom = customRef.current) {
    choiceRef.current = next;
    customRef.current = nextCustom;
    setChoice(next);
    setCustom(nextCustom);
  }

  const calculateReturn = React.useCallback(() => {
    if (returnedRef.current) return;
    returnedRef.current = true;
    if (!showElapsed || startWallRef.current === undefined || startMonotonicRef.current === undefined) {
      setElapsed(undefined);
    } else {
      const wallDelta = Date.now() - startWallRef.current;
      const monotonic = monotonicNow();
      const monotonicDelta = monotonic === undefined ? undefined : monotonic - startMonotonicRef.current;
      const reliable = Number.isFinite(wallDelta) && Number.isFinite(monotonicDelta) &&
        wallDelta >= 0 && wallDelta <= 24 * 60 * 60_000 && monotonicDelta! >= 0 &&
        Math.abs(wallDelta - monotonicDelta!) <= 120_000;
      setElapsed(reliable ? formatElapsed(wallDelta) : undefined);
    }
    stageRef.current = 'returned';
    setStageState('returned');
  }, [showElapsed]);

  React.useEffect(() => {
    if (!active) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = lastAppStateRef.current;
      lastAppStateRef.current = nextState;
      if (nextState === 'active' && previousState !== 'active' && stageRef.current === 'away') {
        calculateReturn();
      }
    });
    return () => subscription.remove();
  }, [active, calculateReturn]);

  const beginBreak = React.useCallback(() => {
    startWallRef.current = Date.now();
    startMonotonicRef.current = monotonicNow();
    returnedRef.current = false;
    setElapsed(undefined);
    stageRef.current = 'away';
    setStageState('away');
  }, []);

  if (!active || !['ready', 'active'].includes(run.phase)) return null;

  function selectedText(selected = choice, ownText = custom) {
    if (!selected) return '';
    if (selected === 'custom') {
      const ownBreak = ownText.trim();
      return `My own break: ${ownBreak || 'A personal break'}`;
    }
    return choices.find((item) => item.id === selected)?.title ?? '';
  }

  function startActivity() {
    if (run.continueSaved) {
      const restored = restoreChoice(run.draft);
      if (restored) {
        setSelectedChoice(restored.choice, restored.custom);
        moveTo('prepare');
      } else {
        moveTo('choose');
      }
    } else {
      moveTo('choose');
    }
    setStartRequested(true);
    void run.startActivity();
  }

  function requestSave() {
    const value = selectedText(choiceRef.current, customRef.current);
    if (!value || choiceRef.current === 'skip') return;
    run.confirmKeepInActions(value, undefined, {
      title: run.continueSaved ? 'Update this break choice?' : 'Keep this break choice in Continue?',
      message: run.continueSaved
        ? 'Update this choice saved on this device in Actions > Continue? It will not create a recurring reminder.'
        : 'Save this choice on this device in Actions > Continue for you to choose later? This will not create a recurring reminder.',
      confirmLabel: run.continueSaved ? 'Update choice' : 'Keep in Continue',
    });
  }

  if (run.phase === 'ready') return (
    <ActivityPanel style={{ gap: 13 }}>
      <SceneIllustration />
      <Eyebrow>TAKE A BREAK, IF YOU WANT</Eyebrow>
      <Text style={ui.heading}>Would a change of pace fit right now?</Text>
      <Text style={ui.muted}>Choose what feels accessible. Movement is optional.</Text>
      <ActionButton label="Start" loading={run.busy} onPress={startActivity} />
      {startRequested && run.phase === 'ready' && !!run.status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.status}</Text>}
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stage === 'choose') return (
    <ActivityPanel style={{ gap: 12 }}>
      <Eyebrow>CHOOSE A COMFORTABLE OPTION</Eyebrow>
      <Text style={ui.heading}>What kind of break would fit?</Text>
      {choices.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.detail}`}
          accessibilityState={{ selected: choice === item.id }}
          onPress={() => setSelectedChoice(item.id)}
          style={{ borderWidth: 1, borderColor: choice === item.id ? colors.accent : colors.line, backgroundColor: choice === item.id ? colors.accentSoft : colors.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 74 }}
        >
          <OptionIllustration choice={item.id} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={ui.label}>{item.title}</Text>
            <Text style={ui.muted}>{item.detail}</Text>
          </View>
        </Pressable>
      ))}
      {choice === 'custom' && (
        <TextInput
          accessibilityLabel="Describe your own break, optional"
          value={custom}
          onChangeText={(value) => setSelectedChoice('custom', value)}
          maxLength={120}
          placeholder="What would feel comfortable? (Optional)"
          style={ui.input}
        />
      )}
      <ActionButton label="Continue" disabled={!choice} onPress={() => moveTo('prepare')} />
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stage === 'prepare') {
    const selected = choice ?? 'skip';
    return (
      <ActivityPanel style={{ gap: 13 }}>
        <SceneIllustration />
        <Eyebrow>BEFORE YOU START</Eyebrow>
        <Text style={ui.heading}>{choices.find((item) => item.id === selected)?.title}</Text>
        <Text style={ui.body}>{instructions[selected]}</Text>
        {selected === 'custom' && !!custom.trim() && <Text style={ui.muted}>{custom.trim()}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Text style={ui.label}>Show an elapsed clock</Text>
          <Switch
            accessibilityLabel="Show an elapsed clock"
            value={showElapsed}
            onValueChange={setShowElapsed}
            trackColor={{ false: colors.line, true: colors.accentSoft }}
            thumbColor={showElapsed ? colors.accent : '#FFFFFF'}
          />
        </View>
        <ActionButton label="Start my break" onPress={beginBreak} />
        <ActionButton label="Choose a different break" variant="secondary" onPress={() => moveTo('choose')} />
        <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
      </ActivityPanel>
    );
  }

  if (stage === 'away') return (
    <View style={{ gap: 12 }}>
      <AwaySessionCard
        headline="You can put your phone away. Come back whenever."
        detail="There is nothing to watch or keep track of here."
      />
      <ActionButton label="I’m back" onPress={calculateReturn} />
    </View>
  );

  return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>WELCOME BACK</Eyebrow>
      <Text style={ui.heading}>What would you like to report?</Text>
      {!!elapsed && <Text style={ui.muted}>Time since you started: {elapsed}</Text>}
      <Text style={ui.body}>You chose: {selectedText()}</Text>
      {choice !== 'skip' && (
        <ActionButton
          label={run.continueSaved ? 'Update choice in Continue' : 'Keep this choice in Continue'}
          variant="secondary"
          loading={run.busy}
          onPress={requestSave}
        />
      )}
      {!!run.localStatus && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.localStatus}</Text>}
      <ActionButton label="Return" onPress={() => void run.finishRun('completed')} />
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={() => void run.finishRun('stopped').then(onBack)} />
    </ActivityPanel>
  );
}

function SceneIllustration() {
  return (
    <View accessibilityElementsHidden style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 116, height: 96, borderWidth: 2, borderColor: '#9EAF9D', borderTopLeftRadius: 60, borderTopRightRadius: 60, borderBottomWidth: 0, padding: 11, justifyContent: 'flex-end' }}>
        <View style={{ flex: 1, borderWidth: 1.5, borderColor: '#C5D0C1', borderTopLeftRadius: 48, borderTopRightRadius: 48, flexDirection: 'row', overflow: 'hidden' }}>
          <View style={{ flex: 1, backgroundColor: '#EDF1E8', borderRightWidth: 1, borderColor: '#C5D0C1' }} />
          <View style={{ flex: 1, backgroundColor: '#F8F6EF' }} />
        </View>
        <View style={{ height: 3, backgroundColor: '#9EAF9D', marginHorizontal: -7 }} />
      </View>
    </View>
  );
}

function OptionIllustration({ choice }: { choice: Choice }) {
  const ink = colors.accent;
  const soft = '#A9BBA8';
  return (
    <View accessibilityElementsHidden style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDF1E8', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C5D0C1' }}>
      {choice === 'walk' && <>
        <View style={{ position: 'absolute', width: 8, height: 14, left: 11, top: 8, borderRadius: 6, backgroundColor: ink, transform: [{ rotate: '-28deg' }] }} />
        <View style={{ position: 'absolute', width: 8, height: 14, left: 24, top: 20, borderRadius: 6, backgroundColor: soft, transform: [{ rotate: '-28deg' }] }} />
      </>}
      {choice === 'move_here' && <>
        <View style={{ position: 'absolute', width: 8, height: 8, top: 7, left: 18, borderRadius: 4, backgroundColor: ink }} />
        <View style={{ position: 'absolute', width: 4, height: 13, top: 16, left: 20, borderRadius: 3, backgroundColor: ink }} />
        <View style={{ position: 'absolute', width: 14, height: 3, top: 25, left: 15, borderRadius: 2, backgroundColor: soft }} />
        <View style={{ position: 'absolute', width: 3, height: 8, top: 27, left: 16, borderRadius: 2, backgroundColor: soft }} />
        <View style={{ position: 'absolute', width: 3, height: 8, top: 27, left: 25, borderRadius: 2, backgroundColor: soft }} />
      </>}
      {choice === 'change_spot' && <View style={{ width: 19, height: 26, borderWidth: 2, borderColor: ink, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomWidth: 0, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 3 }}>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: soft }} />
      </View>}
      {choice === 'custom' && <>
        <View style={{ position: 'absolute', width: 15, height: 9, left: 8, top: 13, borderTopLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: soft, transform: [{ rotate: '-34deg' }] }} />
        <View style={{ position: 'absolute', width: 15, height: 9, left: 20, top: 19, borderTopLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: ink, transform: [{ rotate: '145deg' }] }} />
        <View style={{ position: 'absolute', width: 2, height: 22, top: 12, left: 21, backgroundColor: '#7F9A81', transform: [{ rotate: '32deg' }] }} />
      </>}
      {choice === 'skip' && <>
        <View style={{ position: 'absolute', width: 17, height: 3, top: 16, left: 13, borderRadius: 2, backgroundColor: ink }} />
        <View style={{ position: 'absolute', width: 3, height: 15, top: 17, left: 14, borderRadius: 2, backgroundColor: soft }} />
        <View style={{ position: 'absolute', width: 3, height: 15, top: 17, left: 26, borderRadius: 2, backgroundColor: soft }} />
        <View style={{ position: 'absolute', width: 21, height: 3, top: 31, left: 11, borderRadius: 2, backgroundColor: ink }} />
      </>}
    </View>
  );
}
