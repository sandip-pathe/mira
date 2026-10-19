import React from 'react';
import { Alert, Modal, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Eyebrow, colors, ui } from '../../../components/ui';
import { saveLetter, SavedLetter } from '../../../shared/letters';

export function SavedLetterEditor({
  letter,
  onClose,
  onSaved,
}: {
  letter: SavedLetter;
  onClose: () => void;
  onSaved: (letter: SavedLetter) => void;
}) {
  const [title, setTitle] = React.useState(letter.title);
  const [recipient, setRecipient] = React.useState(letter.recipient);
  const [body, setBody] = React.useState(letter.body);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const changed = title !== letter.title || recipient !== letter.recipient || body !== letter.body;

  function close() {
    if (!changed) {
      onClose();
      return;
    }
    Alert.alert('Discard unsaved edits?', 'Your saved letter will stay as it was.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard edits', style: 'destructive', onPress: onClose },
    ]);
  }

  function confirmSave() {
    Alert.alert('Update this saved letter?', 'The edited version will replace the saved one.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save changes', onPress: () => void persist() },
    ]);
  }

  async function persist() {
    setSaving(true);
    setStatus('');
    try {
      const updated = await saveLetter({ id: letter.id, title, recipient, body });
      onSaved(updated);
    } catch {
      setStatus('Changes were not saved. Your edits are still here; try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScrollView
          contentContainerStyle={{
            padding: 22,
            paddingBottom: 36,
            gap: 14,
            maxWidth: 660,
            width: '100%',
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Eyebrow>SAVED LETTER</Eyebrow>
          <Text style={ui.title}>Your words, your choice</Text>
          <Text style={ui.muted}>
            This letter stays in Saved Letters until you delete it. It is not sent to Talk or anyone
            else from here.
          </Text>
          <TextInput
            accessibilityLabel="Letter title"
            maxLength={100}
            value={title}
            onChangeText={setTitle}
            placeholder="Letter title"
            style={[ui.input, { minHeight: 52, textAlignVertical: 'center' }]}
          />
          <TextInput
            accessibilityLabel="Optional recipient"
            maxLength={100}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Recipient (optional)"
            style={[ui.input, { minHeight: 52, textAlignVertical: 'center' }]}
          />
          <TextInput
            accessibilityLabel="Saved letter text"
            maxLength={12000}
            multiline
            value={body}
            onChangeText={setBody}
            style={[ui.input, { minHeight: 300, lineHeight: 27, paddingTop: 18 }]}
            textAlignVertical="top"
          />
          {!!status && (
            <Text accessibilityLiveRegion="polite" style={ui.muted}>
              {status}
            </Text>
          )}
          <ActionButton label="Save changes" loading={saving} onPress={confirmSave} />
          <ActionButton label="Close" variant="secondary" onPress={close} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
