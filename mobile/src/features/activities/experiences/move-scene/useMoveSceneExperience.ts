import React from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { createLocalActivityRun, finishLocalActivityRun, type LocalActivityRun } from '../../runtime/activityEngine';
import type { ActivityOrigin } from '../../runtime/contracts';
import { loadMoveScenePreferences, saveMoveScenePreferences, type MoveChoice, type MoveScenePreferences } from './preferences';

export type MoveScenePhase = 'loading' | 'intro' | 'choose' | 'prepare' | 'away' | 'returned' | 'done';
const labels: Record<MoveChoice, string> = {
  walk: 'A short walk', move_here: 'Gentle movement here', change_spot: 'Change to another spot', custom: 'My own break', stay: 'Stay right here',
};
const describeDuration = (milliseconds: number) => {
  const minutes = Math.floor(milliseconds / 60000);
  return minutes < 1 ? 'Less than a minute' : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};

export function useMoveSceneExperience(origin: ActivityOrigin) {
  const [phase, setPhase] = React.useState<MoveScenePhase>('loading');
  const [preferences, setPreferences] = React.useState<MoveScenePreferences>({ rememberChoice: false, showElapsed: false, audioCue: false });
  const [choice, setChoiceState] = React.useState<MoveChoice>();
  const [customText, setCustomText] = React.useState('');
  const [elapsed, setElapsed] = React.useState<string>();
  const [status, setStatus] = React.useState('');
  const [run, setRun] = React.useState<LocalActivityRun>();
  const [runId] = React.useState(() => randomUUID());
  const phaseRef = React.useRef<MoveScenePhase>('loading');
  const awayStartedAt = React.useRef<{ wall: number; monotonic?: number } | undefined>(undefined);
  const lastAppState = React.useRef(AppState.currentState);

  const moveTo = React.useCallback((next: MoveScenePhase) => { phaseRef.current = next; setPhase(next); }, []);
  React.useEffect(() => {
    let live = true;
    void loadMoveScenePreferences().then((saved) => {
      if (!live) return;
      setPreferences(saved);
      setChoiceState(saved.preferredChoice);
      moveTo(origin === 'talk' ? 'choose' : 'intro');
    }).catch(() => {
      if (!live) return;
      setStatus('Your saved break settings could not be opened. You can still choose an option.');
      moveTo(origin === 'talk' ? 'choose' : 'intro');
    });
    return () => { live = false; };
  }, [moveTo, origin]);

  const persist = React.useCallback((next: MoveScenePreferences) => {
    setPreferences(next);
    void saveMoveScenePreferences(next).catch(() => setStatus('This setting applies for now, but could not be saved on this device.'));
  }, []);
  const choose = React.useCallback((next: MoveChoice) => {
    setChoiceState(next);
    if (preferences.rememberChoice) persist({ ...preferences, preferredChoice: next });
  }, [persist, preferences]);
  const togglePreference = React.useCallback((key: 'rememberChoice' | 'showElapsed' | 'audioCue', value: boolean) => {
    const next = { ...preferences, [key]: value };
    if (key === 'rememberChoice') next.preferredChoice = value ? choice : undefined;
    persist(next);
  }, [choice, persist, preferences]);

  const finish = React.useCallback((state: 'completed' | 'skipped' | 'stopped') => {
    setRun((current) => current?.state === 'started' ? finishLocalActivityRun(current, state) : current);
    moveTo('done');
  }, [moveTo]);

  const returnFromAway = React.useCallback(() => {
    if (phaseRef.current !== 'away') return;
    const start = awayStartedAt.current;
    if (preferences.showElapsed && start) {
      const wallDelta = Date.now() - start.wall;
      const monotonicNow = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : undefined;
      const monoDelta = monotonicNow === undefined || start.monotonic === undefined ? undefined : monotonicNow - start.monotonic;
      const reliable = Number.isFinite(wallDelta) && wallDelta >= 0 && wallDelta < 24 * 60 * 60_000 &&
        Number.isFinite(monoDelta) && monoDelta! >= 0 && Math.abs(wallDelta - monoDelta!) <= 120_000;
      setElapsed(reliable ? describeDuration(wallDelta) : undefined);
    } else setElapsed(undefined);
    moveTo('returned');
  }, [moveTo, preferences.showElapsed]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const previous = lastAppState.current;
      lastAppState.current = next;
      if (next === 'active' && previous !== 'active' && phaseRef.current === 'away') returnFromAway();
    });
    return () => sub.remove();
  }, [returnFromAway]);

  const startBreak = React.useCallback(() => {
    if (!choice) return;
    setRun(createLocalActivityRun(runId, 'short_movement'));
    awayStartedAt.current = { wall: Date.now(), monotonic: typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : undefined };
    setElapsed(undefined); moveTo('away');
  }, [choice, moveTo, runId]);

  const skip = React.useCallback(() => {
    const created = createLocalActivityRun(runId, 'short_movement');
    setRun(finishLocalActivityRun(created, 'skipped'));
    moveTo('done');
  }, [moveTo, runId]);

  const stop = React.useCallback(() => { finish('stopped'); }, [finish]);
  const complete = React.useCallback(() => { finish('completed'); }, [finish]);
  const confirmChoice = React.useCallback(() => { if (choice) moveTo('prepare'); }, [choice, moveTo]);
  const title = choice ? choice === 'custom' && customText.trim() ? customText.trim() : labels[choice] : '';

  return { phase, preferences, choice, customText, elapsed, status, run, title, moveTo, choose, setCustomText, togglePreference, confirmChoice, startBreak, returnFromAway, skip, stop, complete };
}

export type MoveSceneExperience = ReturnType<typeof useMoveSceneExperience>;
