import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../components/ui';
import type { Message } from '../../../shared/api';
import type { ContextMatch } from '../conversation';
import { ContextSources } from './ContextSources';
import { ConversationMessages } from './ConversationMessages';

export function TalkConversationSheet({ visible, onClose, messages, contextNotice, contextMatches }: {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
  contextNotice: string;
  contextMatches: ContextMatch[];
}) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 24 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close conversation" />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(24, insets.bottom) }]}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={[typography.sheetTitle, styles.title, { color: colors.ink }]}>Conversation</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close conversation" onPress={onClose} style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.soft }]}>
              <MaterialDesignIcons name="close" size={24} color={colors.primary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {messages.length ? <ConversationMessages messages={messages} /> : <Text style={[typography.body, { color: colors.muted }]}>Your conversation will appear here.</Text>}
            {!!contextNotice && <Text style={[typography.support, { color: colors.muted }]}>{contextNotice}</Text>}
            <ContextSources matches={contextMatches} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.28)' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, gap: 12 },
  title: { flex: 1 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  content: { paddingTop: 12, paddingBottom: 16, gap: 14 },
});
