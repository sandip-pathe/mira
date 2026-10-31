import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandArtwork } from './BrandArtwork';
import { useTheme } from './theme';

const wordmark = require('../../../assets/brand/mira-signature.png');

export function StartupScreen() {
  const { colors, typography } = useTheme();
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.canvas }]}>
      <View style={styles.content}>
        <BrandArtwork part="companion" size={128} />
        <Image source={wordmark} resizeMode="contain" accessibilityLabel="Mira" style={[styles.wordmark, { tintColor: colors.primary }]} />
        <ActivityIndicator accessibilityElementsHidden color={colors.primary} style={styles.spinner} />
        <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening Mira...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  wordmark: { width: 132, height: 46 },
  spinner: { marginTop: 8 },
});
