import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { VoiceState } from '../../../shared/voice';
import { colors } from '../../../components/ui';

const IDLE_BAR_HEIGHTS = [20, 32, 25, 40, 22];
const AUDIO_BAR_SHAPE = [0.66, 0.92, 0.75, 1, 0.62];

export function PresenceHero({
  state,
  title,
  subtitle,
  audioLevel,
  compact = false,
  welcome = false,
}: {
  state: VoiceState;
  title: string;
  subtitle: string;
  audioLevel: number;
  compact?: boolean;
  welcome?: boolean;
}) {
  const [bars] = useState(() => IDLE_BAR_HEIGHTS.map((height) => new Animated.Value(height)));
  const active = state === 'speaking' || state === 'recording' || state === 'starting';

  useEffect(() => {
    const level = active ? Math.max(0, Math.min(1, audioLevel * 10)) : 0;
    Animated.parallel(
      bars.map((bar, index) =>
        Animated.spring(bar, {
          toValue:
            (IDLE_BAR_HEIGHTS[index] + level * 22 * AUDIO_BAR_SHAPE[index]) * (compact ? 0.72 : 1),
          speed: 22,
          bounciness: 0,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [audioLevel, bars, active, compact]);

  return (
    <View style={[styles.hero, compact ? styles.compactHero : styles.centeredHero]}>
      {!compact && welcome ? (
        <WelcomeMascot />
      ) : (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.visualizer, compact && styles.compactVisualizer]}
      >
        {bars.map((bar, index) => (
          <Animated.View key={index} style={[styles.bar, { height: bar }]} />
        ))}
      </View>
      )}
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!subtitle && (
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function WelcomeMascot() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.mascotStage}
    >
      <View style={styles.mascotHalo}>
        <View style={[styles.sparkle, styles.sparkleTop]} />
        <View style={[styles.sparkle, styles.sparkleSide]} />
        <View style={styles.mascotShadow} />
        <View style={styles.mascotBody}>
          <View style={styles.mascotStem} />
          <View style={styles.mascotLeaf} />
          <View style={styles.mascotArmLeft} />
          <View style={styles.mascotArmRight} />
          <View style={styles.mascotFace}>
            <View style={styles.mascotEyes}>
              <View style={styles.mascotEye} />
              <View style={styles.mascotEye} />
            </View>
            <View style={styles.mascotSmile} />
            <View style={styles.mascotCheekLeft} />
            <View style={styles.mascotCheekRight} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 14,
  },
  centeredHero: {
    flex: 1,
    minHeight: 210,
    transform: [{ translateY: -48 }],
  },
  compactHero: {
    flex: 0,
    height: 136,
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 0,
  },
  visualizer: {
    width: 190,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  compactVisualizer: { height: 58 },
  bar: { width: 10, borderRadius: 999, backgroundColor: colors.accent },
  title: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.35,
  },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  mascotStage: { width: '100%', height: 208, alignItems: 'center', justifyContent: 'center' },
  mascotHalo: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4EDE2',
    borderWidth: 1,
    borderColor: '#CFDCCB',
  },
  mascotShadow: {
    position: 'absolute',
    width: 92,
    height: 14,
    bottom: 25,
    borderRadius: 10,
    backgroundColor: '#C2D1BE',
  },
  mascotBody: {
    position: 'absolute',
    top: 42,
    width: 104,
    height: 120,
    borderRadius: 52,
    alignItems: 'center',
    backgroundColor: colors.accent,
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  mascotStem: {
    position: 'absolute',
    top: -18,
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#6B936A',
  },
  mascotLeaf: {
    position: 'absolute',
    top: -23,
    width: 23,
    height: 14,
    borderRadius: 14,
    backgroundColor: '#89A96F',
    transform: [{ rotate: '-32deg' }],
  },
  mascotArmLeft: {
    position: 'absolute',
    left: -7,
    top: 77,
    width: 23,
    height: 17,
    borderRadius: 12,
    backgroundColor: '#367452',
    transform: [{ rotate: '24deg' }],
  },
  mascotArmRight: {
    position: 'absolute',
    right: -7,
    top: 77,
    width: 23,
    height: 17,
    borderRadius: 12,
    backgroundColor: '#367452',
    transform: [{ rotate: '-24deg' }],
  },
  mascotFace: {
    position: 'absolute',
    top: 29,
    width: 76,
    height: 67,
    borderRadius: 38,
    alignItems: 'center',
    backgroundColor: '#F7F3E9',
  },
  mascotEyes: { flexDirection: 'row', gap: 23, marginTop: 22 },
  mascotEye: { width: 6, height: 7, borderRadius: 4, backgroundColor: colors.ink },
  mascotSmile: {
    width: 14,
    height: 8,
    marginTop: 5,
    borderBottomWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.ink,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  mascotCheekLeft: {
    position: 'absolute',
    left: 9,
    top: 39,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#E8B9A1',
  },
  mascotCheekRight: {
    position: 'absolute',
    right: 9,
    top: 39,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#E8B9A1',
  },
  sparkle: { position: 'absolute', width: 8, height: 8, borderRadius: 5, backgroundColor: '#D5AA61' },
  sparkleTop: { top: 34, right: 42 },
  sparkleSide: { left: 35, bottom: 54, width: 6, height: 6, backgroundColor: '#9DB58A' },
});
