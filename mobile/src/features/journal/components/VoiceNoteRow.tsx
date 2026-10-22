import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ActionButton, useTheme } from '../../../components/ui';

export function VoiceNoteRow({ uri, createdAt, disabled, onDelete }: {
  uri: string; createdAt: number; disabled?: boolean; onDelete: () => void;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const { paper, typography } = useTheme();
  useFocusEffect(React.useCallback(() => () => player.pause(), [player]));
  return <View style={[styles.row, { borderTopColor: `${paper.ink}25` }]}>
    <Text style={[typography.support, styles.date, { color: paper.muted }]}>{new Date(createdAt).toLocaleString()}</Text>
    <View style={styles.actions}>
      <ActionButton appearance="paper" label={status.playing ? 'Pause' : 'Play'} variant="quiet" disabled={disabled}
        onPress={async () => {
          if (status.playing) player.pause();
          else {
            if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) await player.seekTo(0);
            player.play();
          }
        }} />
      <ActionButton appearance="paper" label="Delete" accessibilityLabel="Delete voice note" variant="quiet" disabled={disabled} onPress={onDelete} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 4 },
  date: { flexShrink: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
