import React from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import type { MoveScenePhase } from './useMoveSceneExperience';

function pauseSafely(player: { pause: () => void }) {
  try {
    void Promise.resolve(player.pause()).catch(() => undefined);
  } catch {
    // The player may already be released during navigation or cleanup.
  }
}

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
      pauseSafely(startCue);
      pauseSafely(returnCue);
    };
  }, [returnCue, startCue]));

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        generation.current += 1;
        pauseSafely(startCue);
        pauseSafely(returnCue);
      }
    });
    return () => sub.remove();
  }, [returnCue, startCue]);

  React.useEffect(() => {
    const previous = lastPhase.current;
    lastPhase.current = phase;
    const request = ++generation.current;
    pauseSafely(startCue);
    pauseSafely(returnCue);
    if (!enabled || !focused.current || AppState.currentState !== 'active') return;
    const player = phase === 'away' && previous !== 'away' ? startCue : phase === 'returned' && previous === 'away' ? returnCue : undefined;
    if (!player) return;
    void player.seekTo(0).then(() => {
      if (request === generation.current && focused.current && AppState.currentState === 'active') player.play();
    }).catch(() => undefined);
    return () => { generation.current += 1; pauseSafely(player); };
  }, [enabled, phase, returnCue, startCue]);
}
