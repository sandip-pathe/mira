import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../components/ui';
import { SavedOutputPage, savedOutputStyles as styles } from '../features/activities/components/SavedOutputPage';
import { deleteSavedWording, loadSavedWording, type SavedWording } from '../shared/savedWordings';
import { stageTalkTransfer } from '../shared/talkTransfer';

export default function SavedWordingScreen() {
  const { colors, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [result, setResult] = React.useState<{ id?: string; item?: SavedWording; error?: string }>({});
  const [busy, setBusy] = React.useState(false);
  const loading = typeof id === 'string' && result.id !== id;
  const item = result.id === id ? result.item : undefined;
  const status = result.id === id ? result.error ?? '' : '';

  React.useEffect(() => {
    let current = true;
    void (typeof id === 'string' ? loadSavedWording(id) : Promise.resolve(undefined))
      .then((value) => { if (current) setResult({ id, item: value }); })
      .catch(() => { if (current) setResult({ id, error: 'This wording could not be opened.' }); });
    return () => { current = false; };
  }, [id]);

  function openTalk() {
    if (!item || busy) return;
    try { stageTalkTransfer(`${item.sourceRunId}:saved-wording:${item.id}`, item.text); router.push('/(tabs)/index'); }
    catch { setResult((current) => ({ ...current, error: 'Your wording is still here. Talk could not be opened.' })); }
  }
  function remove() {
    if (!item || busy) return;
    Alert.alert('Remove saved wording?', 'This removes it from this device.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setBusy(true);
        void deleteSavedWording(item.id).then(() => router.back())
          .catch(() => setResult({ id, item, error: 'This wording could not be removed.' }))
          .finally(() => setBusy(false));
      } },
    ]);
  }

  return <SavedOutputPage>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : item ? <>
      <Eyebrow>SAVED FROM NOTICE & NAME</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Your words, kept.</Text>
      <View style={styles.document}>
        <Text selectable style={[typography.body, { color: colors.ink }]}>{item.text}</Text>
        {!!item.bodyLocations.length && <Text style={[typography.support, { color: colors.muted }]}>Body words: {item.bodyLocations.join(', ')}</Text>}
      </View>
      <Text style={[typography.support, { color: colors.muted }]}>Private and saved on this device. This wording is not shared context.</Text>
      {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{status}</Text>}
      <View style={styles.spacer} />
      <ActionButton label="Talk about this wording" disabled={busy} onPress={openTalk} />
      <ActionButton label="Remove saved wording" variant="quiet" loading={busy} onPress={remove} />
    </> : <>
      <Eyebrow>SAVED WORDING</Eyebrow>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>This wording isn’t available</Text>
      <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status || 'It may have been removed from this device.'}</Text>
    </>}
  </SavedOutputPage>;
}
