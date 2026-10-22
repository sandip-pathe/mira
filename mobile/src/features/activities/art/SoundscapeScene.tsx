import React from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../../components/ui';
import type { SoundscapeId } from '../experiences/one-song/soundscapeData';

/** Scene-owned art responds to the playback state and observes reduced motion. */
export function SoundscapeScene({ scene, playing, reduceMotion = false }: { scene: SoundscapeId; playing: boolean; reduceMotion?: boolean }) {
  const { colors, art, paper } = useTheme();
  const drift = useSharedValue(0.5);
  React.useEffect(() => {
    cancelAnimation(drift);
    drift.set(0.5);
    if (playing && !reduceMotion) {
      drift.set(withRepeat(withTiming(1, { duration: scene === 'rain' ? 1900 : 3400, reduceMotion: ReduceMotion.System }), -1, true, undefined, ReduceMotion.System));
    }
    return () => cancelAnimation(drift);
  }, [drift, playing, reduceMotion, scene]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: (drift.get() - 0.5) * (scene === 'rain' ? 5 : 8) }, { translateX: scene === 'shore' ? drift.get() * 8 : 0 }], opacity: 0.72 + drift.get() * 0.28 }));
  const p = { sky: art.ground, land: colors.line, ink: art.primary, light: colors.surface };
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 230, borderRadius: 30, overflow: 'hidden', backgroundColor: p.sky }}>
    <Svg width="100%" height="100%" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid slice">
      <Defs><LinearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={p.sky} /><Stop offset="1" stopColor={p.light} /></LinearGradient></Defs>
      <Rect width="360" height="230" fill={`url(#sky-${scene})`} />
      {scene === 'rain' ? <>
        <Circle cx="286" cy="47" r="18" fill={art.accent} opacity="0.8" />
        <Path d="M0 160 C52 143 95 151 129 165 C194 190 270 147 360 163 V230 H0Z" fill={p.land} />
        <Rect x="69" y="52" width="105" height="108" rx="50" fill={art.paper} stroke={paper.primary} strokeWidth="4" />
        <Rect x="81" y="66" width="81" height="82" rx="39" fill={art.ground} />
        <Path d="M121 67V149 M82 107H161" stroke={paper.muted} strokeWidth="3" />
        <Path d="M199 69l-8 21m35-35-8 21m28 11-8 21m36-37-8 21m-84 46-8 21m41-12-8 21m34-20-8 21" stroke={p.ink} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        <Path d="M264 159c12-9 24-8 34 0m-20 4h9" fill="none" stroke={art.primary} strokeWidth="4" strokeLinecap="round" />
      </> : null}
      {scene === 'canopy' ? <>
        <Circle cx="278" cy="47" r="23" fill={art.accent} />
        <Path d="M0 168 C67 148 102 153 147 173 C215 199 273 147 360 165 V230 H0Z" fill={p.land} />
        <Path d="M178 195V65 M179 101C124 109 111 72 108 58c36-2 66 11 71 43m0 18c53-5 65-41 67-58-39 0-66 15-67 47m-1 26c-47 0-58-29-60-44 31-3 54 8 60 32m1-3c41-2 52-27 54-42-27-2-48 8-54 29" fill="none" stroke={p.ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <Ellipse cx="91" cy="124" rx="21" ry="11" fill={art.primary} transform="rotate(-28 91 124)" /><Ellipse cx="266" cy="108" rx="23" ry="12" fill={colors.muted} transform="rotate(29 266 108)" />
        <Circle cx="78" cy="73" r="3" fill={art.primary} /><Circle cx="89" cy="69" r="2" fill={art.primary} /><Path d="M75 72q4-5 8 0m0 0q4-5 8 0" fill="none" stroke={art.primary} strokeWidth="2" />
      </> : null}
      {scene === 'shore' ? <>
        <Circle cx="279" cy="48" r="22" fill={art.accent} />
        <Path d="M0 127 C54 117 89 132 132 125 C194 115 251 126 360 117 V230 H0Z" fill={colors.line} />
        <Path d="M0 151 C48 138 94 166 148 151 C202 137 263 160 360 145 M0 181 C64 164 101 194 165 178 C227 162 285 191 360 173 M0 207 C55 194 99 215 155 203 C218 190 278 216 360 198" fill="none" stroke={colors.surface} strokeWidth="5" strokeLinecap="round" />
        <Path d="M0 220 C75 211 99 224 155 216 C221 207 278 222 360 214 V230 H0Z" fill={art.accent} />
        <Path d="M35 113q19-18 39 0m20-13q16-16 32 0m147 6q19-18 38 0" fill="none" stroke={p.ink} strokeWidth="3" strokeLinecap="round" opacity="0.62" />
      </> : null}
    </Svg>
    {scene === 'rain' ? <Animated.View style={[{ position: 'absolute', left: '57%', top: '25%', flexDirection: 'row', gap: 19 }, motion]}><View style={{ width: 2, height: 38, borderRadius: 2, backgroundColor: p.ink, opacity: 0.48 }} /><View style={{ width: 2, height: 26, marginTop: 21, borderRadius: 2, backgroundColor: p.ink, opacity: 0.38 }} /><View style={{ width: 2, height: 42, marginTop: 8, borderRadius: 2, backgroundColor: p.ink, opacity: 0.32 }} /></Animated.View> : null}
    {scene === 'canopy' ? <Animated.View style={[{ position: 'absolute', right: '16%', top: '25%', flexDirection: 'row', gap: 6 }, motion]}><View style={{ width: 25, height: 12, borderTopLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: art.primary, transform: [{ rotate: '-28deg' }] }} /><View style={{ width: 22, height: 11, marginTop: 18, borderTopLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: colors.muted, transform: [{ rotate: '26deg' }] }} /></Animated.View> : null}
    {scene === 'shore' ? <Animated.View style={[{ position: 'absolute', left: '43%', top: '66%', width: '54%', gap: 18 }, motion]}><View style={{ width: '72%', height: 2, borderRadius: 2, backgroundColor: colors.surface, opacity: 0.8 }} /><View style={{ width: '90%', height: 2, borderRadius: 2, backgroundColor: colors.surface, opacity: 0.65 }} /></Animated.View> : null}
  </View>;
}
