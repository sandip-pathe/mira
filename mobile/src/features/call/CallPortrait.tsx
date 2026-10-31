import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BrandArtwork } from '../../components/ui/BrandArtwork';
import { callController } from './callController';
import { callColors as c } from './callAppearance';

export function CallPortrait({ size, motionAllowed, connected }: {
  size: number; motionAllowed: boolean; connected: boolean;
}) {
  const breath = useSharedValue(0);
  const level = useSharedValue(0);
  React.useEffect(() => {
    cancelAnimation(breath); breath.set(0);
    if (motionAllowed) breath.set(withRepeat(withTiming(1, {
      duration: connected ? 2600 : 1600, easing: Easing.inOut(Easing.ease),
    }), -1, true));
    return () => cancelAnimation(breath);
  }, [breath, motionAllowed, connected]);
  React.useEffect(() => {
    level.set(0);
    if (!motionAllowed || !connected) return;
    let active = true;
    let reading = false;
    const timer = setInterval(async () => {
      if (reading) return;
      reading = true;
      try {
        const value = await callController.getAudioLevel();
        if (active) level.set(withTiming(Math.min(1, value * 5), { duration: 180 }));
      } finally { reading = false; }
    }, 180);
    return () => { active = false; clearInterval(timer); cancelAnimation(level); };
  }, [connected, level, motionAllowed]);
  const halo = useAnimatedStyle(() => ({
    opacity: 0.15 + breath.get() * 0.08 + level.get() * 0.2,
    transform: [{ scale: 1 + breath.get() * 0.025 + level.get() * 0.07 }],
  }));
  const portrait = useAnimatedStyle(() => ({ transform: [{ translateY: -breath.get() * 3 }] }));
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.stage, { width: size + 48, height: size + 48 }]}>
    <Animated.View style={[styles.halo, { width: size + 28, height: size + 28, borderRadius: size }, halo]} />
    <View style={[styles.orbit, { width: size + 46, height: size + 46, borderRadius: size }]} />
    <View style={[styles.medallion, { width: size, height: size, borderRadius: size }]}>
      <Animated.View style={portrait}><BrandArtwork part="companion" size={size * 0.92} /></Animated.View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: c.halo },
  orbit: { position: 'absolute', borderWidth: 1, borderColor: '#C39D6E20' },
  medallion: { backgroundColor: c.portrait, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D2AF7D30' },
});
