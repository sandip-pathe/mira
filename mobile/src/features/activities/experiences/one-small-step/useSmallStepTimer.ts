import React from 'react';

export const SMALL_STEP_SECONDS = 120;

/** Mounted for one trying phase: elapsed time never marks an action as tried. */
export function useSmallStepTimer(onCheckIn: () => void) {
  const [running, setRunning] = React.useState(false);
  const [seconds, setSeconds] = React.useState(SMALL_STEP_SECONDS);
  const end = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (!running) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil(((end.current ?? Date.now()) - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) { setRunning(false); onCheckIn(); }
    };
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [onCheckIn, running]);

  function start() { end.current = Date.now() + SMALL_STEP_SECONDS * 1000; setSeconds(SMALL_STEP_SECONDS); setRunning(true); }
  function cancel() { end.current = undefined; setRunning(false); }
  function checkIn() { cancel(); onCheckIn(); }

  return { running, seconds, start, cancel, checkIn };
}
