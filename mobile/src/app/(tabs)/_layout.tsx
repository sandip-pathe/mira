import React from 'react';
import { Tabs } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { colors } from '../../components/ui';

export default function MainTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72,
          paddingTop: 6,
          paddingBottom: 4,
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Talk',
          tabBarIcon: ({ color }) => (
            <MaterialDesignIcons name="chat-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="actions"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => (
            <MaterialDesignIcons name="run-fast" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => (
            <MaterialDesignIcons name="book-open-page-variant-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
