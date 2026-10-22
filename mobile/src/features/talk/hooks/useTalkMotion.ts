import React from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

export function useTalkMotion(enabled: boolean) {
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = React.useState(initialReducedMotion);
  const [foreground, setForeground] = React.useState(AppState.currentState === 'active');
  const [focused, setFocused] = React.useState(false);

  useFocusEffect(React.useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  React.useEffect(() => {
    const app = AppState.addEventListener('change', state => setForeground(state === 'active'));
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { app.remove(); motion.remove(); };
  }, []);

  return enabled && foreground && focused && !reducedMotion;
}
