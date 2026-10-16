import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../../../shared/api';

export function ConversationMessages({ messages }: { messages: Message[] }) {
  return (
    <>
      {messages.map((message, index) => (
        <View
          key={`${index}-${message.role}`}
          style={[styles.message, message.role === 'user' && styles.userMessage]}
        >
          <Text style={styles.label}>{message.role === 'user' ? 'YOU' : 'MIRA'}</Text>
          <Text style={styles.body}>{message.content}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  message: {
    padding: 13,
    gap: 6,
    borderRadius: 17,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DDE2D9',
  },
  userMessage: { backgroundColor: '#E9F1E8', borderColor: '#D4E1D2' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: '#71807B' },
  body: { fontSize: 15, lineHeight: 22, color: '#263F3A' },
});
