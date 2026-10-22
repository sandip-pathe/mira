import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Image as SvgImage } from 'react-native-svg';

export type BrandArtworkPart = 'companion' | 'activities' | 'journal' | 'listening' | 'thinking' | 'speaking';

const plate = require('../../../assets/brand/little-company-plate.png');
const poses = require('../../../assets/brand/mascot-poses.png');
const regions: Record<BrandArtworkPart, { source: number; column: number }> = {
  companion: { source: plate, column: 0 },
  activities: { source: plate, column: 1 },
  journal: { source: plate, column: 2 },
  listening: { source: poses, column: 0 },
  thinking: { source: poses, column: 1 },
  speaking: { source: poses, column: 2 },
};

/** Decorative local artwork; the screen owns composition and accessible labels. */
export function BrandArtwork({ part, size }: { part: BrandArtworkPart; size: number }) {
  const region = regions[part];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.frame, { width: size, height: size }]}>
      <Svg width="100%" height="100%" viewBox={`${region.column * 724} 0 724 724`}>
        <SvgImage href={region.source} width={2172} height={724} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ frame: { overflow: 'hidden', flexShrink: 0 } });
