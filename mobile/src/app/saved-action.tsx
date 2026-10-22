import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../components/ui';
import { SavedOutputPage, savedOutputStyles as styles } from '../features/activities/components/SavedOutputPage';
import { SmallStepScene } from '../features/activities/art/SmallStepScene';
import { deleteSavedAction, loadSavedAction, updateSavedActionOutcome, type SavedAction } from '../shared/savedActions';

export default function SavedActionScreen() {
  const { colors, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [result, setResult] = React.useState<{ id?: string; item?: SavedAction; error?: string }>({});
  const [busy, setBusy] = React.useState<'mark' | 'remove'>();
  const loading = typeof id === 'string' && result.id !== id;
  const item = result.id === id ? result.item : undefined;
  const status = result.id === id ? result.error ?? '' : '';

  React.useEffect(() => {
    let current = true;
    void (typeof id === 'string' ? loadSavedAction(id) : Promise.resolve(undefined))
      .then((value) => { if (current) setResult({ id, item: value }); })
      .catch(() => { if (current) setResult({ id, error: 'This saved action could not be opened.' }); });
    return () => { current = false; };
  }, [id]);

  function markTried() {
    if (!item || busy) return;
    setBusy('mark');
    void updateSavedActionOutcome(item.id, 'tried').then((value) => {
      if (value) setResult({ id, item: value });
      else setResult({ id, error: 'This saved action is no longer available.' });
    }).catch(() => setResult({ id, item, error: 'This action could not be updated.' })).finally(() => setBusy(undefined));
  }
  function confirmDelete() {
    if (!item || busy) return;
    Alert.alert('Remove saved action?', 'This removes it from this device.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setBusy('remove');
        void deleteSavedAction(item.id).then(() => router.back())
          .catch(() => setResult({ id, item, error: 'This action could not be removed.' }))
          .finally(() => setBusy(undefined));
      } },
    ]);
  }

  return <SavedOutputPage>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : item ? <>
      <Eyebrow>SAVED FROM ONE SMALL STEP</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>
        {item.outcome === 'tried' ? 'You tried this move.' : item.outcome === 'not_tried' ? 'Kept for another time.' : 'A move you can return to.'}
      </Text>
      <SmallStepScene state="action" />
      <View style={styles.document}>
        <Text style={[typography.activityTitle, { color: colors.ink }]}>Task</Text>
        <Text selectable style={[typography.body, { color: colors.ink }]}>{item.task}</Text>
        <Text style={[typography.activityTitle, { color: colors.ink }]}>First move</Text>
        <Text selectable style={[typography.body, { color: colors.ink }]}>{item.firstMove}</Text>
        {!!item.cue && <Text style={[typography.support, { color: colors.muted }]}>When: {item.cue}</Text>}
      </View>
      <Text style={[typography.support, { color: colors.muted }]}>Saved on this device. The timing cue does not set a reminder.</Text>
      {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{status}</Text>}
      <View style={styles.spacer} />
      {item.outcome !== 'tried' && <ActionButton label="Mark as tried" loading={busy === 'mark'} disabled={!!busy} onPress={markTried} />}
      <ActionButton label="Remove saved action" variant="quiet" loading={busy === 'remove'} disabled={!!busy} onPress={confirmDelete} />
    </> : <>
      <Eyebrow>SAVED ACTION</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>This action isn’t available</Text>
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status || 'It may have been removed from this device.'}</Text>
    </>}
  </SavedOutputPage>;
}
