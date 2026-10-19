import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Message } from '../../../shared/api';
import { ContextMatch } from '../conversation';
import { SupportDecision } from '../../../shared/interventions';
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
  failedText,
  waitingForReply,
  onRetry,
}: {
  messages: Message[];
  title: string;
  contextNotice: string;
  contextMatches: ContextMatch[];
  decision?: SupportDecision;
  onAccept: () => void;
  onDecline: () => void;
  failedText: string;
  waitingForReply: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.pane}>
      {messages.length > 0 ? (
        <ConversationMessages messages={messages} />
      ) : (
        <View style={styles.welcome}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {waitingForReply && <ReplyTypingIndicator />}
      {!!contextNotice && <Text style={styles.muted}>{contextNotice}</Text>}
      <ContextSources matches={contextMatches} />
      {decision?.intervention && (
        <InterventionOffer decision={decision} onAccept={onAccept} onDecline={onDecline} />
      )}
      {!!failedText && (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Message not sent · Tap to try again</Text>
        </Pressable>
      )}
    </View>
  );
}

function ReplyTypingIndicator() {
  const [dots] = useState(() => Array.from({ length: 3 }, () => new Animated.Value(0)));

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 230,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 230,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 140),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View
      accessibilityLabel="Mira is replying"
      accessibilityLiveRegion="polite"
      style={styles.typingRow}
    >
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            {
              transform: [
                { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { gap: 10, paddingTop: 0, paddingBottom: 20 },
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
  retry: { padding: 12, alignSelf: 'flex-start', borderRadius: 16, backgroundColor: '#E7EBE3' },
  retryText: { fontSize: 14, lineHeight: 20, color: '#52665E' },
  typingRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#047c22' },
});
