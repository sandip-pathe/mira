import React from 'react';
import { ActivityIndicator, Alert, Share, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../components/ui';
import { SavedOutputPage, savedOutputStyles as styles } from '../features/activities/components/SavedOutputPage';
import { deleteReachOutDraft, loadReachOutDraft, type ReachOutDraft } from '../shared/reachOutDrafts';

export default function SavedReachOutScreen() {
  const { colors, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [result, setResult] = React.useState<{ id?: string; item?: ReachOutDraft; error?: string }>({});
  const [busy, setBusy] = React.useState(false);
  const loading = typeof id === 'string' && result.id !== id;
  const item = result.id === id ? result.item : undefined;
  const status = result.id === id ? result.error ?? '' : '';

  useFocusEffect(React.useCallback(() => {
    let live = true;
    void (typeof id === 'string' ? loadReachOutDraft(id) : Promise.resolve(undefined))
      .then((value) => { if (live) setResult({ id, item: value }); })
      .catch(() => { if (live) setResult({ id, error: 'This saved message could not be opened.' }); });
    return () => { live = false; };
  }, [id]));

  function remove() {
    if (!item || busy) return;
    Alert.alert('Delete saved message?', 'This removes the draft from this device.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setBusy(true);
        void deleteReachOutDraft(item.id).then(() => router.back())
          .catch(() => setResult({ id, item, error: 'The saved message could not be deleted. It is still here.' }))
          .finally(() => setBusy(false));
      } },
    ]);
  }

  return <SavedOutputPage>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : item ? <>
      <Eyebrow>REACH OUT · SAVED DRAFT</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Your message, kept.</Text>
      <View style={styles.document}><Text selectable style={[typography.body, { color: colors.ink }]}>{item.message}</Text></View>
      <Text style={[typography.support, { color: colors.muted }]}>Saved privately on this device. It has not been sent.</Text>
      {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{status}</Text>}
      <View style={styles.spacer} />
      <ActionButton label="Share message…" disabled={busy}
        onPress={() => void Share.share({ message: item.message }).catch(() => Alert.alert('Could not open sharing', 'The message has not been sent.'))} />
      <ActionButton label="Edit draft" variant="secondary" disabled={busy}
        onPress={() => router.push({ pathname: '/do', params: { id: 'reach_out', origin: 'actions_library', draftId: item.id } })} />
      <ActionButton label="Delete draft" variant="quiet" loading={busy} onPress={remove} />
    </> : <>
      <Eyebrow>SAVED DRAFT</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>This message isn’t available</Text>
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status || 'It may have been removed from this device.'}</Text>
    </>}
  </SavedOutputPage>;
}
