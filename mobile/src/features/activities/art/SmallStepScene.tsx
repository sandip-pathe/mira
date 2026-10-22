import React from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../../components/ui';
import Svg, { Circle, Path } from 'react-native-svg';

type SceneState = 'thought' | 'action' | 'trying' | 'complete';

/** Small, activity-owned scene; the card rises as a thought becomes a doable move. */
export function SmallStepScene({ state = 'thought', timerProgress = 1 }: { state?: SceneState; timerProgress?: number }) {
  const { colors, art, paper } = useTheme();
  const progress = useSharedValue(state === 'thought' ? 0 : 1);
  React.useEffect(() => {
    progress.set(withTiming(state === 'thought' ? 0 : 1, { duration: 420, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(progress);
  }, [progress, state]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: 0.78 + progress.get() * 0.22,
    transform: [{ translateY: 12 - progress.get() * 12 }, { rotate: `${-3 + progress.get() * 3}deg` }],
  }));
  const sproutStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.6 + progress.get() * 0.4 }],
  }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 144, borderRadius: 26, backgroundColor: art.ground, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 144" preserveAspectRatio="xMidYMid meet">
        <Circle cx="68" cy="112" r="3" fill={art.accent} />
        <Circle cx="295" cy="33" r="4" fill={colors.muted} />
        <Path d="M34 103 C74 72 101 119 137 93" fill="none" stroke={colors.line} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
        <Path d="M223 108 C256 78 277 96 318 64" fill="none" stroke={colors.line} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: 132, height: 86, borderRadius: 17, backgroundColor: art.paper, borderColor: paper.muted, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }, cardStyle]}>
        <View style={{ height: 5, width: 70, borderRadius: 4, backgroundColor: paper.primary }} />
        <View style={{ height: 5, width: 48, borderRadius: 4, backgroundColor: paper.muted, alignSelf: 'center' }} />
        <Animated.View style={[{ position: 'absolute', top: -21, right: 20 }, sproutStyle]}>
          <Svg width={26} height={27} viewBox="0 0 26 27">
            <Path d="M13 25V12" stroke={art.primary} strokeWidth={3} strokeLinecap="round" />
            <Path d="M13 14C2 12 3 3 3 3s10-1 10 11" fill={colors.muted} />
            <Path d="M13 11C14 2 23 2 23 2s2 8-10 12" fill={art.primary} />
          </Svg>
        </Animated.View>
      </Animated.View>
      {state === 'trying' ? <Svg width={36} height={40} viewBox="0 0 36 40" style={{ position: 'absolute', right: '19%', top: 50 }}>
        <Path d="M8 4H28M8 36H28M11 5C11 14 25 17 25 23S11 27 11 35M25 5C25 14 11 17 11 23S25 27 25 35" fill="none" stroke={art.primary} strokeWidth={2} strokeLinecap="round" />
        <Path d={`M13 8H23L18 ${8 + Math.max(0, Math.min(1, timerProgress)) * 9}Z`} fill={art.accent} />
        <Path d={`M18 ${32 - Math.max(0, Math.min(1, timerProgress)) * 8}L13 25H23Z`} fill={art.accent} />
      </Svg> : null}
      {state === 'complete' ? <View style={{ position: 'absolute', right: '31%', bottom: 24, width: 9, height: 9, borderRadius: 9, backgroundColor: art.accent }} /> : null}
    </View>
  );
}
