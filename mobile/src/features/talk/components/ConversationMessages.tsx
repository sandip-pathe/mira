import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Message } from '../../../shared/api';
import { useTheme } from '../../../components/ui';

export function ConversationMessages({ messages }: { messages: Message[] }) {
  const { colors, typography } = useTheme();
  return <>
    {messages.map((message, index) => <View key={index + '-' + message.role} style={[styles.message, { alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: message.role === 'user' ? colors.soft : colors.surface }]}>
      <Text style={[typography.body, { color: colors.ink }]}>{message.content}</Text>
    </View>)}
  </>;
}

const styles = StyleSheet.create({
  message: { maxWidth: '92%', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18 },
});
