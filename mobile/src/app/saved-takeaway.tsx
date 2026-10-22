import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../components/ui';
import { SavedOutputPage, savedOutputStyles as styles } from '../features/activities/components/SavedOutputPage';
import { ThoughtThreads } from '../features/activities/art/ThoughtThreads';
import { loadSavedTakeaway, type SavedTakeaway } from '../shared/savedTakeaways';
import { stageTalkTransfer } from '../shared/talkTransfer';
import { stageActivityHandoff } from '../shared/activityHandoff';

const labels = { heavy: 'What seems heavy', wait: 'Could wait for now', thread: 'One thread to follow' } as const;

export default function SavedTakeawayScreen() {
  const { colors, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [result, setResult] = React.useState<{ id?: string; item?: SavedTakeaway; error?: string }>({});
  const loading = typeof id === 'string' && result.id !== id;
  const item = result.id === id ? result.item : undefined;
  const status = result.id === id ? result.error ?? '' : '';

  React.useEffect(() => {
    let current = true;
    void (typeof id === 'string' ? loadSavedTakeaway(id) : Promise.resolve(undefined))
      .then((value) => { if (current) setResult({ id, item: value }); })
      .catch(() => { if (current) setResult({ id, error: 'This saved takeaway could not be opened.' }); });
    return () => { current = false; };
  }, [id]);

  function openTalk() {
    if (!item) return;
    try {
      stageTalkTransfer(`${item.sourceRunId}:saved:${item.id}`, item.text);
      router.push('/(tabs)/index');
    } catch {
      setResult((current) => ({ ...current, error: 'This thread is still here. Try opening Talk again.' }));
    }
  }
  function openOneSmallStep() {
    if (!item) return;
    try {
      const handoffId = stageActivityHandoff(item.sourceRunId, item.text);
      router.push({ pathname: '/do', params: { id: 'one_small_step', origin: 'actions_library', handoffId } });
    } catch {
      setResult((current) => ({ ...current, error: 'This thread is still here. Try opening One Small Step again.' }));
    }
  }

  return <SavedOutputPage>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : item ? <>
      <Eyebrow>SAVED FROM BRAIN DUMP</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A takeaway to keep</Text>
      <ThoughtThreads gathered height={132} />
      <View style={styles.document}>
        <Text style={[typography.activityTitle, { color: colors.ink }]}>{labels[item.section]}</Text>
        <Text selectable style={[typography.body, { color: colors.ink }]}>{item.text}</Text>
      </View>
      <Text style={[typography.support, { color: colors.muted }]}>Saved on this device. Your temporary Brain Dump writing is not part of this saved takeaway.</Text>
      {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{status}</Text>}
      <View style={styles.spacer} />
      <ActionButton label="Turn into One Small Step" variant="secondary" onPress={openOneSmallStep} />
      <ActionButton label="Talk about this thread" onPress={openTalk} />
    </> : <>
      <Eyebrow>SAVED TAKEAWAY</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>This takeaway isn’t available</Text>
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status || 'It may have been removed from this device.'}</Text>
    </>}
  </SavedOutputPage>;
}
