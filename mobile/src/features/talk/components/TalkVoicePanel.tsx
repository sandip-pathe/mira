import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Message } from '../../../shared/api';
import { ContextMatch } from '../conversation';
import { SupportDecision } from '../../../shared/interventions';
import { VoiceState } from '../../../shared/voice';
import { ActionButton } from '../../../components/ui';
import { ContextSources } from './ContextSources';
import { ConversationMessages } from './ConversationMessages';
import { InterventionOffer } from './InterventionOffer';
import { PresenceHero } from './PresenceHero';

export function TalkVoicePanel({
  state,
  error,
  title,
  subtitle,
  decision,
  onAccept,
  onDecline,
  showSupportNote,
  showDetails,
  onToggleDetails,
  contextNotice,
  contextMatches,
  messages,
}: {
  state: VoiceState;
  error: string;
  title: string;
  subtitle: string;
  decision?: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
  showSupportNote: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
  contextNotice: string;
  contextMatches: ContextMatch[];
  messages: Message[];
}) {
  return (
    <>
      <PresenceHero state={state} error={error} title={title} subtitle={subtitle} />
      {decision?.intervention && (
        <InterventionOffer decision={decision} onAccept={onAccept} onDecline={onDecline} />
      )}
      {!!error && (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        </View>
      )}
      {showSupportNote && (
        <View style={styles.contextNote}>
          <Text style={styles.body}>
            This demo has no connected support route. Help has the available options.
          </Text>
        </View>
      )}
      {(contextMatches.length > 0 || !!contextNotice || messages.length > 0) && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showDetails }}
          style={styles.contextToggle}
          onPress={onToggleDetails}
        >
          <Text style={styles.toggleText}>
            {showDetails ? 'Hide conversation and context' : 'Conversation and context'}
          </Text>
          <Text style={styles.toggleMark}>{showDetails ? '-' : '+'}</Text>
        </Pressable>
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
  errorBox: { padding: 13, gap: 10, backgroundColor: '#F9EBE7', borderRadius: 16 },
  error: { fontSize: 14, lineHeight: 20, color: '#9A3D35' },
  contextNote: { padding: 13, backgroundColor: '#E8F0E7', borderRadius: 15 },
  body: { fontSize: 15, lineHeight: 22, color: '#263F3A' },
  contextToggle: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  toggleText: { fontSize: 14, color: '#526B64', fontWeight: '600' },
  toggleMark: { fontSize: 20, color: '#526B64' },
  details: { gap: 10 },
  muted: { fontSize: 13, lineHeight: 19, color: '#6D7D79' },
  contextHint: { paddingHorizontal: 12, fontSize: 12, color: '#71807B' },
});
