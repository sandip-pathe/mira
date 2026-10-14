import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../ui';

export default function MainTabs() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 62, paddingTop: 5, paddingBottom: 3 },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Talk', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>◌</Text> }} />
    <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>▤</Text> }} />
  </Tabs>;
}
