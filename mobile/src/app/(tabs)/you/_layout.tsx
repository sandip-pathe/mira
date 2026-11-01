import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../components/ui';
import { JournalProvider } from '../../../features/journal/JournalProvider';

export const unstable_settings = { initialRouteName: 'index' };

export default function JournalLayout() {
  const { isDark } = useTheme();
  return (
    <JournalProvider>
      <Stack screenOptions={{
        headerShown: false,
        statusBarStyle: isDark ? 'light' : 'dark',
        statusBarAnimation: 'fade',
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new" options={{ animation: 'none' }} />
        <Stack.Screen name="entry" />
      </Stack>
    </JournalProvider>
  );
}
