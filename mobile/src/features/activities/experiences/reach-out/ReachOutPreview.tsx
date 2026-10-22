import React from 'react';
import { Alert, Share, Text, TextInput } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ReachOutArtwork } from '../../art/ReachOutArtwork';
import { styles } from './reachOutStyles';
import type { ReachOutExperience } from './useReachOutExperience';

export function ReachOutPreview({ experience: x, onBack }: { experience: ReachOutExperience; onBack: () => void }) {
  const { colors, typography } = useTheme();
  const [sharing, setSharing] = React.useState(false);
  const pending = x.busy || sharing;
  async function share() {
    if (pending || !x.message.trim()) return;
    setSharing(true);
    try { await Share.share({ message: x.message.trim() }); }
    catch { Alert.alert('Could not open sharing', 'Your message is still here and has not been sent.'); }
    finally { setSharing(false); }
  }
  return <>
    <ActionButton label="Edit message" variant="quiet" disabled={pending} onPress={x.editMessage} />
    <Eyebrow>REACH OUT · REVIEW</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Does this sound like you?</Text>
    <ReachOutArtwork phase="preview" height={128} />
    <TextInput accessibilityLabel="Edit reviewed message" multiline maxLength={2000} value={x.message} onChangeText={x.setMessage}
      editable={!pending} placeholder="Write a message…" placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
    {!!x.originalMessage && <ActionButton label="Restore my original wording" variant="quiet" disabled={pending} onPress={x.restoreOriginal} />}
    <Text style={[typography.support, { color: colors.muted }]}>Nothing is sent yet. Share opens your device’s share options; you choose what happens next.</Text>
    <ActionButton label="Share message…" loading={sharing} disabled={pending || !x.message.trim()} onPress={() => void share()} />
    <ActionButton label={x.busy ? 'Saving…' : x.savedDraftId ? 'Save changes on this device' : 'Keep for later'}
      variant="secondary" loading={x.busy} disabled={pending || !x.message.trim()} onPress={() => void x.saveCurrent()} />
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
    <ActionButton label="Done" variant="quiet" disabled={pending} onPress={onBack} />
  </>;
}
