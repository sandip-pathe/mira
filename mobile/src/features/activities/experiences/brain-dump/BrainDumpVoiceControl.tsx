import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import type { TranscriptCaptureState, TranscriptFailureKind } from '../../../../shared/transcriptCapture';

export function BrainDumpVoiceControl({ state, pendingStatus, message, failureKind, onStart, onRelease, onDiscard }: {
  state: TranscriptCaptureState;
  pendingStatus?: Exclude<TranscriptCaptureState, 'idle'>;
  message: string;
  failureKind?: TranscriptFailureKind;
  onStart: () => void;
  onRelease: () => void;
  onDiscard: () => void;
}) {
  const { colors, typography } = useTheme();
  const starting = ['permission', 'connecting', 'starting'].includes(state);
  const waiting = starting || state === 'transcribing';
  const disabled = state === 'transcribing';
  const recording = state === 'recording';
  const foreground = disabled ? colors.disabledInk : recording ? colors.onPrimary : colors.primary;
  const label = recording ? 'Recording · release to finish'
    : state === 'permission' ? 'Requesting mic permission…'
      : state === 'connecting' ? 'Connecting transcription…'
        : state === 'starting' ? 'Starting microphone…'
          : state === 'transcribing' ? 'Transcribing…'
            : pendingStatus === 'failed' ? 'Hold to retry voice' : 'Hold to speak';

  return <View style={styles.controls}>
    {!!pendingStatus && <View style={[styles.pending, { borderTopColor: colors.line }]}>
      <Eyebrow>VOICE CHUNK</Eyebrow>
      <Text accessibilityLiveRegion="polite" style={[typography.activityTitle, { color: colors.ink }]}>
        {pendingStatus === 'permission' ? 'Waiting for microphone permission'
          : pendingStatus === 'connecting' ? 'Connecting to transcription'
            : pendingStatus === 'starting' ? 'Starting microphone'
              : pendingStatus === 'recording' ? 'Recording now · release to finish'
                : pendingStatus === 'transcribing' ? 'Transcribing this paragraph' : 'This voice chunk needs another try'}
      </Text>
      {pendingStatus === 'transcribing' && <Text style={[typography.support, { color: colors.muted }]}>You can keep typing. The words will be placed at the capture point.</Text>}
      {pendingStatus === 'failed' && <Text style={[typography.support, { color: colors.muted }]}>Hold the voice button to retry this chunk, or discard it. Your accepted writing stays unchanged.</Text>}
    </View>}
    <Pressable accessibilityRole="button"
      accessibilityLabel={recording ? 'Recording. Release to transcribe.' : starting
        ? `${state === 'permission' ? 'Requesting microphone permission' : state === 'connecting' ? 'Connecting transcription' : 'Starting microphone'}. Activate to cancel.`
        : disabled ? 'Transcribing voice chunk.' : pendingStatus === 'failed' ? 'Hold to retry voice capture.' : 'Hold to speak. Release to transcribe.'}
      accessibilityHint="Hold while speaking and release when finished. Typed writing remains available."
      accessibilityState={{ disabled, busy: waiting }}
      accessibilityActions={[{ name: 'activate', label: recording || starting ? 'Stop or cancel voice capture' : 'Start voice capture' }]}
      onAccessibilityAction={(event) => { if (event.nativeEvent.actionName === 'activate') { if (recording || starting) onRelease(); else onStart(); } }}
      disabled={disabled} onPressIn={onStart} onPressOut={onRelease}
      style={({ pressed }) => [styles.hold, { backgroundColor: disabled ? colors.disabled : recording ? colors.primary : colors.soft, opacity: pressed && !recording ? 0.85 : 1 }]}>
      {waiting ? <ActivityIndicator color={foreground} /> : <MaterialDesignIcons name={recording ? 'microphone' : 'microphone-outline'} size={22} color={foreground} />}
      <Text style={[typography.button, styles.label, { color: foreground }]}>{label}</Text>
    </Pressable>
    <Text style={[typography.support, { color: colors.muted }]}>Speech is sent for transcription while you hold the button. Only accepted words join this temporary draft.</Text>
    {!!message && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: failureKind ? colors.error : colors.muted }]}>
      {failureKind ? `${failureKind === 'permission' ? 'Microphone permission' : failureKind === 'transport' ? 'Connection' : failureKind === 'interrupted' ? 'Capture interrupted' : 'Transcription'}: ` : ''}{message}
    </Text>}
    {pendingStatus === 'failed' && <ActionButton label="Discard voice chunk" variant="secondary" onPress={onDiscard} />}
  </View>;
}

const styles = StyleSheet.create({
  controls: { gap: 10 },
  pending: { gap: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  hold: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  label: { flexShrink: 1, textAlign: 'center' },
});
