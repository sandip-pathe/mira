import React from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import type { MoveScenePhase } from './useMoveSceneExperience';

/** Play the existing local cues only for actual away/return transitions. */
export function useMoveSceneCues(phase: MoveScenePhase, enabled: boolean) {
  const startCue = useAudioPlayer(require('../../../../../assets/audio/move-start.wav'));
  const returnCue = useAudioPlayer(require('../../../../../assets/audio/move-return.wav'));
  const lastPhase = React.useRef(phase);
  const focused = React.useRef(false);
  const generation = React.useRef(0);

  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      generation.current += 1;
      startCue.pause(); returnCue.pause();
    };
  }, [returnCue, startCue]));

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        generation.current += 1;
        startCue.pause(); returnCue.pause();
      }
    });
    return () => sub.remove();
  }, [returnCue, startCue]);

  React.useEffect(() => {
    const previous = lastPhase.current;
    lastPhase.current = phase;
    const request = ++generation.current;
    startCue.pause(); returnCue.pause();
    if (!enabled || !focused.current || AppState.currentState !== 'active') return;
    const player = phase === 'away' && previous !== 'away' ? startCue : phase === 'returned' && previous === 'away' ? returnCue : undefined;
    if (!player) return;
    void player.seekTo(0).then(() => {
      if (request === generation.current && focused.current && AppState.currentState === 'active') player.play();
    }).catch(() => undefined);
    return () => { generation.current += 1; player.pause(); };
  }, [enabled, phase, returnCue, startCue]);
}
