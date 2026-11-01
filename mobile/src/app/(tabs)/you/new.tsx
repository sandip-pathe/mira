import React from 'react';
import { useFocusEffect } from 'expo-router';
import JournalEntryScreen from '../../../features/journal/JournalEntryScreen';
import { useJournal } from '../../../features/journal/JournalProvider';

export default function NewJournalEntryRoute() {
  const { startJournal } = useJournal();
  const [started, setStarted] = React.useState(false);

  useFocusEffect(React.useCallback(() => {
    startJournal();
    setStarted(true);
  }, [startJournal]));

  return started ? <JournalEntryScreen /> : null;
}
