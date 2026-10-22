import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { VoiceState } from '../../../shared/voice';
import { useTheme } from '../../../components/ui';
import { BrandArtwork, type BrandArtworkPart } from '../../../components/ui/BrandArtwork';

export function PresenceHero({ state, title, subtitle, audioLevel, compact = false, welcome = false, motionAllowed, onConversation }: {
  state: VoiceState;
  title: string;
  subtitle: string;
  audioLevel: number;
  compact?: boolean;
  welcome?: boolean;
  motionAllowed: boolean;
  onConversation: () => void;
}) {
  const { colors, typography } = useTheme();
  const [availableSize, setAvailableSize] = React.useState(250);
  const drift = useSharedValue(0);
  const lean = useSharedValue(0);
  const opacity = useSharedValue(1);
  const meter = useSharedValue(0);
  const waiting = state === 'processing' || state === 'finalizing';
  const audioActive = state === 'recording' || state === 'speaking';
  const idle = ['ready', 'idle', 'disconnected'].includes(state);
  const part: BrandArtworkPart = state === 'recording' ? 'listening' : waiting ? 'thinking' : state === 'speaking' ? 'speaking' : 'companion';
  const size = Math.min(compact ? 150 : 250, availableSize);

  React.useEffect(() => {
    cancelAnimation(drift);
    drift.set(0);
    if (motionAllowed && (idle || state === 'speaking')) {
      drift.set(withRepeat(withTiming(1, { duration: state === 'speaking' ? 1000 : 3000, easing: Easing.inOut(Easing.ease) }), -1, true));
    }
    return () => cancelAnimation(drift);
  }, [drift, idle, motionAllowed, state]);

  React.useEffect(() => {
    const target = state === 'recording' ? -2 : 0;
    lean.set(motionAllowed ? withTiming(target, { duration: 180 }) : target);
    opacity.set(motionAllowed ? 0.9 : 1);
    if (motionAllowed) opacity.set(withTiming(1, { duration: 160 }));
    return () => { cancelAnimation(lean); cancelAnimation(opacity); };
  }, [lean, motionAllowed, opacity, state]);

  React.useEffect(() => {
    const value = audioActive ? Math.max(0, Math.min(1, audioLevel * 10)) : 0;
    meter.set(motionAllowed ? withTiming(value, { duration: 80 }) : value);
    return () => cancelAnimation(meter);
  }, [audioActive, audioLevel, meter, motionAllowed]);

  const artworkStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [
      { translateY: lean.get() - drift.get() * 3 },
      { rotate: (state === 'recording' ? -1 : state === 'speaking' ? drift.get() : 0) + 'deg' },
    ],
  }));
  const meterStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: motionAllowed ? Math.max(0.05, meter.get()) : 1 }],
  }));

  return (
    <View style={styles.hero}>
      <View accessibilityLiveRegion="polite" style={styles.greeting}>
        <Text accessibilityRole="header" style={[compact ? typography.talkOfferHeading : welcome ? typography.talkWelcome : typography.talkReady, styles.title, { color: colors.ink }]}>{title}</Text>
        {!!subtitle && <Text style={[compact ? typography.support : typography.talkHelper, styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>}
      </View>
      <View style={[styles.stage, compact && styles.compactStage]} onLayout={({ nativeEvent: { layout } }) => setAvailableSize(Math.max(80, Math.floor(Math.min(layout.width - 24, layout.height - 28))))}>
        <Animated.View style={artworkStyle}><BrandArtwork part={part} size={size} /></Animated.View>
        {waiting && <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.waiting, { color: colors.primary }]}>•••</Text>}
        {audioActive && <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.meter, { backgroundColor: colors.accent }, meterStyle]} />}
        <Pressable accessibilityRole="button" accessibilityLabel="Show conversation" onPress={onConversation} style={({ pressed }) => [styles.conversation, pressed && { backgroundColor: colors.soft }]}>
          <MaterialDesignIcons name="closed-caption-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexGrow: 1, flexShrink: 0, gap: 8 },
  greeting: { width: '100%', maxWidth: 320, alignSelf: 'center', gap: 12 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  stage: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center', paddingBottom: 28 },
  compactStage: { minHeight: 158 },
  conversation: { position: 'absolute', bottom: 0, right: -8, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  waiting: { position: 'absolute', bottom: 4, fontSize: 22, letterSpacing: 6 },
  meter: { position: 'absolute', bottom: 12, width: 72, height: 6, borderRadius: 3 },
});
