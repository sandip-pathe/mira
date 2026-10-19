import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

export function TalkTextComposer({
  text,
  onChangeText,
  onSend,
  sending,
  onSwitchToVoice,
}: {
  text: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  onSwitchToVoice: () => void;
}) {
  const [inputHeight, setInputHeight] = useState(44);
  const hasText = !!text.trim();

  return (
    <View style={styles.row}>
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Text message"
          value={text}
          onChangeText={onChangeText}
          multiline
          scrollEnabled={inputHeight >= 88}
          onContentSizeChange={(event) =>
            setInputHeight(Math.min(88, Math.max(44, event.nativeEvent.contentSize.height)))
          }
          style={[styles.input, { height: inputHeight }]}
          placeholder="Write a message"
          placeholderTextColor="#26312E"
          textAlignVertical="center"
          returnKeyType="default"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasText ? 'Send message' : 'Switch to voice mode'}
        accessibilityState={{ disabled: hasText && sending, busy: sending }}
        disabled={hasText && sending}
        onPress={hasText ? onSend : onSwitchToVoice}
        style={styles.sendButton}
      >
        {hasText ? (
          <Text style={styles.sendIcon}>{sending ? '…' : '➤'}</Text>
        ) : (
          <MaterialDesignIcons name="microphone" size={32} color="#F6f6f6" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    maxWidth: 660,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F2F3EC',
    gap: 8,
  },
  composer: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 3,
    gap: 6,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#D3D9D1',
    backgroundColor: '#FFFDF9',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 88,
    paddingTop: 10,
    paddingBottom: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#203A35',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#397D5E',
  },
  sendIcon: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '700' },
});
