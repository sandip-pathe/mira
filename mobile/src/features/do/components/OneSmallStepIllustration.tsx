import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../components/ui';

export function OneSmallStepIllustration() {
  return (
    <View accessibilityElementsHidden style={{ height: 136, borderRadius: 24, backgroundColor: '#F1F3EC', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 30, top: 30, width: 74, height: 52, borderRadius: 12, backgroundColor: '#E0E7DD', transform: [{ rotate: '-10deg' }] }} />
      <View style={{ position: 'absolute', left: 43, top: 40, width: 74, height: 52, borderRadius: 12, backgroundColor: '#D2DED2', transform: [{ rotate: '6deg' }] }} />
      <View style={{ position: 'absolute', left: 56, top: 49, width: 74, height: 52, borderRadius: 12, backgroundColor: '#FFFEFB', borderWidth: 1, borderColor: '#A8BBA9', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 43, height: 4, borderRadius: 2, backgroundColor: '#9AB09C', marginVertical: 3 }} />
        <View style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: '#C3D0C2', marginVertical: 3, alignSelf: 'flex-start', marginLeft: 14 }} />
      </View>
      <View style={{ position: 'absolute', right: 36, bottom: 22, width: 55, height: 24, borderRadius: 28, backgroundColor: '#A9C2AD', transform: [{ rotate: '-18deg' }] }} />
      <View style={{ position: 'absolute', right: 52, bottom: 40, width: 28, height: 18, borderRadius: 18, backgroundColor: colors.accentSoft, transform: [{ rotate: '-18deg' }] }} />
    </View>
  );
}
