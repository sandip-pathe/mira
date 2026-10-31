import React from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../components/ui';

export function ExcerptHandoff({ source, onOpenInTalk }: {
  source: string; onOpenInTalk: (text: string) => boolean;
}) {
  const { colors, typography } = useTheme();
  const [visible, setVisible] = React.useState(false);
  const [excerpt, setExcerpt] = React.useState('');
  const [previewing, setPreviewing] = React.useState(false);
  const [status, setStatus] = React.useState('');

  const close = React.useCallback(() => {
    setVisible(false);
    setPreviewing(false);
    setStatus('');
  }, []);
  useFocusEffect(React.useCallback(() => () => close(), [close]));

  function prepare() {
    const value = excerpt.trim();
    if (!value) { setStatus('Select some text to continue.'); return; }
    Keyboard.dismiss();
    setExcerpt(value);
    setPreviewing(true);
    setStatus('');
  }
  function transfer() {
    try {
      if (onOpenInTalk(excerpt)) close();
      else setStatus('The text is still here. Try opening Talk again.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The text is still here. Try again.');
    }
  }

  return <>
    <ActionButton label="Talk about a part" variant="secondary" disabled={!source.trim()}
      onPress={() => {
        Keyboard.dismiss();
        setExcerpt(source);
        setPreviewing(false);
        setStatus('');
        setVisible(true);
      }} />
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={[styles.page, { backgroundColor: colors.canvas }]}>
        <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <Text style={[typography.status, { color: colors.muted }]}>{previewing ? 'Preview excerpt' : 'Choose an excerpt'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close excerpt" onPress={close} style={styles.close}>
              <MaterialDesignIcons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Eyebrow>ONE-TIME TRANSFER</Eyebrow>
            <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Choose the words for Talk</Text>
            <Text style={[typography.support, { color: colors.muted }]}>Edit the excerpt if you like. Mira will not send it for you.</Text>
            {!previewing ? <>
              <TextInput accessibilityLabel="Editable excerpt for Talk" multiline maxLength={12000}
                value={excerpt} onChangeText={setExcerpt} textAlignVertical="top"
                selectionColor={colors.primary} cursorColor={colors.primary}
                style={[typography.body, styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
              {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status}</Text>}
              <ActionButton label="Preview exact text" onPress={prepare} disabled={!excerpt.trim()} />
              <ActionButton label="Cancel" variant="quiet" onPress={close} />
            </> : <>
              <View style={[styles.preview, { borderTopColor: colors.line, borderBottomColor: colors.line }]}>
                <Text selectable accessibilityLabel="Exact text to add to Talk" style={[typography.body, { color: colors.ink }]}>{excerpt}</Text>
              </View>
              {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status}</Text>}
              <ActionButton label="Open in Talk" onPress={transfer} />
              <ActionButton label="Edit excerpt" variant="secondary" onPress={() => setPreviewing(false)} />
              <ActionButton label="Cancel" variant="quiet" onPress={close} />
            </>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { minHeight: 56, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center' },
  close: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24, gap: 16, maxWidth: 660, width: '100%', alignSelf: 'center' },
  input: { minHeight: 180, padding: 14, borderRadius: 16, borderWidth: 1 },
  preview: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
});
