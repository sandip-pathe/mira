import React from 'react';
import { View } from 'react-native';
import { colors, Surface } from '../../../components/ui';

export function GroundingIllustration({ sense }: { sense: number }) {
  const line = '#78917C';
  const art = sense === 0 ? (
    <View accessibilityElementsHidden style={{ height: 142, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 142, height: 112, borderWidth: 3, borderColor: line, borderRadius: 18, backgroundColor: '#EAF0E7', overflow: 'hidden', flexDirection: 'row' }}>
        <View style={{ flex: 1, borderRightWidth: 2, borderColor: line, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 36, height: 50, borderWidth: 3, borderColor: line, borderRadius: 18, backgroundColor: '#FFFEFB' }} /></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 36, height: 50, borderWidth: 3, borderColor: line, borderRadius: 18, backgroundColor: '#FFFEFB' }} /></View>
      </View>
      <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.accent, backgroundColor: '#F6F3EC', alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent }} /></View>
    </View>
  ) : sense === 1 ? (
    <View accessibilityElementsHidden style={{ height: 142, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
      <View style={{ width: 58, height: 76, borderTopLeftRadius: 32, borderBottomLeftRadius: 32, borderWidth: 3, borderRightWidth: 0, borderColor: line, backgroundColor: '#EAF0E7' }} />
      {[22, 34, 46].map((height) => <View key={height} style={{ width: 3, height, borderRadius: 2, backgroundColor: colors.accent }} />)}
    </View>
  ) : (
    <View accessibilityElementsHidden style={{ height: 142, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 114, height: 76, borderRadius: 24, backgroundColor: '#EAF0E7', borderWidth: 2, borderColor: line, transform: [{ rotate: '-5deg' }], alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 62, height: 36, borderRadius: 18, backgroundColor: '#FFFEFB', borderWidth: 2, borderColor: line }} />
      </View>
      <View style={{ position: 'absolute', bottom: 14, width: 126, height: 8, borderRadius: 4, backgroundColor: '#D9E2D7' }} />
    </View>
  );
  return <Surface style={{ paddingVertical: 4, backgroundColor: '#F4F5EF' }}>{art}</Surface>;
}
