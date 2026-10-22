import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../../components/ui';
import { soundscapes } from './soundscapeData';
import type { OneSongExperience } from './useOneSongExperience';
import type { OneSongPlayback } from './useOneSongPlayback';
import { styles } from './oneSongStyles';

export function SoundscapeChoices({ experience: x, art, onExternal }: { experience: OneSongExperience; art: React.ReactNode; onExternal: () => void }) {
  const { colors, typography } = useTheme();
  const currentScene = soundscapes.find((item) => item.id === x.scene);
  return <>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Choose the sound around you.</Text>
    <View style={styles.choices}>{soundscapes.map((item) => {
      const selected = x.scene === item.id;
      return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => x.selectScene(item.id)}
        style={({ pressed }) => [styles.choice, { backgroundColor: selected ? colors.soft : colors.surface, opacity: pressed ? 0.65 : 1 }]}>
        {selected && <MaterialDesignIcons name="check" size={17} color={colors.primary} />}
        <Text style={[typography.button, { color: selected ? colors.primary : colors.ink, flexShrink: 1 }]}>{item.title}</Text>
      </Pressable>;
    })}</View>
    {currentScene ? <>
      {art}
      <Text style={[typography.groupHeading, { color: colors.ink }]}>{currentScene.title}</Text>
      <Text style={[typography.support, { color: colors.muted }]}>{currentScene.description}</Text>
      <ActionButton label={`Open ${currentScene.title}`} variant="secondary" onPress={() => x.selectScene(currentScene.id)} />
      <ActionButton label={x.preferredScene === currentScene.id ? 'Preferred for next time' : 'Use this scene next time'} variant="quiet"
        onPress={() => void x.selectPreferred(x.preferredScene === currentScene.id ? undefined : currentScene.id)} />
    </> : <Text style={[typography.support, { color: colors.muted }]}>Choose one of the three bundled scenes above.</Text>}
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
    <ActionButton label="Listen in my music app" variant="secondary" onPress={onExternal} />
  </>;
}

export function SoundscapePlayer({ experience: x, audio, art, onExternal }: {
  experience: OneSongExperience; audio: OneSongPlayback; art: React.ReactNode; onExternal: () => void;
}) {
  const { colors, typography } = useTheme();
  const { currentScene, playback } = audio;
  if (!currentScene) return null;
  const progress = playback.duration > 0 && Number.isFinite(playback.currentTime / playback.duration)
    ? Math.max(0, Math.min(100, playback.currentTime / playback.duration * 100)) : 0;
  return <>
    {art}
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{currentScene.title}</Text>
    <Text style={[typography.support, { color: colors.muted }]}>{currentScene.description}</Text>
    <View accessibilityRole="progressbar" accessibilityLabel="Soundscape playback position" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
      style={[styles.progress, { backgroundColor: colors.line }]}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
    </View>
    <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{playback.isBuffering ? 'Preparing sound…' : audio.ready ? 'Plays offline · loops gently' : 'Loading bundled sound…'}</Text>
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
    <View style={styles.transport}>
      <ActionButton label={playback.playing ? 'Pause' : 'Play'} disabled={!audio.ready || audio.opening} loading={audio.starting}
        onPress={() => void audio.togglePlayback()} style={styles.transportButton} />
      <ActionButton label="End" variant="secondary" onPress={() => { void audio.pause(); x.stopSoundscape(); }} style={styles.transportButton} />
    </View>
    <View style={styles.preference}>
      <Text style={[typography.recentTitle, { color: colors.ink, flex: 1 }]}>Use this as my default scene</Text>
      <Switch accessibilityLabel="Use this as my default scene" value={x.preferredScene === currentScene.id}
        onValueChange={(enabled) => void x.selectPreferred(enabled ? currentScene.id : undefined)}
        trackColor={{ false: colors.disabled, true: colors.primary }} thumbColor={colors.surface} />
    </View>
    <ActionButton label="Listen to my music instead" variant="quiet" onPress={onExternal} />
  </>;
}
