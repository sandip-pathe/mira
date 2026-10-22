import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../../components/ui';

export function LetterEnvelope({ opened = false, releaseProgress = 0, width = 206 }: { opened?: boolean; releaseProgress?: number; width?: number }) {
  const { colors, art, paper } = useTheme();
  const progress = useSharedValue(opened ? 1 : 0);
  const release = useSharedValue(releaseProgress);

  React.useEffect(() => {
    progress.set(withTiming(opened ? 1 : 0, { duration: 520, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(progress);
  }, [opened, progress]);
  React.useEffect(() => {
    release.set(withTiming(releaseProgress, { duration: 420, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(release);
  }, [release, releaseProgress]);

  const letterStyle = useAnimatedStyle(() => ({
    opacity: (0.86 + progress.get() * 0.14) * (1 - release.get()),
    transform: [{ translateY: 44 - progress.get() * 66 - release.get() * 92 }, { scale: 1 - release.get() * 0.12 }],
  }));
  const closedFlapStyle = useAnimatedStyle(() => ({ opacity: (1 - progress.get()) * (1 - release.get()) }));
  const openFlapStyle = useAnimatedStyle(() => ({ opacity: progress.get() * (1 - release.get()) }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: width * 0.77, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[{ position: 'absolute', top: '3%', zIndex: 0 }, letterStyle]}>
        <Svg width={width * 0.62} height={width * 0.63} viewBox="0 0 128 130">
          <Path d="M17 12 Q64 4 111 12 L108 115 Q64 123 20 115Z" fill={art.paper} stroke={paper.muted} strokeWidth="2" />
          <Path d="M32 39 H95 M32 51 H88 M32 63 H92 M32 75 H80" stroke={paper.muted} strokeWidth="2" strokeLinecap="round" />
          <Path d="M32 91 C49 84 61 98 79 91" fill="none" stroke={art.accent} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Svg width={width} height={width * 0.68} viewBox="0 0 220 150" style={{ position: 'absolute', bottom: 0, zIndex: 1 }}>
        <Path d="M12 36 Q12 27 22 27 H198 Q208 27 208 37 V125 Q208 134 198 134 H22 Q12 134 12 125Z" fill={colors.surface} stroke={art.primary} strokeWidth="2" />
        <Path d="M14 42 L88 91 Q110 107 132 91 L206 42 V124 Q206 132 197 132 H23 Q14 132 14 124Z" fill={art.ground} stroke={art.primary} strokeWidth="2" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', bottom: 3, zIndex: 2 }, closedFlapStyle]}>
        <Svg width={width} height={width * 0.68} viewBox="0 0 220 150">
          <Path d="M14 42 L87 97 Q110 115 133 97 L206 42 V124 Q206 132 197 132 H23 Q14 132 14 124Z" fill={art.ground} stroke={art.primary} strokeWidth="2" />
          <Path d="M91 91 Q110 78 129 91 L110 111Z" fill={art.accent} />
          <Circle cx="110" cy="104" r="9" fill={art.accent} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', bottom: 3, zIndex: 2 }, openFlapStyle]}>
        <Svg width={width} height={width * 0.68} viewBox="0 0 220 150">
          <Path d="M14 42 L110 94 L206 42" fill="none" stroke={art.primary} strokeWidth="2" />
          <Path d="M14 43 L110 104 L206 43 L206 124 Q206 132 197 132 H23 Q14 132 14 124Z" fill={art.ground} stroke={art.primary} strokeWidth="2" />
          <Path d="M93 101 Q110 88 127 101 L110 119Z" fill={art.accent} />
        </Svg>
      </Animated.View>
    </View>
  );
}
