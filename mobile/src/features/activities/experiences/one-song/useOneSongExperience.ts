import React from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { stageQuietTalkReturn } from '../../../../shared/musicHandoff';
import { createLocalActivityRun, finishLocalActivityRun, type LocalActivityRun } from '../../runtime/activityEngine';
import type { ActivityOrigin } from '../../runtime/contracts';
import { loadPreferredSoundscape, savePreferredSoundscape } from './preferences';
import type { SoundscapeId } from './soundscapeData';

export type OneSongPhase = 'loading' | 'intro' | 'scenes' | 'soundscape' | 'external' | 'handoff' | 'away' | 'returned' | 'done';

export function useOneSongExperience(origin: ActivityOrigin) {
  const [phase, setPhase] = React.useState<OneSongPhase>('loading');
  const [preferredScene, setPreferredScene] = React.useState<SoundscapeId>();
  const [scene, setScene] = React.useState<SoundscapeId>();
  const [externalSource, setExternalSource] = React.useState<'manual' | 'link'>('manual');
  const [linkText, setLinkText] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [run, setRun] = React.useState<LocalActivityRun>();
  const [runId] = React.useState(() => randomUUID());
  const phaseRef = React.useRef<OneSongPhase>('loading');
  const appStateRef = React.useRef(AppState.currentState);

  const moveTo = React.useCallback((next: OneSongPhase) => { phaseRef.current = next; setPhase(next); }, []);
  React.useEffect(() => {
    let live = true;
    void loadPreferredSoundscape().then((preferred) => {
      if (!live) return;
      setPreferredScene(preferred); setScene(preferred); moveTo('intro');
    }).catch(() => { if (live) { setStatus('The saved sound choice could not be opened. All scenes are still available.'); moveTo('intro'); } });
    return () => { live = false; };
  }, [moveTo]);

  const selectScene = React.useCallback((next: SoundscapeId) => { setScene(next); setStatus(''); moveTo('soundscape'); }, [moveTo]);
  const selectPreferred = React.useCallback(async (next: SoundscapeId | undefined) => {
    try { await savePreferredSoundscape(next); setPreferredScene(next); setStatus(next ? 'Your preferred scene is saved on this device.' : 'Your preferred scene was cleared.'); }
    catch { setStatus('This choice could not be saved on this device.'); }
  }, []);
  const selectExternal = React.useCallback(() => { setStatus(''); setLinkText(''); setExternalSource('manual'); moveTo('external'); }, [moveTo]);
  const beginExternal = React.useCallback(() => {
    setRun(createLocalActivityRun(runId, 'one_song_break'));
    if (origin === 'talk') stageQuietTalkReturn();
    moveTo('away');
  }, [moveTo, origin, runId]);
  const openHandoff = React.useCallback(() => moveTo('handoff'), [moveTo]);
  const returnToHandoff = React.useCallback(() => moveTo('handoff'), [moveTo]);
  const returnFromExternal = React.useCallback(() => { if (phaseRef.current === 'away') moveTo('returned'); }, [moveTo]);
  const finish = React.useCallback((state: 'completed' | 'stopped' | 'skipped') => {
    setRun((current) => current?.state === 'started' ? finishLocalActivityRun(current, state) : current);
    moveTo('done');
  }, [moveTo]);
  const startSoundscape = React.useCallback(() => {
    if (!run) setRun(createLocalActivityRun(runId, 'one_song_break'));
  }, [run, runId]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const previous = appStateRef.current; appStateRef.current = next;
      if (next === 'active' && previous !== 'active' && phaseRef.current === 'away') moveTo('returned');
    });
    return () => sub.remove();
  }, [moveTo]);

  const completeSoundscape = React.useCallback(() => finish('completed'), [finish]);
  const stopSoundscape = React.useCallback(() => finish('stopped'), [finish]);

  return { phase, scene, preferredScene, externalSource, linkText, status, run, moveTo, selectScene, selectPreferred, selectExternal,
    setExternalSource, setLinkText, beginExternal, openHandoff, returnToHandoff, returnFromExternal,
    report: finish, startSoundscape, completeSoundscape, stopSoundscape, setStatus };
}

export type OneSongExperience = ReturnType<typeof useOneSongExperience>;
