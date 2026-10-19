import React from 'react';
import {
  AccessibilityInfo,
  AppState,
  BackHandler,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { ActionButton, Eyebrow, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { useInterventionRun } from '../hooks/useInterventionRun';

type RunState = ReturnType<typeof useInterventionRun>;
type Pace = 'four' | 'three' | 'own';

const phaseMs = (pace: Pace) => (pace === 'four' ? 4000 : 3000);
const roundMs = (pace: Pace) => phaseMs(pace) * 2 * 5;
function clockNow() {
  const clock = globalThis as typeof globalThis & { performance?: { now: () => number } };
  return clock.performance?.now() ?? Date.now();
}

export function PacedBreathingPanel({ run, origin, onBack }: { run: RunState; origin: string; onBack: () => void }) {
  const [pace, setPace] = React.useState<Pace>('four');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [clockRunning, setClockRunning] = React.useState(false);
  const [locallyPaused, setLocallyPaused] = React.useState(false);
  const [roundComplete, setRoundComplete] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [readyRequested, setReadyRequested] = React.useState(false);
  const elapsedRef = React.useRef(0);
  const segmentStartRef = React.useRef(0);
  const hasStartedRef = React.useRef(false);
  const lastDisplayedSecondRef = React.useRef(-1);
  const motionProgress = useAnimatedValue(0);
  const active = run.intervention?.id === 'paced_breathing';
  const duration = phaseMs(pace);
  const ownPace = pace === 'own';
  const inBreathingRun = active && run.phase === 'active';

  React.useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  React.useEffect(() => {
    if (reduceMotion) motionProgress.setValue(0.5);
  }, [motionProgress, reduceMotion]);

  const startRound = React.useCallback((nextPace = pace) => {
    elapsedRef.current = 0;
    segmentStartRef.current = clockNow();
    setElapsedMs(0);
    lastDisplayedSecondRef.current = -1;
    setRoundComplete(false);
    setLocallyPaused(false);
    setClockRunning(nextPace !== 'own');
    motionProgress.setValue(0);
  }, [motionProgress, pace]);

  React.useEffect(() => {
    if (!inBreathingRun) return;
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startRound();
    } else if (locallyPaused && !roundComplete) {
      const timer = setTimeout(() => {
        setLocallyPaused(false);
        segmentStartRef.current = clockNow();
        setClockRunning(!ownPace);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [inBreathingRun, locallyPaused, ownPace, roundComplete, startRound]);

  React.useEffect(() => {
    if (!clockRunning || !inBreathingRun) return;
    const timer = setInterval(() => {
      const now = clockNow();
      const nextElapsed = elapsedRef.current + now - segmentStartRef.current;
      if (nextElapsed >= roundMs(pace)) {
        elapsedRef.current = roundMs(pace);
        setElapsedMs(roundMs(pace));
        setClockRunning(false);
        setRoundComplete(true);
        motionProgress.setValue(0.5);
        return;
      }
      const displayedSecond = Math.floor(nextElapsed / 1000);
      if (displayedSecond !== lastDisplayedSecondRef.current) {
        lastDisplayedSecondRef.current = displayedSecond;
        setElapsedMs(nextElapsed);
      }
      const phasePosition = (nextElapsed % (duration * 2)) / duration;
      const progress = phasePosition < 1 ? phasePosition : 2 - phasePosition;
      if (!reduceMotion) motionProgress.setValue(progress);
    }, 50);
    return () => clearInterval(timer);
  }, [clockRunning, duration, inBreathingRun, motionProgress, pace, reduceMotion]);

  const pause = React.useCallback(() => {
    if (clockRunning) {
      const now = clockNow();
      const total = Math.min(roundMs(pace), elapsedRef.current + now - segmentStartRef.current);
      elapsedRef.current = total;
      setElapsedMs(total);
      setClockRunning(false);
    }
    setLocallyPaused(true);
    run.pauseActivity();
  }, [clockRunning, pace, run]);

  React.useEffect(() => {
    if (!inBreathingRun || ownPace || roundComplete) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') pause();
    });
    return () => subscription.remove();
  }, [inBreathingRun, ownPace, pause, roundComplete]);

  React.useEffect(() => {
    if (!inBreathingRun || roundComplete) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      pause();
      return true;
    });
    return () => subscription.remove();
  }, [inBreathingRun, pause, roundComplete]);

  if (!active || !['ready', 'active'].includes(run.phase)) return null;

  const phaseIndex = Math.floor(elapsedMs / duration) % 2;
  const cycle = Math.min(5, Math.floor(elapsedMs / (duration * 2)) + 1);
  const withinPhase = elapsedMs % duration;
  const remaining = Math.max(1, Math.ceil((duration - withinPhase) / 1000));
  const phaseLabel = phaseIndex === 0 ? 'Breathe in gently' : 'Breathe out gently';
  const destination = origin === 'talk' ? 'Talk' : 'Actions';
  const shapeSize = reduceMotion
    ? 92
    : motionProgress.interpolate({ inputRange: [0, 1], outputRange: [92, 174] });

  function choosePace(value: Pace) {
    setPace(value);
    setSettingsOpen(false);
    if (inBreathingRun) startRound(value);
  }

  if (run.phase === 'ready') return (
    <ActivityPanel style={{ gap: 14 }}>
      <BreathingShape reduceMotion />
      <Eyebrow>FOLLOW A COMFORTABLE RHYTHM</Eyebrow>
      <Text style={ui.heading}>Follow a comfortable rhythm, or breathe at your own pace.</Text>
      <Text style={ui.muted}>Breathe gently without forcing it. Stop anytime if it feels uncomfortable.</Text>
      <ActionButton label={`Pace settings · ${pace === 'four' ? '4 in / 4 out' : pace === 'three' ? '3 in / 3 out' : 'Own pace'}`} variant="secondary" onPress={() => setSettingsOpen((value) => !value)} />
      {settingsOpen && <PaceChoices selected={pace} onChoose={choosePace} />}
      <ActionButton label="Start" loading={run.busy} onPress={() => { setReadyRequested(true); void run.startActivity(); }} />
      <ActionButton label="Return to where you came from" variant="quiet" onPress={onBack} />
      {readyRequested && run.phase === 'ready' && !!run.status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.status}</Text>}
    </ActivityPanel>
  );

  if (roundComplete) return (
    <ActivityPanel style={{ gap: 14 }}>
      <BreathingShape reduceMotion />
      <Eyebrow>ROUND COMPLETE</Eyebrow>
      <Text style={ui.heading}>This round is over.</Text>
      <Text style={ui.muted}>There is no need to feel a certain way. Continue whenever you are ready.</Text>
      <ActionButton label="Another round" variant="secondary" onPress={() => startRound()} />
      <ActionButton label="Finish" onPress={() => void run.finishRun('completed')} />
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (ownPace) return (
    <ActivityPanel style={{ gap: 14 }}>
      <BreathingShape reduceMotion />
      <Eyebrow>OWN PACE</Eyebrow>
      <Text accessibilityLiveRegion="polite" style={ui.heading}>Breathe comfortably.</Text>
      <Text style={ui.muted}>No timer or cycle count. Pause or stop whenever you like.</Text>
      <ActionButton label="Pace settings" variant="secondary" onPress={() => setSettingsOpen((value) => !value)} />
      {settingsOpen && <PaceChoices selected={pace} onChoose={choosePace} />}
      <ActionButton label="Pause" onPress={pause} />
      <ActionButton label="Done" variant="quiet" onPress={() => setRoundComplete(true)} />
    </ActivityPanel>
  );

  return (
    <ActivityPanel style={{ gap: 14 }}>
      <Eyebrow>GUIDED RHYTHM · CYCLE {cycle} OF 5</Eyebrow>
      <Text accessibilityLiveRegion="polite" style={[ui.heading, { textAlign: 'center' }]}>{phaseLabel}</Text>
      <View accessibilityElementsHidden style={{ height: 214, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 196, height: 196, borderRadius: 98, borderWidth: 2, borderColor: '#91A895', backgroundColor: '#F2F5EF', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: shapeSize, height: shapeSize, borderRadius: 100, backgroundColor: '#DCE8DB', borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            {reduceMotion && <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, transform: [{ translateX: phaseIndex === 0 ? -18 : 18 }] }} />}
          </View>
        </View>
      </View>
      <Text accessibilityLabel={`${remaining} seconds in this phase`} style={[ui.label, { textAlign: 'center' }]}>{remaining}</Text>
      {reduceMotion && <Text style={[ui.muted, { textAlign: 'center' }]}>Still shape · phase indicator changes with the guide</Text>}
      <ActionButton label="Pause" onPress={pause} />
      <ActionButton label="Change pace" variant="secondary" onPress={() => setSettingsOpen((value) => !value)} />
      {settingsOpen && <PaceChoices selected={pace} onChoose={choosePace} />}
      <ActionButton label="Finish" variant="quiet" onPress={() => void run.finishRun('completed')} />
    </ActivityPanel>
  );
}

function PaceChoices({ selected, onChoose }: { selected: Pace; onChoose: (pace: Pace) => void }) {
  return (
    <View style={{ gap: 8 }} accessibilityLabel="Choose a comfortable pace">
      {([
        ['four', '4 seconds in / 4 seconds out · 5 cycles'],
        ['three', '3 seconds in / 3 seconds out · 5 cycles'],
        ['own', 'Own pace · no timer or cycle count'],
      ] as const).map(([value, label]) => (
        <ActionButton key={value} label={`${selected === value ? '✓ ' : ''}${label}`} variant={selected === value ? 'primary' : 'secondary'} onPress={() => onChoose(value)} />
      ))}
    </View>
  );
}

function BreathingShape({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View accessibilityElementsHidden style={{ height: 190, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: '#91A895', backgroundColor: '#F2F5EF', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#DCE8DB', borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          {reduceMotion && <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent }} />}
        </View>
      </View>
    </View>
  );
}
