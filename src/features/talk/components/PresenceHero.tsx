import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VoiceState } from '../../../shared/voice';

export function PresenceHero({
  state,
  error,
  title,
  subtitle,
}: {
  state: VoiceState;
  error: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.hero}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.presenceArea}
      >
        <View
          style={[
            styles.orb,
            state === 'listening' && styles.listening,
            state === 'speaking' && styles.speaking,
            !!error && styles.offline,
          ]}
        >
          <View style={styles.highlight} />
          <View style={styles.green} />
          <View style={styles.core} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    minHeight: 275,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 14,
  },
  presenceArea: {
    width: 230,
    height: 230,
    maxWidth: '70%',
    maxHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 196,
    height: 196,
    maxWidth: '100%',
    borderRadius: 110,
    backgroundColor: '#F3F2E9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#516C59',
    shadowOpacity: 0.19,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 13 },
    elevation: 5,
  },
  highlight: {
    position: 'absolute',
    width: 160,
    height: 170,
    borderRadius: 90,
    top: -28,
    right: -26,
    backgroundColor: '#FFF9E8',
    opacity: 0.9,
  },
  green: {
    position: 'absolute',
    width: 145,
    height: 120,
    borderRadius: 80,
    left: -30,
    bottom: -18,
    backgroundColor: '#D4E5D5',
    opacity: 0.95,
    transform: [{ rotate: '-28deg' }],
  },
  core: {
    width: 105,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#E6EEE2',
    opacity: 0.72,
    transform: [{ translateX: 8 }, { translateY: -5 }],
  },
  listening: { backgroundColor: '#E8F2E5' },
  speaking: { backgroundColor: '#F5F0DD' },
  offline: { backgroundColor: '#ECEDE6' },
  title: {
    marginTop: 13,
    color: '#163632',
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.35,
  },
  subtitle: { marginTop: 3, color: '#72827F', fontSize: 18, lineHeight: 26, textAlign: 'center' },
});
