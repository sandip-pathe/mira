import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityHost } from './runtime/ActivityHost';
import { HelpButton, ThemePickerButton, useTheme } from '../../components/ui';
import { ActivityBackButton } from './components/ActivityBackButton';
import { stageTalkTransfer } from '../../shared/talkTransfer';
import { emitUrgentHelp } from '../../shared/demoEvents';
import { canonicalActivityId } from '../../shared/activityRegistry';

export default function DoScreen() {
  const { colors } = useTheme();
  const {
    id,
    origin: rawOrigin,
    itemId,
    letterId,
    handoffId,
    contextId,
    draftId,
  } = useLocalSearchParams<{ id?: string; origin?: string; itemId?: string; letterId?: string; handoffId?: string; contextId?: string; draftId?: string }>();
  const hasHandoff = typeof handoffId === 'string';
  const origin =
    rawOrigin === 'actions_library' || rawOrigin === 'actions_continue' ? rawOrigin : 'talk';
  const returnLabel = hasHandoff ? 'Back' : origin === 'talk' ? 'Talk' : 'Activities';
  const returnHome = () => {
    if (origin === 'talk' || hasHandoff) router.back();
    else router.replace('/(tabs)/actions');
  };
  function openTalkWithExcerpt(runId: string, text: string) {
    stageTalkTransfer(runId, text);
    if (canonicalActivityId(typeof id === 'string' ? id : '') === 'brain_dump') router.push('/(tabs)/index');
    else router.replace('/(tabs)/index');
    return true;
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <ActivityBackButton label={returnLabel} onPress={returnHome} />
        <View style={styles.headerActions}>
          <ThemePickerButton />
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
      <ActivityHost
        key={`${id}-${origin}-${itemId ?? ''}-${letterId ?? ''}-${handoffId ?? ''}-${contextId ?? ''}-${draftId ?? ''}`}
        id={typeof id === 'string' ? id : ''}
        origin={origin}
        continueItemId={typeof itemId === 'string' ? itemId : undefined}
        handoffId={typeof handoffId === 'string' ? handoffId : undefined}
        contextId={typeof contextId === 'string' ? contextId : undefined}
        draftId={typeof draftId === 'string' ? draftId : undefined}
        letterId={typeof letterId === 'string' ? letterId : undefined}
        onTalkTransfer={openTalkWithExcerpt}
        onBack={returnHome}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 56, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
