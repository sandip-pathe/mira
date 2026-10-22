import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../../components/ui';
import type { MoveScenePhase } from '../experiences/move-scene/useMoveSceneExperience';

type Scene = 'intro' | 'choice' | 'prepare' | 'away' | 'returned' | 'done';

/** An open doorway and a small path make the away-and-return beat visible. */
export function MoveSceneArtwork({ scene, reduceMotion = false }: { scene: Scene; reduceMotion?: boolean }) {
  const { colors, art, paper } = useTheme();
  const target = scene === 'away' ? 1 : scene === 'returned' || scene === 'done' ? 0.45 : 0;
  const progress = useSharedValue(target);
  React.useEffect(() => {
    progress.set(withTiming(target, { duration: 520, reduceMotion: reduceMotion ? ReduceMotion.Always : ReduceMotion.System }));
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion, target]);
  const doorStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 500 }, { rotateY: `${progress.get() * -48}deg` }, { translateX: progress.get() * 5 }], opacity: 1 - progress.get() * 0.08 }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.45 + progress.get() * 0.55, transform: [{ scale: 0.9 + progress.get() * 0.1 }] }));
  const away = scene === 'away';
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.wrapper}>
    <View style={[styles.scene, { backgroundColor: art.ground }]}>
      <Svg width="100%" height="100%" viewBox="0 0 360 196" preserveAspectRatio="xMidYMid meet">
        <Circle cx="283" cy="42" r="22" fill={art.accent} />
        <Path d="M0 158 C48 134 88 147 124 160 C183 182 255 147 360 158 V196 H0Z" fill={colors.surface} />
        <Path d="M32 158 C92 149 125 171 184 160 C237 151 278 146 336 159" fill="none" stroke={colors.muted} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        <Path d="M126 158 V79 C126 45 150 25 180 25 C210 25 234 45 234 79 V158" fill={art.paper} stroke={paper.primary} strokeWidth="5" />
        <Rect x="140" y="80" width="80" height="77" rx="3" fill={away ? art.accent : art.ground} />
        <Path d="M180 81 V156 M141 119 H219" stroke={paper.muted} strokeWidth="3" />
        <Path d="M180 156 V178" stroke={art.primary} strokeWidth="5" strokeLinecap="round" />
        <Circle cx="207" cy="120" r="3" fill={art.primary} />
        {away && <><Circle cx="83" cy="154" r="4" fill={art.primary} /><Circle cx="67" cy="145" r="4" fill={colors.muted} /><Circle cx="52" cy="136" r="4" fill={art.primary} /></>}
        {(scene === 'returned' || scene === 'done') && <><Path d="M246 136 C268 122 281 123 298 132" fill="none" stroke={art.primary} strokeWidth="3" strokeLinecap="round" /><Circle cx="301" cy="132" r="5" fill={art.accent} /></>}
        <Path d="M36 158 V107 M36 119 C18 119 17 103 17 103 S35 101 36 118 M36 127 C54 127 55 111 55 111 S37 109 36 126" fill="none" stroke={art.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Animated.View style={[styles.door, { backgroundColor: art.ground, borderColor: art.primary }, doorStyle]}>
        <View style={[styles.knob, { backgroundColor: art.primary }]} />
      </Animated.View>
      <Animated.View style={[styles.glow, { borderColor: art.accent }, glowStyle]} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { height: 196, width: '100%', alignItems: 'center', justifyContent: 'center' },
  scene: { width: '100%', maxWidth: 360, aspectRatio: 360 / 196, borderRadius: 28, overflow: 'hidden' },
  door: { position: 'absolute', left: '38.889%', top: '41.327%', height: '38.776%', width: '22.222%', borderRadius: 3, borderRightWidth: 3, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 7 },
  knob: { height: 5, width: 5, borderRadius: 3 },
  glow: { position: 'absolute', top: '10.204%', left: '72.5%', width: '12.222%', height: '22.449%', borderRadius: 999, borderWidth: 1 },
});

export type { MoveScenePhase };
