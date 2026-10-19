import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterventionRunner } from './InterventionRunner';
import { colors, HelpButton } from '../../components/ui';
import { stageTalkTransfer } from '../../shared/talkTransfer';
import { emitUrgentHelp } from '../../shared/demoEvents';

export default function DoScreen() {
  const {
    id,
    origin: rawOrigin,
    itemId,
    letterId,
  } = useLocalSearchParams<{ id?: string; origin?: string; itemId?: string; letterId?: string }>();
  const origin =
    rawOrigin === 'actions_library' || rawOrigin === 'actions_continue' ? rawOrigin : 'talk';
  const returnLabel = origin === 'talk' ? 'Talk' : 'Activities';
  const returnHome = () => {
    if (origin === 'talk') router.back();
    else router.replace('/(tabs)/actions');
  };
  function openTalkWithExcerpt(runId: string, text: string) {
    stageTalkTransfer(runId, text);
    router.replace('/(tabs)/index');
    return true;
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <HelpButton onPress={() => Alert.alert('Help', 'Choose a support route or urgent help.', [
          {
            text: 'Support route',
            onPress: () => Alert.alert(
              'Support route',
              'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.',
            ),
          },
          {
            text: 'Urgent help now',
            onPress: () => {
              emitUrgentHelp();
              router.replace('/(tabs)/index');
            },
          },
          { text: 'Close', style: 'cancel' },
        ])} />
        </View>
      </View>
      <InterventionRunner
        key={`${id}-${origin}-${itemId ?? ''}-${letterId ?? ''}`}
        id={typeof id === 'string' ? id : ''}
        origin={origin}
        continueItemId={typeof itemId === 'string' ? itemId : undefined}
        letterId={typeof letterId === 'string' ? letterId : undefined}
        onTalkTransfer={openTalkWithExcerpt}
        onBack={returnHome}
      />
    </SafeAreaView>
  );
}
