import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { SoundscapeScene } from '../../art/SoundscapeScene';
import { ActivityPreferencePrompt } from '../../components/ActivityPreferencePrompt';
import { ActivityBackButton } from '../../components/ActivityBackButton';
import { useOneSongExperience } from './useOneSongExperience';
import { useOneSongPlayback } from './useOneSongPlayback';
import { SoundscapeChoices, SoundscapePlayer } from './OneSongSoundscapes';
import { OneSongExternal } from './OneSongExternal';
import { styles } from './oneSongStyles';

export function OneSongScreen({ origin, onBack }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const x = useOneSongExperience(origin);
  const audio = useOneSongPlayback(x);
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => { Keyboard.dismiss(); scroll.current?.scrollTo({ y: 0, animated: false }); }, [x.phase]);
  function leave() { void audio.pause(); onBack(); }
  function external() { void audio.pause(); x.selectExternal(); }
  const art = <SoundscapeScene scene={audio.currentScene?.id ?? x.preferredScene ?? 'rain'} playing={x.phase === 'soundscape' && audio.playback.playing} />;
  const back = <ActionButton label="Back" variant="quiet" onPress={leave} />;
  return <ActivityFrame><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {x.phase === 'loading' && <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening your listening break…</Text>
      </View>}
      {x.phase === 'intro' && <>
        <Eyebrow>TAKE A BREAK</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A few minutes of listening.</Text>{art}
        <Text style={[typography.support, { color: colors.muted }]}>Choose an offline Mira soundscape or bring your own music. Nothing starts until you press Play or open a music app.</Text>
        {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
        <View style={styles.spacer} />
        <ActionButton label={x.preferredScene ? 'Open my soundscape' : 'Choose an offline soundscape'} onPress={() => x.moveTo('scenes')} />
        <ActionButton label="Listen in my music app" variant="secondary" onPress={external} />{back}
      </>}
      {x.phase === 'scenes' && <>
        <ActivityBackButton onPress={() => x.moveTo('intro')} />
        <Eyebrow>OFFLINE SOUNDSCAPES</Eyebrow>
        <SoundscapeChoices experience={x} art={art} onExternal={external} />
      </>}
      {x.phase === 'soundscape' && <>
        <ActionButton label="Choose another scene" variant="quiet" onPress={() => { void audio.pause(); x.moveTo('scenes'); }} />
        <Eyebrow>OFFLINE SOUNDSCAPE</Eyebrow>
        <SoundscapePlayer experience={x} audio={audio} art={art} onExternal={external} />
      </>}
      {(x.phase === 'external' || x.phase === 'handoff') && <OneSongExternal experience={x} audio={audio} onBack={leave} />}
      {x.phase === 'away' && <>
        <Eyebrow>LISTENING BREAK</Eyebrow>{art}
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Come back when you want.</Text>
        <Text style={[typography.support, { color: colors.muted }]}>Mira can’t check whether your music is playing. There’s no playback timer.</Text>
        <View style={styles.spacer} /><ActionButton label="I’m back" onPress={x.returnFromExternal} />
        <ActionButton label="Back" variant="quiet" onPress={() => { x.report('stopped'); leave(); }} />
      </>}
      {x.phase === 'returned' && <>
        <Eyebrow>WELCOME BACK</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>What would you like to report?</Text>
        <Text style={[typography.support, { color: colors.muted }]}>Only you know what played or how long you listened.</Text>
        <ActionButton label="Listened" onPress={() => x.report('completed')} />
        <ActionButton label="Stopped early" variant="secondary" onPress={() => x.report('stopped')} />
        <ActionButton label="Skip" variant="quiet" onPress={() => x.report('skipped')} />
      </>}
      {x.phase === 'done' && <>
        <Eyebrow>ONE SONG BREAK</Eyebrow>{art}
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{x.run?.state === 'completed' ? 'Listening, at your pace.' : x.run?.state === 'skipped' || !x.run ? 'You can leave it here.' : 'You stopped when you wanted.'}</Text>
        <ActivityPreferencePrompt run={x.run} title="One Song Break" />
        <Text style={[typography.support, { color: colors.muted }]}>{x.run?.state === 'completed' ? 'Take what you want from the pause.' : 'There’s nothing to catch up on.'}</Text>
        <View style={styles.spacer} /><ActionButton label="Done" onPress={leave} />
      </>}
    </ScrollView>
  </KeyboardAvoidingView></ActivityFrame>;
}
