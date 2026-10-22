import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../components/ui';

export function TalkTextComposer({ text, onChangeText, onSend, sending, onSwitchToVoice }: {
  text: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  onSwitchToVoice: () => void;
}) {
  const { colors, typography } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [inputHeight, setInputHeight] = React.useState(48);
  const maximumHeight = Math.max(96, Math.ceil(96 * fontScale));
  const disabled = !text.trim() || sending;
  return (
    <View style={[styles.area, { backgroundColor: colors.canvas }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Switch to voice" onPress={onSwitchToVoice} style={({ pressed }) => [styles.voice, pressed && { backgroundColor: colors.soft }]}>
        <MaterialDesignIcons name="microphone-outline" size={20} color={colors.primary} />
        <Text style={[typography.button, { color: colors.primary }]}>Switch to voice</Text>
      </Pressable>
      <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <TextInput
          accessibilityLabel="Message to Mira"
          value={text}
          onChangeText={onChangeText}
          multiline
          scrollEnabled={inputHeight >= maximumHeight}
          onContentSizeChange={({ nativeEvent }) => setInputHeight(Math.max(48, nativeEvent.contentSize.height))}
          style={[typography.body, styles.input, { color: colors.ink, height: Math.min(maximumHeight, inputHeight) }]}
          placeholder="Write a message…"
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          textAlignVertical="center"
          returnKeyType="default"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled, busy: sending }} disabled={disabled} onPress={onSend} style={({ pressed }) => [styles.send, { backgroundColor: disabled ? colors.disabled : pressed ? colors.pressed : colors.primary }]}>
          {sending ? <ActivityIndicator color={colors.disabledInk} /> : <MaterialDesignIcons name="arrow-up" size={24} color={disabled ? colors.disabledInk : colors.onPrimary} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { width: '100%', maxWidth: 660, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 4, paddingBottom: 18, gap: 4 },
  voice: { minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderRadius: 16 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderWidth: 1, borderRadius: 24, paddingLeft: 16, paddingRight: 4, paddingVertical: 4 },
  input: { flex: 1, minHeight: 48, paddingVertical: 12 },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
