import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../../components/ui';

/** Small petal-and-ripple scene that opens as the person finds a word. */
export function NoticeNameArtwork({ selectedCount = 0, complete = false }: { selectedCount?: number; complete?: boolean }) {
  const { art, colors } = useTheme();
  const openness = useSharedValue(Math.min(1, selectedCount / 3));
  React.useEffect(() => {
    openness.set(withTiming(complete ? 1 : Math.min(1, selectedCount / 3), { duration: 420, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(openness);
  }, [complete, openness, selectedCount]);
  const flowerStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.88 + openness.get() * 0.12 }, { translateY: openness.get() * -3 }] }));
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: '100%', maxWidth: 360, height: 164, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
    <Svg width="100%" height="100%" viewBox="0 0 360 164">
      <Path d="M31 127 C65 98 92 104 119 127 M241 127 C267 108 298 103 330 124" fill="none" stroke={colors.line} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="180" cy="98" r="58" fill={art.ground} />
      <Circle cx="180" cy="98" r="43" fill={colors.surface} stroke={colors.line} strokeWidth="2" />
      <Path d="M180 101 C178 121 168 130 154 139 M180 104 C188 122 198 130 211 137" fill="none" stroke={art.primary} strokeWidth="4" strokeLinecap="round" />
      <Ellipse cx="153" cy="60" rx="14" ry="20" fill={selectedCount > 0 || complete ? art.accent : colors.line} />
      <Ellipse cx="207" cy="60" rx="14" ry="20" fill={selectedCount > 1 || complete ? colors.muted : colors.line} />
      <Ellipse cx="180" cy="46" rx="14" ry="20" fill={selectedCount > 2 || complete ? art.primary : colors.line} />
      <Circle cx="180" cy="82" r="16" fill={art.accent} stroke={art.primary} strokeWidth="2" />
      <Circle cx="106" cy="68" r="4" fill={art.accent} /><Circle cx="253" cy="52" r="3" fill={art.primary} />
      <Path d="M43 42 C62 34 80 35 96 42 M264 85 C282 77 298 79 314 87" fill="none" stroke={art.accent} strokeWidth="2" strokeLinecap="round" />
    </Svg>
    <Animated.View style={[{ position: 'absolute', left: '50%', top: 91, marginLeft: -3, width: 6, height: 41, borderRadius: 4, backgroundColor: art.primary }, flowerStyle]} />
  </View>;
}
