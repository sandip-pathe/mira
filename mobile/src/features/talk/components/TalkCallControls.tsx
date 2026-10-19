import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { VoiceState } from '../../../shared/voice';

export function TalkCallControls({
  state,
  textMode,
  caption,
  onToggleMode,
  onTalkPressIn,
  onTalkPressOut,
  onEnd,
}: {
  state: VoiceState;
  textMode: boolean;
  caption: string;
  onToggleMode: () => void;
  onTalkPressIn: () => void;
  onTalkPressOut: () => void;
  onEnd: () => void;
}) {
  const endDisabled = (state === 'disconnected' || state === 'error') && !textMode;

  return (
    <View style={styles.area}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textMode ? 'Switch to voice mode' : 'Type a message'}
          accessibilityState={{ selected: textMode }}
          onPress={onToggleMode}
          style={styles.sideControl}
        >
          {textMode ? (
            <MaterialDesignIcons name="microphone-outline" size={23} color="#5F706C" />
          ) : (
            <Text style={styles.sideIcon}>Aa</Text>
          )}
          <Text style={styles.sideLabel}>{textMode ? 'Voice' : 'Type'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold to speak and release to send. Hold while Mira speaks to interrupt. If voice is off, holding starts it and speaks when ready."
          accessibilityState={{
            busy: state === 'connecting' || state === 'reconnecting' || state === 'starting',
          }}
          onPressIn={onTalkPressIn}
          onPressOut={onTalkPressOut}
          style={({ pressed }) => [styles.mic, pressed && styles.micPressed]}
        >
          <MaterialDesignIcons name="microphone" size={56} color="#F6f6f6" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End voice session."
          accessibilityState={{ disabled: endDisabled }}
          disabled={endDisabled}
          onPress={onEnd}
          style={[styles.sideControl, endDisabled && styles.disabled]}
        >
          <MaterialDesignIcons name="close" size={32} color="#748278" />
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.caption}>
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    width: '100%',
    maxWidth: 660,
    alignSelf: 'center',
    paddingHorizontal: 26,
    paddingTop: 7,
    paddingBottom: 6,
    gap: 7,
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideControl: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#DDE0D8',
    shadowColor: '#748278',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    opacity: 0.84,
  },
  sideIcon: { fontSize: 21, lineHeight: 26, color: '#5F706C' },
  sideLabel: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: '#71807B' },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#397D5E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#244A39',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
    opacity: 0.86,
  },
  caption: { minHeight: 21, textAlign: 'center', fontSize: 13, lineHeight: 19, color: '#4C6660' },
  micPressed: { backgroundColor: '#2D674D', transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
});
