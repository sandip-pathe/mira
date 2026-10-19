import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../../../shared/api';

export function ConversationMessages({ messages }: { messages: Message[] }) {
  const currentExchangeStart = messages.reduce(
    (latest, message, index) => (message.role === 'user' ? index : latest),
    Math.max(0, messages.length - 1),
  );
  return (
    <>
      {messages.map((message, index) => (
        <View
          key={`${index}-${message.role}`}
          style={[styles.message, index < currentExchangeStart && styles.previousMessage]}
        >
          <Text style={[styles.body, message.role === 'user' && styles.userBody]}>
            {message.content}
          </Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  message: { paddingHorizontal: 6, paddingVertical: 8 },
  previousMessage: { opacity: 0.6 },
  body: { fontSize: 18, lineHeight: 27, color: '#263F3A' },
  userBody: { fontWeight: '700' },
});
