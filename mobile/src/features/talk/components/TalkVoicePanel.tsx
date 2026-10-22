import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SupportDecision } from '../../../shared/interventions';
import { useTheme } from '../../../components/ui';
import { InterventionOffer } from './InterventionOffer';

export function TalkVoicePanel({ decision, onAccept, onDecline, showSupportNote, hasContext }: {
  decision?: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
  showSupportNote: boolean;
  hasContext: boolean;
}) {
  const { colors, typography } = useTheme();
  return <>
    {decision?.intervention && <InterventionOffer decision={decision} onAccept={onAccept} onDecline={onDecline} />}
    {showSupportNote && <View style={[styles.note, { backgroundColor: colors.soft }]}><Text style={[typography.support, { color: colors.ink }]}>This demo has no connected support route. Help has the available options.</Text></View>}
    {hasContext && <Text style={[typography.support, { color: colors.muted }]}>A saved item is in use. View conversation and context for details.</Text>}
  </>;
}

const styles = StyleSheet.create({ note: { padding: 14, borderRadius: 16 } });
