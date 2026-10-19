import React from 'react';
import { router } from 'expo-router';
import { useJournal } from '../../../features/journal/JournalProvider';

export default function NewJournalEntryRoute() {
  const { startJournal } = useJournal();

  React.useEffect(() => {
    startJournal();
    router.replace('/you/entry');
  }, [startJournal]);

  return null;
}
