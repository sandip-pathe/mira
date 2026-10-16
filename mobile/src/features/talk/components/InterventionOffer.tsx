import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SupportDecision } from '../../../shared/interventions';
import { ActionButton } from '../../../components/ui';

export function InterventionOffer({
  decision,
  onAccept,
  onDecline,
}: {
  decision: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
}) {
  if (!decision.intervention) return null;
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.leafBadge}>
          <View style={styles.leafLeft} />
          <View style={styles.leafRight} />
          <View style={styles.leafStem} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Try {decision.intervention.title.toLowerCase()}?</Text>
          <Text style={styles.summary}>
            {decision.offer_reason || decision.intervention.summary}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <ActionButton label="Try it" onPress={onAccept} style={styles.button} />
        <ActionButton
          label="Keep talking"
          variant="outline"
          onPress={onDecline}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#DCE5D8',
    borderRadius: 25,
    padding: 15,
    gap: 14,
    backgroundColor: 'rgba(249,251,244,0.9)',
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leafBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F0E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafLeft: {
    position: 'absolute',
    width: 12,
    height: 20,
    left: 17,
    top: 16,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#358458',
    transform: [{ rotate: '-24deg' }],
  },
  leafRight: {
    position: 'absolute',
    width: 12,
    height: 20,
    right: 17,
    top: 16,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#358458',
    transform: [{ rotate: '24deg' }],
  },
  leafStem: {
    position: 'absolute',
    width: 3,
    height: 18,
    top: 27,
    borderRadius: 2,
    backgroundColor: '#286847',
  },
  copy: { flex: 1, gap: 3 },
  title: { color: '#173A34', fontSize: 18, lineHeight: 24, fontWeight: '700' },
  summary: { color: '#617671', fontSize: 15, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, minHeight: 48 },
});
