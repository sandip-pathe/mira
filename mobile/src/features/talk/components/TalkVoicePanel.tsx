import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../../../shared/api';
import { ContextMatch } from '../conversation';
import { SupportDecision } from '../../../shared/interventions';
import { ContextSources } from './ContextSources';
import { ConversationMessages } from './ConversationMessages';
import { InterventionOffer } from './InterventionOffer';

export function TalkVoicePanel({
  decision,
  onAccept,
  onDecline,
  showSupportNote,
  showDetails,
  contextNotice,
  contextMatches,
  messages,
}: {
  decision?: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
  showSupportNote: boolean;
  showDetails: boolean;
  contextNotice: string;
  contextMatches: ContextMatch[];
  messages: Message[];
}) {
  return (
    <>
      {decision?.intervention && (
        <InterventionOffer decision={decision} onAccept={onAccept} onDecline={onDecline} />
      )}
      {showSupportNote && (
        <View style={styles.contextNote}>
          <Text style={styles.body}>
            This demo has no connected support route. Help has the available options.
          </Text>
        </View>
      )}
      {showDetails && (
        <View style={styles.details}>
          {!!contextNotice && <Text style={styles.muted}>{contextNotice}</Text>}
          <ContextSources matches={contextMatches} />
          <ConversationMessages messages={messages} />
        </View>
      )}
      {!!contextMatches.length && !showDetails && (
        <Text style={styles.contextHint}>
          A saved item is in use. View conversation and context for details.
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  contextNote: { padding: 13, backgroundColor: '#E8F0E7', borderRadius: 15 },
  body: { fontSize: 15, lineHeight: 22, color: '#263F3A' },
  details: { gap: 10 },
  muted: { fontSize: 13, lineHeight: 19, color: '#6D7D79' },
  contextHint: { paddingHorizontal: 12, fontSize: 12, color: '#71807B' },
});
