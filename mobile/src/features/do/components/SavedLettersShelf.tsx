import React from 'react';
import { Alert, Text, View } from 'react-native';
import { ActionButton, Surface, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { deleteSavedLetter, loadSavedLetters, SavedLetter } from '../../../shared/letters';
import { SavedLetterEditor } from './SavedLetterEditor';

export function SavedLettersShelf() {
  const [open, setOpen] = React.useState(false);
  const [letters, setLetters] = React.useState<SavedLetter[]>([]);
  const [selectedLetter, setSelectedLetter] = React.useState<SavedLetter>();
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    void loadSavedLetters()
      .then((items) => active && setLetters(items))
      .catch(() => active && setStatus('Saved letters could not be loaded on this device.'));
    return () => { active = false; };
  }, [open]);

  function confirmDelete(letter: SavedLetter) {
    Alert.alert('Delete this letter?', 'This permanently removes it from this device.', [
      { text: 'Keep letter', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void deleteSavedLetter(letter.id)
            .then(() => setLetters((current) => current.filter((item) => item.id !== letter.id)))
            .catch(() => setStatus('This letter could not be deleted. Try again.')),
      },
    ]);
  }

  return (
    <ActivityPanel style={{ gap: 10 }}>
      <ActionButton
        label={open ? 'Hide saved letters' : 'Saved letters'}
        variant="secondary"
        onPress={() => setOpen((value) => !value)}
      />
      {open && (
        <View style={{ gap: 9 }}>
          <Text style={ui.muted}>Saved on this device. Mira does not send them anywhere.</Text>
          {letters.length === 0 ? (
            <Text style={ui.muted}>No saved letters.</Text>
          ) : letters.map((letter) => (
            <Surface key={letter.id} style={{ gap: 8 }}>
              <Text style={ui.label}>{letter.title}</Text>
              {!!letter.recipient && <Text style={ui.muted}>To {letter.recipient}</Text>}
              <Text style={ui.muted}>Edited {new Date(letter.updatedAt).toLocaleDateString()}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ActionButton label="Open letter" onPress={() => setSelectedLetter(letter)} style={{ flex: 1 }} />
                <ActionButton label="Delete" variant="quiet" onPress={() => confirmDelete(letter)} style={{ flex: 1 }} />
              </View>
            </Surface>
          ))}
          {!!status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>}
        </View>
      )}
      {selectedLetter && (
        <SavedLetterEditor
          letter={selectedLetter}
          onClose={() => setSelectedLetter(undefined)}
          onSaved={(updated) => {
            setLetters((current) => current.map((item) => item.id === updated.id ? updated : item));
            setSelectedLetter(undefined);
          }}
        />
      )}
    </ActivityPanel>
  );
}
