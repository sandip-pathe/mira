import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, Tabs } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ui';

const tabIcons: Record<string, React.ComponentProps<typeof MaterialDesignIcons>['name']> = {
  index: 'microphone-outline',
  actions: 'shape-outline',
  you: 'notebook-outline',
};

export default function MainTabs() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const bottomPadding = Math.max(12, insets.bottom);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarAllowFontScaling: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          height: 64 + bottomPadding + Math.max(0, fontScale - 1) * 24,
          paddingTop: 4,
          paddingBottom: bottomPadding,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, { backgroundColor: focused ? colors.soft : 'transparent' }]}>
            <MaterialDesignIcons name={tabIcons[route.name] ?? 'circle-outline'} size={24} color={color} />
          </View>
        ),
        tabBarLabel: ({ color, focused, children }) => (
          <Text style={[focused ? typography.tabActive : typography.tabInactive, styles.tabLabel, { color }]}>
            {children}
          </Text>
        ),
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Talk',
        }}
      />
      <Tabs.Screen
        name="actions"
        options={{
          title: 'Activities',
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'Journal',
        }}
        listeners={{
          tabPress: () => router.navigate('/you/new'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { minHeight: 48, marginHorizontal: 4 },
  tabIcon: { width: 42, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { marginTop: 4, textAlign: 'center' },
});
