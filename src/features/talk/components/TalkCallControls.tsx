import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Voice, VoiceState } from '../../../shared/voice';

export function TalkCallControls({
  state,
  error,
  textMode,
  ready,
  voice,
  caption,
  onToggleMode,
  onConnect,
  onEnd,
}: {
  state: VoiceState;
  error: string;
  textMode: boolean;
  ready: boolean;
  voice?: Voice;
  caption: string;
  onToggleMode: () => void;
  onConnect: () => void;
  onEnd: () => void;
}) {
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
          <Text style={styles.sideIcon}>{textMode ? 'Mic' : 'Aa'}</Text>
          <Text style={styles.sideLabel}>{textMode ? 'Voice' : 'Type'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            ready
              ? 'Hold to talk. Release to send. Hold while Mira speaks to interrupt.'
              : error
                ? 'Tap to retry voice connection'
                : 'Tap to connect voice, then hold to talk.'
          }
          accessibilityState={{ disabled: state === 'connecting', busy: state === 'connecting' }}
          disabled={state === 'connecting'}
          onPressIn={() => {
            if (ready) voice?.press();
            else onConnect();
          }}
          onPressOut={() => voice?.release()}
          style={({ pressed }) => [
            styles.mic,
            !!error && styles.micError,
            pressed && styles.micPressed,
          ]}
        >
          <View style={styles.micGlyph}>
            <View style={styles.micCapsule} />
            <View style={styles.micCradle} />
            <View style={styles.micStem} />
            <View style={styles.micBase} />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End session. This conversation will not be saved."
          accessibilityState={{ disabled: state === 'disconnected' && !textMode }}
          disabled={state === 'disconnected' && !textMode}
          onPress={onEnd}
          style={[styles.sideControl, state === 'disconnected' && !textMode && styles.disabled]}
        >
          <Text style={styles.endIcon}>x</Text>
          <Text style={styles.sideLabel}>End</Text>
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
  micError: { backgroundColor: '#527965' },
  micGlyph: { width: 32, height: 43, alignItems: 'center', justifyContent: 'flex-start' },
  micCapsule: { width: 12, height: 22, borderRadius: 7, backgroundColor: '#F7FAF4' },
  micCradle: {
    width: 24,
    height: 16,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#F7FAF4',
    marginTop: -3,
  },
  micStem: { width: 3, height: 7, backgroundColor: '#F7FAF4' },
  micBase: { width: 14, height: 3, borderRadius: 2, backgroundColor: '#F7FAF4' },
  endIcon: { fontSize: 26, lineHeight: 28, fontWeight: '400', color: '#E86F66' },
  caption: { minHeight: 21, textAlign: 'center', fontSize: 13, lineHeight: 19, color: '#4C6660' },
  micPressed: { backgroundColor: '#2D674D', transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
});
