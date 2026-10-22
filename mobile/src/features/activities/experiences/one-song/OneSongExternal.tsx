import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityBackButton } from '../../components/ActivityBackButton';
import { validateMusicLink } from '../../data/musicLink';
import type { OneSongExperience } from './useOneSongExperience';
import type { OneSongPlayback } from './useOneSongPlayback';
import { styles } from './oneSongStyles';

export function OneSongExternal({ experience: x, audio, onBack }: { experience: OneSongExperience; audio: OneSongPlayback; onBack: () => void }) {
  const { colors, typography } = useTheme();
  const link = validateMusicLink(x.linkText);
  if (x.phase === 'handoff') return <>
    <Eyebrow>READY WHEN YOU ARE</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{x.externalSource === 'manual' ? 'Choose a song in your music app.' : 'Open your music link.'}</Text>
    <Text style={[typography.support, { color: colors.muted }]}>{x.externalSource === 'manual' ? 'Mira cannot tell whether music plays. Come back whenever you like.' : `Mira cannot tell whether ${link?.domain ?? 'the link'} opens or playback starts.`}</Text>
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{x.status}</Text>}
    {x.externalSource === 'link' && <ActionButton label="Open music" disabled={!link || audio.starting} loading={audio.opening} onPress={() => void audio.openExternalMusic()} />}
    <ActionButton label={x.externalSource === 'manual' ? 'Switch apps manually' : 'I’ll switch apps manually'}
      variant={x.externalSource === 'manual' ? 'primary' : 'secondary'} disabled={audio.opening} onPress={x.beginExternal} />
    <ActionButton label="Choose another source" variant="quiet" disabled={audio.opening} onPress={() => x.moveTo('external')} />
    <ActionButton label="Back" variant="quiet" onPress={onBack} />
  </>;
  return <>
    <ActivityBackButton onPress={() => x.moveTo('intro')} />
    <Eyebrow>YOUR MUSIC, YOUR CHOICE</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Where would you like to listen?</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Music source">
      {([{ id: 'manual', title: 'I’ll choose in my music app', detail: 'Mira won’t choose a player or start audio.' },
        { id: 'link', title: 'Use a music link (optional)', detail: 'Spotify, YouTube Music, Apple Music, or SoundCloud.' }] as const).map((item) => {
        const selected = x.externalSource === item.id;
        return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => x.setExternalSource(item.id)}
          style={({ pressed }) => [styles.row, { borderColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
          <View style={styles.rowText}>
            <Text style={[typography.activityTitle, { color: colors.ink }]}>{item.title}</Text>
            <Text style={[typography.support, { color: colors.muted }]}>{item.detail}</Text>
          </View>
          <MaterialDesignIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={selected ? colors.primary : colors.muted} />
        </Pressable>;
      })}
    </View>
    {x.externalSource === 'link' && <>
      <TextInput accessibilityLabel="Music link" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={x.linkText}
        onChangeText={x.setLinkText} maxLength={1500} placeholder="Paste an HTTPS music link" placeholderTextColor={colors.muted}
        cursorColor={colors.primary} selectionColor={colors.primary}
        style={[typography.body, styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
      {!!x.linkText.trim() && !link && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>Enter an HTTPS link from an allowed music service.</Text>}
      {link && <Text style={[typography.support, { color: colors.muted }]}>Destination: {link.domain}. Nothing is saved.</Text>}
    </>}
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
    <ActionButton label={x.externalSource === 'manual' ? 'Ready to choose music' : 'Continue to music link'} disabled={x.externalSource === 'link' && !link} onPress={x.openHandoff} />
    <ActionButton label="Back" variant="quiet" onPress={onBack} />
  </>;
}
