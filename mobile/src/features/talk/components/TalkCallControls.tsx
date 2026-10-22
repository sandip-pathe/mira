import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import type { VoiceState } from '../../../shared/voice';
import { useTheme } from '../../../components/ui';

export function TalkCallControls({ state, textMode, caption, compact = false, onToggleMode, onTalkPressIn, onTalkPressOut, onEnd }: {
  state: VoiceState;
  textMode: boolean;
  caption: string;
  compact?: boolean;
  onToggleMode: () => void;
  onTalkPressIn: () => void;
  onTalkPressOut: () => void;
  onEnd: () => void;
}) {
  const { colors, typography } = useTheme();
  const endDisabled = (state === 'disconnected' || state === 'error') && !textMode;
  const recording = state === 'recording';
  const micSize = compact ? 72 : 92;
  return (
    <View style={styles.area}>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={textMode ? 'Switch to voice mode' : 'Type a message'} accessibilityState={{ selected: textMode }} onPress={onToggleMode} style={({ pressed }) => [styles.sideControl, pressed && { backgroundColor: colors.soft }]}>
          <MaterialDesignIcons name={textMode ? 'microphone-outline' : 'format-text'} size={25} color={colors.primary} />
          <Text style={[typography.talkSideLabel, styles.label, { color: colors.ink }]}>{textMode ? 'Voice' : 'Type instead'}</Text>
        </Pressable>
        <View style={{ width: micSize, height: micSize }}>
          {recording && <View pointerEvents="none" style={[styles.recordingRing, { borderColor: colors.primary, borderRadius: micSize / 2 + 9 }]} />}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hold to speak and release to send. Hold while Mira speaks to interrupt. If voice is off, holding starts it and speaks when ready."
            accessibilityState={{ selected: recording, busy: state === 'connecting' || state === 'reconnecting' || state === 'starting' }}
            onPressIn={onTalkPressIn}
            onPressOut={onTalkPressOut}
            style={({ pressed }) => [styles.mic, { width: micSize, height: micSize, borderRadius: micSize / 2, backgroundColor: pressed ? colors.pressed : colors.primary }]}
          >
            <MaterialDesignIcons name={recording ? 'microphone' : 'microphone-outline'} size={38} color={colors.onPrimary} />
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="End voice session" accessibilityState={{ disabled: endDisabled }} disabled={endDisabled} onPress={onEnd} style={({ pressed }) => [styles.sideControl, endDisabled && styles.disabled, pressed && { backgroundColor: colors.soft }]}>
          <MaterialDesignIcons name="close" size={25} color={colors.muted} />
          <Text style={[typography.talkSideLabel, styles.label, { color: colors.muted }]}>End voice</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={[typography.holdLabel, styles.caption, { color: colors.primary }]}>{recording ? 'Let go to send.' : caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { width: '100%', maxWidth: 660, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, gap: 14 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sideControl: { flex: 1, minWidth: 66, minHeight: 64, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16 },
  label: { textAlign: 'center' },
  mic: { alignItems: 'center', justifyContent: 'center' },
  recordingRing: { position: 'absolute', top: -9, right: -9, bottom: -9, left: -9, borderWidth: 3 },
  caption: { minHeight: 20, textAlign: 'center' },
  disabled: { opacity: 0.65 },
});
