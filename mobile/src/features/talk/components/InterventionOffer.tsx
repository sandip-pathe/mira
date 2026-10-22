import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SupportDecision } from '../../../shared/interventions';
import { ActionButton, useTheme } from '../../../components/ui';

export function InterventionOffer({ decision, onAccept, onDecline }: {
  decision: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { colors, typography } = useTheme();
  if (!decision.intervention) return null;
  return (
    <View style={[styles.card, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <Text style={[typography.activityTitle, styles.title, { color: colors.ink }]}>Want to try {decision.intervention.title}?</Text>
      <Text style={[typography.support, { color: colors.muted }]}>{decision.offer_reason || decision.intervention.summary}</Text>
      <View style={styles.actions}>
        <ActionButton label="Try it" onPress={onAccept} style={styles.button} />
        <ActionButton label="Keep talking" variant="quiet" onPress={onDecline} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 8 },
  title: { fontSize: 19, lineHeight: 23.75 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  button: { flexGrow: 1, flexBasis: 112 },
});
