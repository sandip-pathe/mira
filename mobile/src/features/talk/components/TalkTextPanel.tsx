import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Message } from '../../../shared/api';
import type { ContextMatch } from '../conversation';
import type { SupportDecision } from '../../../shared/interventions';
import { ActionButton, useTheme } from '../../../components/ui';
import { ContextSources } from './ContextSources';
import { ConversationMessages } from './ConversationMessages';
import { InterventionOffer } from './InterventionOffer';

export function TalkTextPanel({ messages, title, contextMatches, decision, onAccept, onDecline, failedText, waitingForReply, onRetry, error }: {
  messages: Message[];
  title: string;
  contextMatches: ContextMatch[];
  decision?: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
  failedText: string;
  waitingForReply: boolean;
  onRetry: () => void;
  error?: string;
}) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.pane}>
      {messages.length ? <ConversationMessages messages={messages} /> : <View style={styles.welcome}><Text style={[typography.body, styles.centered, { color: colors.muted }]}>{title}</Text></View>}
      {waitingForReply && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Mira is replying…</Text>}
      <ContextSources matches={contextMatches} />
      {decision?.intervention && <InterventionOffer decision={decision} onAccept={onAccept} onDecline={onDecline} />}
      {!!failedText && <View style={styles.failure}>
        <Text accessibilityRole="alert" style={[typography.support, { color: colors.error }]}>{error || 'Couldn’t get a reply. Your message is still here.'}</Text>
        <ActionButton label="Try again" variant="quiet" onPress={onRetry} />
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flexGrow: 1, gap: 14 },
  welcome: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  centered: { textAlign: 'center' },
  failure: { alignItems: 'flex-start', gap: 4 },
});
