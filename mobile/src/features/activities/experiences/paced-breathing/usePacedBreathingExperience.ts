import React from 'react';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { AppState, BackHandler, Platform, Vibration } from 'react-native';
import { createLocalActivityRun, finishLocalActivityRun, type LocalActivityRun } from '../../runtime/activityEngine';
import type { ActivityOrigin } from '../../runtime/contracts';
import { loadBreathingPreferences, saveBreathingCues, saveBreathingDefault, type BreathingPreferences, type BreathingRhythm } from './preferences';

const rhythmOptions: Record<BreathingRhythm, { label: string; segments: { phase: 'in' | 'out'; ms: number }[]; cycles: number }> = {
  equal: { label: 'Even · 4 in, 4 out', segments: [{ phase: 'in', ms: 4000 }, { phase: 'out', ms: 4000 }], cycles: 5 },
  longer_exhale: { label: 'Longer exhale · 4 in, 6 out', segments: [{ phase: 'in', ms: 4000 }, { phase: 'out', ms: 6000 }], cycles: 5 },
  double_inhale: { label: 'Two easy inhales · long exhale', segments: [{ phase: 'in', ms: 2500 }, { phase: 'in', ms: 1500 }, { phase: 'out', ms: 6000 }], cycles: 4 },
  own_pace: { label: 'My own pace', segments: [], cycles: 0 },
};

export function usePacedBreathingExperience(origin: ActivityOrigin) {
  const [settings, setSettings] = React.useState<BreathingPreferences>({ defaultRhythm: 'equal', touchCue: false, audioCue: false });
  const [pace, setPace] = React.useState<BreathingRhythm>('equal');
  const [pendingPace, setPendingPace] = React.useState<BreathingRhythm>();
  const [phase, setPhase] = React.useState<'loading' | 'ready' | 'active' | 'paused' | 'round_complete' | 'done'>('loading');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);
  const [manualPhase, setManualPhase] = React.useState<'in' | 'out'>('in');
  const [run, setRun] = React.useState<LocalActivityRun>();
  const [runId] = React.useState(() => randomUUID());
  const startedAt = React.useRef(0);
  const accumulated = React.useRef(0);
  const cueSegment = React.useRef(-1);
  const [cueKey, setCueKey] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    void loadBreathingPreferences().then((loaded) => {
      if (!live) return;
      setSettings(loaded);
      setPace(loaded.defaultRhythm);
      if (origin !== 'talk') setPhase('ready');
      else {
        const nextRun = createLocalActivityRun(runId, 'paced_breathing');
        setRun(nextRun); accumulated.current = 0; startedAt.current = Date.now(); setPhase('active');
      }
    }).catch(() => {
      if (live) {
        setStatus('Saved rhythm settings are unavailable. Using the standard rhythm for now.');
        if (origin !== 'talk') setPhase('ready');
        else { const nextRun = createLocalActivityRun(runId, 'paced_breathing'); setRun(nextRun); startedAt.current = Date.now(); setPhase('active'); }
      }
    });
    return () => { live = false; };
  }, [origin, runId]);

  const start = React.useCallback(() => {
    if (phase !== 'ready') return;
    const nextRun = createLocalActivityRun(runId, 'paced_breathing');
    setRun(nextRun); setElapsed(0); accumulated.current = 0; startedAt.current = Date.now(); cueSegment.current = -1; setPhase('active');
  }, [phase, runId]);

  const pause = React.useCallback(() => {
    if (phase !== 'active') return;
    accumulated.current += Math.max(0, Date.now() - startedAt.current);
    setElapsed(accumulated.current); setPhase('paused');
  }, [phase]);
  const pauseRef = React.useRef(pause);
  React.useEffect(() => { pauseRef.current = pause; }, [pause]);
  useFocusEffect(React.useCallback(() => () => pauseRef.current(), []));
  const resume = React.useCallback(() => { if (phase === 'paused') { startedAt.current = Date.now(); setPhase('active'); } }, [phase]);

  React.useEffect(() => {
    if (phase !== 'active' || pace === 'own_pace') return;
    const interval = setInterval(() => {
      const current = accumulated.current + Date.now() - startedAt.current;
      setElapsed(current);
      const rhythm = rhythmOptions[pace];
      const cycleDuration = rhythm.segments.reduce((sum, segment) => sum + segment.ms, 0);
      if (current >= cycleDuration * rhythm.cycles) { accumulated.current = cycleDuration * rhythm.cycles; setElapsed(accumulated.current); setPhase('round_complete'); return; }
      let within = current % cycleDuration; let segmentIndex = 0;
      while (within >= rhythm.segments[segmentIndex].ms) { within -= rhythm.segments[segmentIndex].ms; segmentIndex += 1; }
      const globalIndex = Math.floor(current / cycleDuration) * rhythm.segments.length + segmentIndex;
      if (globalIndex !== cueSegment.current) { cueSegment.current = globalIndex; setCueKey(globalIndex + 1); }
    }, 100);
    return () => clearInterval(interval);
  }, [pace, phase]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state !== 'active') pause(); });
    return () => sub.remove();
  }, [pause]);
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (phase === 'active') { pause(); return true; } return false; });
    return () => sub.remove();
  }, [pause, phase]);

  const activeDuration = pace === 'own_pace' ? 0 : rhythmOptions[pace].segments.find((segment) => {
    const total = rhythmOptions[pace].segments.reduce((sum, part) => sum + part.ms, 0);
    let elapsedInCycle = elapsed % total;
    for (const part of rhythmOptions[pace].segments) { if (elapsedInCycle < part.ms) return part === segment; elapsedInCycle -= part.ms; }
    return false;
  })?.ms ?? 4000;
  const elapsedInCycle = pace === 'own_pace' ? 0 : elapsed % rhythmOptions[pace].segments.reduce((sum, segment) => sum + segment.ms, 0);
  let remaining = elapsedInCycle; let segmentIndex = 0;
  if (pace !== 'own_pace') while (segmentIndex < rhythmOptions[pace].segments.length - 1 && remaining >= rhythmOptions[pace].segments[segmentIndex].ms) { remaining -= rhythmOptions[pace].segments[segmentIndex].ms; segmentIndex += 1; }
  const currentSegment = pace === 'own_pace' ? undefined : rhythmOptions[pace].segments[segmentIndex];
  const cycleDuration = pace === 'own_pace' ? 0 : rhythmOptions[pace].segments.reduce((sum, segment) => sum + segment.ms, 0);
  const cyclesDone = cycleDuration ? Math.min(rhythmOptions[pace].cycles, Math.floor(elapsed / cycleDuration)) : 0;

  const selectPace = React.useCallback((next: BreathingRhythm) => { if (phase === 'active' || phase === 'paused') setPendingPace(next); else setPace(next); }, [phase]);
  const transitionPace = React.useCallback(() => {
    if (!pendingPace) return;
    const wasActive = phase === 'active'; setPace(pendingPace); setPendingPace(undefined); accumulated.current = 0; setElapsed(0); cueSegment.current = -1;
    if (wasActive) startedAt.current = Date.now();
    setStatus(`Starting ${rhythmOptions[pendingPace].label.toLowerCase()} from a fresh breath.`);
  }, [pendingPace, phase]);
  const saveDefault = React.useCallback(async () => {
    try { await saveBreathingDefault(pace); setSettings((current) => ({ ...current, defaultRhythm: pace })); setStatus('Default rhythm saved on this device.'); }
    catch { setStatus('Could not save the default rhythm on this device.'); }
  }, [pace]);
  const toggleCue = React.useCallback(async (key: 'touchCue' | 'audioCue', value: boolean) => {
    const next = { ...settings, [key]: value }; setSettings(next);
    try { await saveBreathingCues(next); setStatus('Cue preference saved on this device.'); }
    catch { setStatus('Cue is on for this session, but its preference could not be saved.'); }
  }, [settings]);
  const beginAnotherRound = React.useCallback(() => {
    if (phase !== 'round_complete') return;
    accumulated.current = 0; setElapsed(0); startedAt.current = Date.now(); cueSegment.current = -1; setPhase('active');
  }, [phase]);
  const finish = React.useCallback(() => {
    if (run?.state === 'started') setRun(finishLocalActivityRun(run, 'completed'));
    setPhase('done');
  }, [run]);
  const toggleManualPhase = React.useCallback(() => { setManualPhase((value) => value === 'in' ? 'out' : 'in'); setCueKey((value) => value + 1); }, []);
  const cue = React.useCallback(() => {
    if (settings.touchCue && Platform.OS === 'android' && phase === 'active') Vibration.vibrate(14);
  }, [phase, settings.touchCue]);
  React.useEffect(() => { cue(); }, [cueKey, cue]);

  return { phase, pace, pendingPace, settings, settingsOpen, setSettingsOpen, status, elapsed, currentSegment, activeDuration,
    remainingMs: currentSegment ? currentSegment.ms - remaining : 0, cyclesDone, run, start, pause, resume, selectPace,
    transitionPace, saveDefault, toggleCue, beginAnotherRound, finish, manualPhase, toggleManualPhase, cueKey,
    cuePhase: pace === 'own_pace' ? manualPhase : currentSegment?.phase, segmentIndex };
}

export type PacedBreathingExperience = ReturnType<typeof usePacedBreathingExperience>;
