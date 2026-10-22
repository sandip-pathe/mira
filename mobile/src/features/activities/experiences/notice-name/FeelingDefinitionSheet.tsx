import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';

export const feelingDescriptions: Record<string, string> = {
  Worried: 'Your mind keeps circling around what might go wrong or what comes next.',
  Disappointed: 'Something you hoped for, expected, or needed did not happen the way you wanted.',
  Angry: 'Something feels unfair, crossed a line, or blocked what matters to you.',
  Lonely: 'You want connection, understanding, or company that does not feel reachable right now.',
  Overwhelmed: 'It feels like there is more to deal with than you can manage right now.',
  Numb: 'It is hard to feel much of anything, as if your emotions are muted or far away.',
  Okay: 'Things feel steady enough right now, neither strongly pulled down nor keyed up.',
  Excited: 'You feel energized and looking forward to something ahead.',
  Mixed: 'Two or more different feelings are showing up at the same time.',
  'Not sure': 'Nothing on the list quite fits yet, and that is a valid place to pause.',
};

export function FeelingDefinitionSheet({ word, onClose }: { word: string; onClose: () => void }) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  return <Modal visible={!!word} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable accessible={false} onPress={onClose} style={styles.backdrop}>
      <Pressable accessible={false} accessibilityViewIsModal onPress={(event) => event.stopPropagation()}
        style={[styles.sheet, { backgroundColor: colors.surface, marginLeft: insets.left, marginRight: insets.right, paddingBottom: Math.max(22, insets.bottom) }]}>
        <View style={styles.header}>
          <Eyebrow>WORD MEANING</Eyebrow>
          <Pressable accessibilityRole="button" accessibilityLabel="Close definition" onPress={onClose} style={styles.close}>
            <MaterialDesignIcons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[typography.sheetTitle, { color: colors.ink }]}>{word}</Text>
          <Text style={[typography.body, { color: colors.ink }]}>{feelingDescriptions[word]}</Text>
          <ActionButton label="Close definition" onPress={onClose} />
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { minHeight: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 22, gap: 16 },
});
