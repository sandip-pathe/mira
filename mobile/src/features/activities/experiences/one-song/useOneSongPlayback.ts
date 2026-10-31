import React from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import { validateMusicLink } from '../../data/musicLink';
import { soundscapes } from './soundscapeData';
import type { OneSongExperience } from './useOneSongExperience';

export function useOneSongPlayback(x: OneSongExperience) {
  const player = useAudioPlaylist({ sources: soundscapes.map((item) => item.source), loop: 'single', updateInterval: 500 });
  const playback = useAudioPlaylistStatus(player);
  const [starting, setStarting] = React.useState(false);
  const [opening, setOpening] = React.useState(false);
  const focused = React.useRef(false);
  const generation = React.useRef(0);
  const phase = React.useRef(x.phase);
  const currentScene = soundscapes.find((item) => item.id === x.scene);
  const index = soundscapes.findIndex((item) => item.id === x.scene);
  const ready = !!currentScene && playback.isLoaded && playback.currentIndex === index;

  const pause = React.useCallback(() => {
    generation.current += 1;
    try {
      void Promise.resolve(player.pause()).catch(() => undefined);
    } catch {
      // The playlist may already be releasing during navigation or cleanup.
    }
    return setAudioModeAsync({ interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => undefined);
  }, [player]);

  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; void pause(); };
  }, [pause]));
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state !== 'active') void pause(); });
    return () => sub.remove();
  }, [pause]);
  React.useEffect(() => {
    if (index >= 0 && playback.isLoaded && index !== playback.currentIndex) {
      void pause(); player.skipTo(index);
    }
  }, [index, pause, playback.currentIndex, playback.isLoaded, player]);
  React.useEffect(() => {
    phase.current = x.phase;
    if (x.phase !== 'soundscape') void pause();
    return () => { void pause(); };
  }, [pause, x.phase, x.scene]);

  async function togglePlayback() {
    if (!ready || starting || opening) return;
    if (playback.playing) { void pause(); return; }
    const request = ++generation.current;
    setStarting(true);
    try {
      try { await setAudioModeAsync({ interruptionMode: 'doNotMix', playsInSilentMode: true, shouldPlayInBackground: false }); }
      catch { if (request === generation.current && focused.current) x.setStatus('Audio settings could not be opened. You can still try the local scene.'); }
      if (request !== generation.current || !focused.current || AppState.currentState !== 'active') return;
      x.startSoundscape(); player.play();
    } catch { if (request === generation.current && focused.current) x.setStatus('This scene could not start. Try Play again or choose another scene.'); }
    finally { setStarting(false); }
  }

  async function openExternalMusic() {
    const link = validateMusicLink(x.linkText);
    if (!link || opening || starting) return;
    setOpening(true);
    const reset = pause();
    const request = generation.current;
    try {
      await reset;
      if (request !== generation.current || !focused.current || AppState.currentState !== 'active') return;
      phase.current = 'away';
      x.beginExternal();
      try { await Linking.openURL(link.url); }
      catch {
        if (focused.current && phase.current === 'away') {
          x.setStatus('This link could not be opened. You can switch apps and choose the song yourself.');
          x.returnToHandoff();
        }
      }
    } finally { setOpening(false); }
  }

  return { playback, currentScene, ready, starting, opening, pause, togglePlayback, openExternalMusic };
}

export type OneSongPlayback = ReturnType<typeof useOneSongPlayback>;
