import React from 'react';
import { Stack } from 'expo-router';
import { JournalProvider } from '../../../features/journal/JournalProvider';

export const unstable_settings = { initialRouteName: 'index' };

export default function JournalLayout() {
  return (
    <JournalProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new" />
        <Stack.Screen name="entry" />
      </Stack>
    </JournalProvider>
  );
}
