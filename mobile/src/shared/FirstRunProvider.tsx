import React from 'react';
import { completeWelcome, hasCompletedWelcome } from './storage/firstRun';

type FirstRunState = {
  welcomeCompleted: boolean | null;
  finishWelcome: () => Promise<void>;
};

const FirstRunContext = React.createContext<FirstRunState>({
  welcomeCompleted: null,
  finishWelcome: async () => {},
});

export function FirstRunProvider({ children }: React.PropsWithChildren) {
  const [welcomeCompleted, setWelcomeCompleted] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let active = true;
    void hasCompletedWelcome().then((completed) => {
      if (active) setWelcomeCompleted(completed);
    }).catch(() => {
      // An older build without the current local database must still reach sign-in.
      if (active) setWelcomeCompleted(true);
    });
    return () => { active = false; };
  }, []);

  const finishWelcome = React.useCallback(async () => {
    try {
      await completeWelcome();
    } finally {
      // If persistence is unavailable, keep this launch usable; the guide may show again later.
      setWelcomeCompleted(true);
    }
  }, []);

  return <FirstRunContext.Provider value={{ welcomeCompleted, finishWelcome }}>{children}</FirstRunContext.Provider>;
}

export function useFirstRun() {
  return React.useContext(FirstRunContext);
}
