import React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { loadSavedLetters, saveLetter } from '../../../shared/letters';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { ExcerptHandoff } from './ExcerptHandoff';
import { SavedLettersShelf } from './SavedLettersShelf';

type RunState = ReturnType<typeof useInterventionRun>;

export function LetterActivityPanel({ run, letterId, onTalkTransfer }: {
  run: RunState;
  letterId?: string;
  onTalkTransfer: (text: string) => boolean;
}) {
  const [title, setTitle] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [savedId, setSavedId] = React.useState(letterId);
  const [savedSnapshot, setSavedSnapshot] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [promptsOpen, setPromptsOpen] = React.useState(false);
  const [challenge, setChallenge] = React.useState(false);
  const [mode, setMode] = React.useState<'write' | 'read' | 'perspective'>('write');
  const [perspective, setPerspective] = React.useState('');
  const newLetter = run.activeId === 'unsent_letter';
  const focused = run.activeId === 'write_100_words';
  const displayTitle = title.trim() || (newLetter ? 'Unsent letter' : focused ? '100 words to them' : 'Unsent message');
  const currentSnapshot = JSON.stringify([displayTitle, recipient, run.draft, perspective]);
  const baselineSnapshot = savedId ? savedSnapshot : JSON.stringify([displayTitle, '', '', '']);
  const wordCount = run.draft.trim() ? run.draft.trim().split(/\s+/).length : 0;

  React.useEffect(() => {
    if (!letterId) return;
    let active = true;
    void loadSavedLetters().then((letters) => {
      const letter = letters.find((item) => item.id === letterId);
      if (!active) return;
      if (!letter) { setStatus('This saved letter is no longer available. You can start a new one.'); return; }
      setTitle(letter.title); setRecipient(letter.recipient); run.setDraft(letter.body);
      setSavedSnapshot(JSON.stringify([letter.title, letter.recipient, letter.body, '']));
    }).catch(() => active && setStatus('Saved letters could not be opened. Try again later.'));
    return () => { active = false; };
  }, [letterId, run.setDraft]);

  if (run.phase !== 'active' || run.intervention?.presentation.pattern !== 'letter') return null;

  function confirmSave() {
    if (!run.draft.trim()) { setStatus('Add a few words before saving.'); return; }
    Alert.alert(savedId ? 'Update this saved letter?' : 'Save this letter on this device?',
      'It stays in Saved Letters until you delete it. Mira will not send it or add it to Talk.',
      [{ text: 'Cancel', style: 'cancel' }, { text: savedId ? 'Update letter' : 'Save letter', onPress: () => void persistLetter() }]);
  }
  async function persistLetter() {
    setSaving(true); setStatus('');
    try {
      const letter = await saveLetter({ id: savedId, title: displayTitle, recipient, body: run.draft });
      setSavedId(letter.id); setTitle(letter.title);
      setSavedSnapshot(JSON.stringify([letter.title, letter.recipient, letter.body, '']));
      setStatus('Saved in Saved Letters. Mira will not send it.');
    } catch { setStatus('This letter was not saved. Your writing is still here; try again.'); }
    finally { setSaving(false); }
  }
  function insertPrompt(prompt: string) {
    run.setDraft((current) => `${current}${current && !current.endsWith('\n') ? '\n\n' : ''}${prompt}`);
    setPromptsOpen(false);
  }
  function closeWith(next: 'completed' | 'stopped') {
    if (!run.draft && !perspective) { void run.finishRun(next); return; }
    Alert.alert('Discard this letter and close?', 'This clears the letter from this activity. There is no undo after closing.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard and close', style: 'destructive', onPress: () => { run.setDraft(''); setPerspective(''); void run.finishRun(next); } },
    ]);
  }

  return <ActivityPanel style={{ gap: 14 }}>
    {newLetter && <View accessible accessibilityLabel="An open envelope with a blank letter" style={{ alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: colors.accentSoft }}>
      <MaterialDesignIcons name="email-open-outline" size={46} color={colors.accent} />
      <Text style={ui.muted}>A letter for you to write, at your pace</Text>
    </View>}
    <Eyebrow>{newLetter ? 'UNSENT LETTER' : focused ? 'A NOTE TO THEM' : 'UNSENT MESSAGE'}</Eyebrow>
    <Text style={ui.heading}>{run.intervention.title}</Text>
    <Text style={ui.muted}>{newLetter ? 'Write what you wish you could say. You do not have to send it.' : 'This stays unsent. Your writing is temporary unless you choose to save it.'}</Text>
    <SavedLettersShelf />
    {mode === 'write' ? <>
      <TextInput accessibilityLabel="Optional addressee" maxLength={100} value={recipient} onChangeText={setRecipient}
        placeholder="To… (optional)" style={[ui.input, { minHeight: 52, textAlignVertical: 'center' }]} />
      {!newLetter && <TextInput accessibilityLabel="Optional letter title" maxLength={100} value={title} onChangeText={setTitle}
        placeholder={displayTitle} style={[ui.input, { minHeight: 52, textAlignVertical: 'center' }]} />}
      {newLetter && <>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: promptsOpen }} onPress={() => setPromptsOpen((open) => !open)} style={{ minHeight: 48, justifyContent: 'center' }}>
          <Text style={ui.label}>{promptsOpen ? 'Hide starting lines' : 'Need a starting line?'}</Text>
        </Pressable>
        {promptsOpen && <View style={{ gap: 8 }}>{['What happened?', 'What I wish you understood', 'What I needed', 'What I want now'].map((prompt) => <ActionButton key={prompt} label={prompt} variant="secondary" onPress={() => insertPrompt(prompt)} />)}</View>}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: challenge }} onPress={() => setChallenge((value) => !value)} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={ui.muted}>{challenge ? '☑' : '☐'} Try around 100 words (optional)</Text>
        </Pressable>
      </>}
      {(focused || (newLetter && challenge)) && <Text style={ui.muted}>{wordCount} words · the target never blocks you</Text>}
      <TextInput accessibilityLabel="Letter draft" maxLength={12000} multiline value={run.draft} onChangeText={run.setDraft}
        placeholder="Write a few words, or as much as you want…" style={[ui.input, { minHeight: 280, lineHeight: 28, paddingTop: 18, backgroundColor: '#FFFEFA' }]} textAlignVertical="top" />
      <ActionButton label="Read letter" onPress={() => setMode('read')} />
      {!newLetter && <ExcerptHandoff source={run.draft} onOpenInTalk={onTalkTransfer} />}
      {!newLetter && <ActionButton label={saving ? 'Saving…' : savedId ? 'Save changes to letter' : 'Save letter privately'} variant="secondary" loading={saving} disabled={!run.draft.trim()} onPress={confirmSave} />}
      <ActionButton label="Discard and close" variant="quiet" onPress={() => closeWith('stopped')} />
    </> : mode === 'read' ? <>
      <View accessibilityLabel="Letter review" style={{ padding: 22, gap: 16, backgroundColor: '#FFFEFA', borderWidth: 1, borderColor: colors.line, borderRadius: 12 }}>
        {!!recipient.trim() && <Text style={ui.label}>To {recipient}</Text>}
        <Text selectable style={[ui.body, { lineHeight: 30 }]}>{run.draft || 'Your letter is empty.'}</Text>
        {!!perspective && <><Text style={ui.label}>Another possible perspective</Text><Text selectable style={ui.body}>{perspective}</Text></>}
      </View>
      <ActionButton label="Edit" variant="secondary" onPress={() => setMode('write')} />
      {newLetter && <ActionButton label={perspective ? 'Edit another possible perspective' : 'Add another possible perspective'} variant="secondary" onPress={() => setMode('perspective')} />}
      {newLetter && <ExcerptHandoff source={run.draft} onOpenInTalk={onTalkTransfer} />}
      <ActionButton label="Keep editing" variant="quiet" onPress={() => setMode('write')} />
      <ActionButton label="Discard and close" onPress={() => closeWith('completed')} />
    </> : <>
      <Text style={ui.body}>Write a separate thought in your own words. Mira will not speak for the other person.</Text>
      <TextInput accessibilityLabel="Another possible perspective" multiline value={perspective} onChangeText={setPerspective} placeholder="A possibility I can imagine…" style={[ui.input, { minHeight: 180, textAlignVertical: 'top' }]} />
      <ActionButton label="Return to letter" onPress={() => setMode('read')} />
      <ActionButton label="Skip this" variant="quiet" onPress={() => setMode('read')} />
    </>}
    {!!status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>}
  </ActivityPanel>;
}
