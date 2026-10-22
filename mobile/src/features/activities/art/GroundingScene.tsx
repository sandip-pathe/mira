import React from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useTheme } from '../../../components/ui';

type Sense = 0 | 1 | 2;

/** A quiet sensory lens. It is decorative; the parent owns the large, accessible tap target. */
export function GroundingScene({ sense, rippleKey }: { sense: Sense; rippleKey: number }) {
  const { colors, art, paper } = useTheme();
  const reduceMotion = useReducedMotion();
  const entry = useSharedValue(1);
  const ripple = useSharedValue(1);
  const previousSense = React.useRef(sense);

  React.useEffect(() => {
    if (reduceMotion) entry.set(1);
    else if (previousSense.current !== sense) {
      entry.set(0);
      entry.set(withTiming(1, { duration: 400, reduceMotion: ReduceMotion.System }));
    }
    if (previousSense.current !== sense) {
      cancelAnimation(ripple);
      ripple.set(1);
    }
    previousSense.current = sense;
    return () => cancelAnimation(entry);
  }, [entry, reduceMotion, ripple, sense]);

  React.useEffect(() => {
    cancelAnimation(ripple);
    if (rippleKey === 0 || reduceMotion) ripple.set(1);
    else {
      ripple.set(0);
      ripple.set(withTiming(1, { duration: 620, reduceMotion: ReduceMotion.System }));
    }
    return () => cancelAnimation(ripple);
  }, [reduceMotion, ripple, rippleKey]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: entry.get(),
    transform: [{ translateY: 8 - entry.get() * 8 }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : 0.48 * (1 - ripple.get()),
    transform: [{ scale: reduceMotion ? 1 : 0.6 + ripple.get() * 0.9 }],
  }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 224, width: '100%', maxWidth: 430, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 156, height: 156, borderRadius: 80, borderWidth: 2, borderColor: art.primary }, rippleStyle]} />
      <Animated.View style={sceneStyle}>
        <Svg width={196} height={196} viewBox="0 0 196 196">
          <Circle cx="98" cy="98" r="78" fill={art.ground} />
          <Circle cx="98" cy="98" r="77" fill="none" stroke={colors.line} strokeWidth={1.5} />
          <Ellipse cx="98" cy="156" rx="36" ry="6" fill={colors.line} opacity={0.75} />
          {sense === 0 ? <>
            <Path d="M48 96Q98 48 148 96Q98 144 48 96Z" fill={art.paper} stroke={paper.primary} strokeWidth={3} strokeLinejoin="round" />
            <Circle cx="98" cy="96" r="20" fill={art.accent} />
            <Circle cx="98" cy="96" r="8" fill={paper.ink} />
            <Circle cx="66" cy="61" r="3" fill={art.accent} />
            <Circle cx="133" cy="126" r="4" fill={art.accent} />
          </> : sense === 1 ? <>
            <Circle cx="98" cy="98" r="18" fill={art.paper} stroke={paper.primary} strokeWidth={3} />
            <Path d="M126 75Q151 98 126 121M137 62Q172 98 137 134M70 75Q45 98 70 121" fill="none" stroke={art.primary} strokeWidth={3} strokeLinecap="round" />
            <Circle cx="97" cy="98" r="5" fill={art.accent} />
          </> : <>
            <Circle cx="98" cy="98" r="31" fill={art.paper} stroke={paper.primary} strokeWidth={3} />
            <Path d="M98 117V91C98 76 119 76 119 91V104M98 99C98 84 78 84 78 99V109M98 106C98 94 66 95 72 111C78 126 103 130 119 114" fill="none" stroke={paper.primary} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="145" cy="71" r="4" fill={art.accent} />
          </>}
          <Circle cx="43" cy="120" r="3" fill={art.accent} />
          <Circle cx="153" cy="128" r="4" fill={art.accent} />
        </Svg>
      </Animated.View>
    </View>
  );
}
