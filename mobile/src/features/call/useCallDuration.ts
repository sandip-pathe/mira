import React from 'react';

export function useCallDuration(connectedAt?: number, endedAt?: number) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!connectedAt || endedAt) return;
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [connectedAt, endedAt]);
  const seconds = connectedAt ? Math.max(0, Math.floor(((endedAt ?? now) - connectedAt) / 1000)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
