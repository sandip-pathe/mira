import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Message } from '../../../shared/api';
import { ContextMatch } from '../conversation';
import { SupportDecision } from '../../../shared/interventions';
import { ActionButton, Eyebrow } from '../../../components/ui';
import { ContextSources } from './ContextSources';
import { ConversationMessages } from './ConversationMessages';
import { InterventionOffer } from './InterventionOffer';

export function TalkTextPanel({
  messages,
  title,
  contextNotice,
  contextMatches,
  decision,
  onAccept,
  onDecline,
  error,
  text,
  onChangeText,
  onSend,
  sending,
}: {
  messages: Message[];
  title: string;
  contextNotice: string;
  contextMatches: ContextMatch[];
  decision?: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
  error: string;
  text: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <View style={styles.pane}>
      <Eyebrow>TEXT CONVERSATION</Eyebrow>
      {messages.length > 0 ? (
        <ConversationMessages messages={messages} />
      ) : (
        <View style={styles.welcome}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Take your time.</Text>
        </View>
      )}
      {!!contextNotice && <Text style={styles.muted}>{contextNotice}</Text>}
      <ContextSources matches={contextMatches} />
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
      <TextInput
        autoFocus
        accessibilityLabel="Text message"
        value={text}
        onChangeText={onChangeText}
        multiline
        style={styles.input}
        placeholder="Write to Mira..."
        onSubmitEditing={onSend}
      />
      <ActionButton
        label={sending ? 'Sending...' : 'Send'}
        loading={sending}
        disabled={!text.trim()}
        onPress={onSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, gap: 14, paddingVertical: 10 },
  welcome: { paddingVertical: 14 },
  title: {
    color: '#163632',
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.35,
  },
  subtitle: { marginTop: 3, color: '#72827F', fontSize: 18, lineHeight: 26, textAlign: 'center' },
  muted: { fontSize: 13, lineHeight: 19, color: '#6D7D79' },
  errorBox: { padding: 13, gap: 10, backgroundColor: '#F9EBE7', borderRadius: 16 },
  error: { fontSize: 14, lineHeight: 20, color: '#9A3D35' },
  input: {
    minHeight: 100,
    padding: 15,
    borderWidth: 1,
    borderColor: '#D6DDD5',
    borderRadius: 18,
    fontSize: 16,
    lineHeight: 24,
    color: '#203A35',
    textAlignVertical: 'top',
    backgroundColor: '#FFFDF9',
  },
});
