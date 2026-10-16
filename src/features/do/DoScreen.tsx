import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterventionRunner } from './InterventionRunner';
import { colors } from '../../components/ui';

export default function DoScreen() {
  const {
    id,
    origin: rawOrigin,
    itemId,
  } = useLocalSearchParams<{ id?: string; origin?: string; itemId?: string }>();
  const origin =
    rawOrigin === 'actions_library' || rawOrigin === 'actions_continue' ? rawOrigin : 'talk';
  const returnLabel = origin === 'talk' ? 'Talk' : 'Activities';
  const returnHome = () => {
    if (origin === 'talk') router.back();
    else router.replace('/(tabs)/actions');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${returnLabel}`}
          onPress={returnHome}
          style={{ minHeight: 48, minWidth: 48, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>
            ‹ {returnLabel}
          </Text>
        </Pressable>
      </View>
      <InterventionRunner
        key={`${id}-${origin}-${itemId ?? ''}`}
        id={typeof id === 'string' ? id : ''}
        origin={origin}
        continueItemId={typeof itemId === 'string' ? itemId : undefined}
        onBack={returnHome}
      />
    </SafeAreaView>
  );
}
