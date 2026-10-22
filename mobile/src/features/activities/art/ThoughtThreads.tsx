import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../../components/ui';

export function ThoughtThreads({ gathered = false, height = 126, selected }: {
  gathered?: boolean;
  height?: number;
  selected?: 'heavy' | 'wait' | 'thread';
}) {
  const { art, colors } = useTheme();
  const progress = useSharedValue(gathered ? 1 : 0);

  React.useEffect(() => {
    progress.set(withTiming(gathered ? 1 : 0, { duration: 680, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(progress);
  }, [gathered, progress]);

  const looseStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get(), transform: [{ scale: 1 - progress.get() * 0.06 }] }));
  const gatheredStyle = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ scale: 0.94 + progress.get() * 0.06 }] }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.frame, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, looseStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 360 140">
          <Path d="M18 98 C50 38 79 124 111 68 S167 38 193 96 S244 119 266 51 S316 35 342 77" fill="none" stroke={art.primary} strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M25 54 C70 95 78 26 124 57 S168 123 204 64 S255 32 282 89 S323 114 343 50" fill="none" stroke={art.accent} strokeWidth="1.7" strokeLinecap="round" opacity="0.88" />
          <Path d="M31 118 C68 83 87 94 118 39 S173 27 202 103 S250 111 276 70 S319 55 337 107" fill="none" stroke={colors.muted} strokeWidth="1.7" strokeLinecap="round" />
          <Circle cx="80" cy="58" r="4" fill={art.accent} />
          <Circle cx="270" cy="52" r="5" fill={art.primary} />
          <Circle cx="188" cy="96" r="3" fill={art.accent} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, gatheredStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 360 140">
          <Path d="M42 112 C108 111 135 85 177 69 C205 58 230 59 260 54" fill="none" stroke={art.primary} strokeWidth={selected === 'heavy' ? 3.2 : 2.4} strokeLinecap="round" opacity={!selected || selected === 'heavy' ? 1 : 0.26} />
          <Path d="M52 36 C105 42 143 61 177 69 C208 76 231 86 272 104" fill="none" stroke={art.accent} strokeWidth={selected === 'wait' ? 3 : 2} strokeLinecap="round" opacity={!selected || selected === 'wait' ? 0.94 : 0.26} />
          <Path d="M85 125 C120 105 144 83 177 69 C211 54 241 35 290 32" fill="none" stroke={colors.muted} strokeWidth={selected === 'thread' ? 3 : 2} strokeLinecap="round" opacity={!selected || selected === 'thread' ? 1 : 0.26} />
          <Circle cx="177" cy="69" r="15" fill={art.ground} />
          <Circle cx="177" cy="69" r="7" fill={art.primary} />
          <Circle cx="260" cy="54" r="4" fill={art.primary} />
          <Circle cx="272" cy="104" r="4" fill={art.accent} />
          <Circle cx="290" cy="32" r="4" fill={colors.muted} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ frame: { width: '100%', maxWidth: 360, alignSelf: 'center' } });
