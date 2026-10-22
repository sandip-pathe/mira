import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityFrame } from '../runtime/ActivityFrame';
import { ActivityBackButton } from './ActivityBackButton';

/** Saved documents share navigation and scrolling; each document owns its content. */
export function SavedOutputPage({ children }: { children: React.ReactNode }) {
  return <ActivityFrame>
    <SafeAreaView style={styles.page}>
      <View style={styles.header}><ActivityBackButton onPress={() => router.back()} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </SafeAreaView>
  </ActivityFrame>;
}

export const savedOutputStyles = StyleSheet.create({
  loading: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  document: { gap: 8, paddingVertical: 8 },
  spacer: { flexGrow: 1 },
});

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 22, justifyContent: 'center', maxWidth: 660, width: '100%', alignSelf: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24, gap: 16, maxWidth: 660, width: '100%', alignSelf: 'center' },
});
