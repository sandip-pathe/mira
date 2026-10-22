import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../../components/ui';

type ReachOutPhase = 'home' | 'editor' | 'preview';

/** A drafted note and an open path; nothing in the scene implies a message was sent. */
export function ReachOutArtwork({ phase = 'home', height = 174 }: { phase?: ReachOutPhase; height?: number }) {
  const { colors, art, paper } = useTheme();
  const progress = useSharedValue(phase === 'preview' ? 1 : 0);
  React.useEffect(() => {
    progress.set(withTiming(phase === 'preview' ? 1 : 0, { duration: 380, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(progress);
  }, [phase, progress]);
  const noteStyle = useAnimatedStyle(() => ({ transform: [{ translateY: progress.get() * -7 }, { rotate: `${progress.get() * -3}deg` }] }));
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: '100%', height, maxWidth: 360, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
    <Svg width="100%" height="100%" viewBox="0 0 360 180">
      <Circle cx="180" cy="91" r="73" fill={art.ground} />
      <Path d="M53 137 C84 115 110 121 136 137 M232 139 C262 122 287 121 311 137" fill="none" stroke={colors.line} strokeWidth="3" strokeLinecap="round" />
      <Circle cx="278" cy="48" r="16" fill={art.accent} />
      <Path d="M81 88 Q81 78 93 78 H112 Q124 78 124 88 V97 Q124 107 112 107 H99 L90 114 V106 Q81 103 81 97Z" fill={art.paper} stroke={paper.primary} strokeWidth="2" />
      <Path d="M93 91 H111 M93 98 H106" stroke={paper.muted} strokeWidth="2" strokeLinecap="round" />
      <Path d="M124 133 C143 120 154 112 177 111 C200 110 220 120 238 133" fill="none" stroke={art.primary} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <Rect x="130" y="48" width="108" height="91" rx="10" fill={art.paper} stroke={paper.primary} strokeWidth="2" />
      <Path d="M147 72 H219 M147 84 H211 M147 96 H199 M147 119 C162 109 174 106 185 107" fill="none" stroke={paper.muted} strokeWidth="3" strokeLinecap="round" />
      <Path d="M199 120 L214 107 L229 120" fill="none" stroke={paper.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
    <Animated.View style={[{ position: 'absolute', left: '68%', top: '30%', width: 17, height: 17, borderRadius: 4, backgroundColor: art.accent }, noteStyle]} />
  </View>;
}
