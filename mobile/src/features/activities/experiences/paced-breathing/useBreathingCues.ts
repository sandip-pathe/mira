import React from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import type { PacedBreathingExperience } from './usePacedBreathingExperience';

function pauseSafely(player: { pause: () => void }) {
  try {
    void Promise.resolve(player.pause()).catch(() => undefined);
  } catch {
    // The player may already be released during navigation or cleanup.
  }
}

/** Keep the existing local inhale/exhale cues scoped to the focused active exercise. */
export function useBreathingCues(experience: PacedBreathingExperience) {
  const inhale = useAudioPlayer(require('../../../../../assets/audio/breath-in.wav'));
  const exhale = useAudioPlayer(require('../../../../../assets/audio/breath-out.wav'));
  const focused = React.useRef(false);
  const generation = React.useRef(0);
  const lastCue = React.useRef(experience.cueKey);

  const stop = React.useCallback(() => {
    generation.current += 1;
    pauseSafely(inhale);
    pauseSafely(exhale);
  }, [exhale, inhale]);

  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; stop(); };
  }, [stop]));

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state !== 'active') stop(); });
    return () => sub.remove();
  }, [stop]);

  React.useEffect(() => {
    if (lastCue.current === experience.cueKey) return;
    lastCue.current = experience.cueKey;
    stop();
    if (!experience.settings.audioCue || experience.phase !== 'active' || !focused.current || AppState.currentState !== 'active') return;
    const request = generation.current;
    const player = experience.cuePhase === 'in' ? inhale : exhale;
    void player.seekTo(0).then(() => {
      if (request === generation.current && focused.current && AppState.currentState === 'active') player.play();
    }).catch(() => undefined);
    return () => { if (request === generation.current) stop(); };
  }, [exhale, experience.cueKey, experience.cuePhase, experience.phase, experience.settings.audioCue, inhale, stop]);

  React.useEffect(() => {
    if (experience.phase !== 'active' || experience.settings.audioCue) stop();
    return () => stop();
  }, [experience.phase, experience.settings.audioCue, stop]);
}
