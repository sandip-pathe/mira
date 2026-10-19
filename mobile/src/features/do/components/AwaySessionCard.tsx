import React from 'react';
import { Text, View } from 'react-native';
import { ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';

/** Static away-state artwork and copy shared by real-world break activities. */
export function AwaySessionCard({
  headline,
  detail,
  artwork = 'window',
}: {
  headline: string;
  detail: string;
  artwork?: 'window' | 'record';
}) {
  return (
    <ActivityPanel style={{ alignItems: 'center', gap: 18, paddingVertical: 28 }}>
      {artwork === 'record' ? <StaticRecord /> : <WindowArtwork />}
      <Text style={[ui.heading, { textAlign: 'center' }]}>{headline}</Text>
      <Text style={[ui.muted, { textAlign: 'center' }]}>{detail}</Text>
    </ActivityPanel>
  );
}

function WindowArtwork() {
  return (
    <View accessibilityElementsHidden style={{ width: 136, height: 116, borderWidth: 2, borderColor: '#9EAF9D', borderTopLeftRadius: 70, borderTopRightRadius: 70, borderBottomWidth: 0, padding: 13, justifyContent: 'flex-end' }}>
      <View style={{ flex: 1, borderWidth: 1.5, borderColor: '#C5D0C1', borderTopLeftRadius: 55, borderTopRightRadius: 55, flexDirection: 'row', overflow: 'hidden' }}>
        <View style={{ flex: 1, backgroundColor: '#EDF1E8', borderRightWidth: 1, borderColor: '#C5D0C1' }} />
        <View style={{ flex: 1, backgroundColor: '#F8F6EF' }} />
      </View>
      <View style={{ height: 3, backgroundColor: '#9EAF9D', marginHorizontal: -9 }} />
    </View>
  );
}

function StaticRecord() {
  return (
    <View accessibilityElementsHidden style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#536B60', backgroundColor: '#344D45', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: '#829487', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: '#829487', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: '#D7B77A', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#344D45' }} />
          </View>
        </View>
      </View>
    </View>
  );
}
