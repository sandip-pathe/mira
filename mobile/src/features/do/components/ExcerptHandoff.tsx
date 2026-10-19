import React from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, colors, ui } from '../../../components/ui';

export function ExcerptHandoff({
  source,
  onOpenInTalk,
}: {
  source: string;
  onOpenInTalk: (text: string) => boolean;
}) {
  const [visible, setVisible] = React.useState(false);
  const [excerpt, setExcerpt] = React.useState('');
  const [previewing, setPreviewing] = React.useState(false);
  const [status, setStatus] = React.useState('');

  function close() {
    setVisible(false);
    setPreviewing(false);
    setStatus('');
  }

  function prepare() {
    const value = excerpt.trim();
    if (!value) {
      setStatus('Select some text to continue.');
      return;
    }
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

  return (
    <>
      <ActionButton
        label="Talk about a part"
        variant="secondary"
        disabled={!source.trim()}
        onPress={() => {
          setExcerpt(source);
          setPreviewing(false);
          setStatus('');
          setVisible(true);
        }}
      />
      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <ScrollView
            contentContainerStyle={{ padding: 22, paddingBottom: 36, gap: 14, maxWidth: 660, width: '100%', alignSelf: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <Eyebrow>ONE-TIME TRANSFER</Eyebrow>
            <Text style={ui.title}>Choose the words for Talk</Text>
            <Text style={ui.muted}>Edit the excerpt if you like. Mira will not send it for you.</Text>
            {!previewing ? (
              <>
                <TextInput
                  accessibilityLabel="Editable excerpt for Talk"
                  multiline
                  maxLength={12000}
                  value={excerpt}
                  onChangeText={setExcerpt}
                  textAlignVertical="top"
                  style={[ui.input, { minHeight: 180 }]}
                />
                {!!status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>}
                <ActionButton label="Preview exact text" onPress={prepare} disabled={!excerpt.trim()} />
                <ActionButton label="Cancel" variant="quiet" onPress={close} />
              </>
            ) : (
              <>
                <Surface>
                  <Text accessibilityLabel="Exact text to add to Talk" style={ui.body}>{excerpt}</Text>
                </Surface>
                {!!status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>}
                <ActionButton label="Open in Talk" onPress={transfer} />
                <ActionButton label="Edit excerpt" variant="secondary" onPress={() => setPreviewing(false)} />
                <ActionButton label="Cancel" variant="quiet" onPress={close} />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
