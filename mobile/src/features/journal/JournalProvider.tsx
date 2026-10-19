import React from 'react';
import { useJournalController } from './hooks/useJournalController';

type JournalState = ReturnType<typeof useJournalController>;
const JournalContext = React.createContext<JournalState | undefined>(undefined);

export function JournalProvider({ children }: React.PropsWithChildren) {
  const journal = useJournalController();
  return <JournalContext.Provider value={journal}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const journal = React.useContext(JournalContext);
  if (!journal) throw new Error('useJournal must be used inside JournalProvider.');
  return journal;
}
