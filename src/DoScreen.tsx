import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterventionRunner } from './InterventionRunner';
import { colors } from './ui';

export default function DoScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
    <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to Talk" onPress={() => router.back()}
        style={{ minHeight: 48, minWidth: 48, justifyContent: 'center' }}>
        <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>‹  Talk</Text>
      </Pressable>
    </View>
    <InterventionRunner id={typeof id === 'string' ? id : ''} onBack={() => router.back()} />
  </SafeAreaView>;
}
