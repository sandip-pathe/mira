import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  ReduceMotion,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../../components/ui';

export function BreathingOrb({
  phase = 'still',
  durationMs = 4000,
  running = false,
  reduceMotion = false,
  size = 238,
}: {
  phase?: 'in' | 'out' | 'still';
  durationMs?: number;
  running?: boolean;
  reduceMotion?: boolean;
  size?: number;
}) {
  const { colors, art } = useTheme();
  const breath = useSharedValue(phase === 'in' ? 0 : phase === 'out' ? 1 : 0.5);

  React.useEffect(() => {
    cancelAnimation(breath);
    const target = phase === 'in' ? 1 : phase === 'out' ? 0 : 0.5;
    if (!running || reduceMotion || phase === 'still') {
      breath.set(reduceMotion && phase !== 'still' ? 0.5 : target);
      return;
    }
    breath.set(phase === 'in' ? 0 : 1);
    breath.set(withTiming(target, { duration: durationMs, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(breath);
  }, [breath, durationMs, phase, reduceMotion, running]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.82 + breath.get() * 0.18 }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size * 0.9, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size * 0.9} viewBox="0 0 280 252" style={{ position: 'absolute' }}>
        <Circle cx="140" cy="126" r="104" fill={art.ground} />
        <Circle cx="140" cy="126" r="103" fill="none" stroke={colors.line} strokeWidth="1.5" />
        <Ellipse cx="140" cy="211" rx="44" ry="8" fill={colors.line} opacity="0.7" />
        <Path d="M140 165 C140 132 138 105 140 78" stroke={art.primary} strokeWidth="5" strokeLinecap="round" />
        <Path d="M140 116 C119 107 111 96 107 82" stroke={art.primary} strokeWidth="3" strokeLinecap="round" />
        <Path d="M140 101 C159 94 168 82 171 69" stroke={art.primary} strokeWidth="3" strokeLinecap="round" />
        <Ellipse cx="114" cy="82" rx="18" ry="9" transform="rotate(34 114 82)" fill={art.primary} />
        <Ellipse cx="165" cy="70" rx="19" ry="9" transform="rotate(-30 165 70)" fill={art.primary} />
        <Circle cx="78" cy="117" r="3" fill={art.accent} />
        <Circle cx="199" cy="143" r="4" fill={art.accent} />
      </Svg>
      <Animated.View style={[{ width: size * 0.38, height: size * 0.38, borderRadius: size, alignItems: 'center', justifyContent: 'center' }, orbStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="47" fill={colors.primary} />
          <Circle cx="50" cy="50" r="39" fill={colors.surface} opacity="0.2" />
          <Path d="M50 69 C37 60 35 49 43 43 C48 39 53 43 55 48 C60 39 70 42 70 51 C70 60 60 66 50 69Z" fill={colors.onPrimary} />
          {reduceMotion && phase !== 'still' && <Circle cx={phase === 'in' ? 30 : 70} cy="50" r="4" fill={colors.onPrimary} />}
        </Svg>
      </Animated.View>
    </View>
  );
}
