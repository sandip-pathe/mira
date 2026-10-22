import React from 'react';
import { Alert, AppState, Keyboard } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** The release animation always ends in a separate, explicit discard decision. */
export function useLetterRelease(onDiscard: () => void, canDiscard: boolean, editorOpen = true) {
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState('');
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const complete = React.useRef(false);
  const alertOpen = React.useRef(false);
  const focused = React.useRef(false);
  const foreground = React.useRef(AppState.currentState === 'active');
  const current = React.useRef({ onDiscard, canDiscard, editorOpen });
  React.useLayoutEffect(() => { current.current = { onDiscard, canDiscard, editorOpen }; });

  const clearTimers = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const reset = React.useCallback(() => {
    clearTimers(); complete.current = false; setProgress(0); setStatus('');
  }, [clearTimers]);
  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; reset(); };
  }, [reset]));
  React.useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      foreground.current = state === 'active';
      if (state !== 'active') reset();
    });
    return () => { listener.remove(); clearTimers(); };
  }, [clearTimers, reset]);
  React.useEffect(() => { clearTimers(); complete.current = false; }, [canDiscard, editorOpen, clearTimers]);

  function confirm() {
    if (!current.current.canDiscard || !focused.current || !foreground.current || alertOpen.current) return;
    clearTimers(); Keyboard.dismiss(); alertOpen.current = true;
    Alert.alert('Discard this letter?', 'This draft has not been saved. It will be cleared from this activity.', [
      { text: 'Keep writing', style: 'cancel', onPress: () => { alertOpen.current = false; reset(); } },
      { text: 'Discard draft', style: 'destructive', onPress: () => {
        alertOpen.current = false; reset();
        if (current.current.canDiscard && focused.current) current.current.onDiscard();
      } },
    ], { onDismiss: () => { alertOpen.current = false; reset(); } });
  }
  function preview() {
    if (!current.current.canDiscard || !current.current.editorOpen || !focused.current || !foreground.current) return;
    setProgress(1); setStatus('Lift now to cancel, or keep holding a little longer.');
  }
  function start() {
    if (!current.current.canDiscard || !current.current.editorOpen || !focused.current || !foreground.current || alertOpen.current) return;
    reset();
    timers.current.push(setTimeout(preview, 350));
    timers.current.push(setTimeout(() => {
      complete.current = true; setStatus('Release motion complete. Confirm to discard the draft.'); confirm();
    }, 1350));
  }
  function cancel() { clearTimers(); if (!complete.current) reset(); }
  function press() { if (!complete.current) confirm(); }

  return { progress: canDiscard && editorOpen ? progress : 0, status, start, preview, cancel, press, confirm, reset };
}
