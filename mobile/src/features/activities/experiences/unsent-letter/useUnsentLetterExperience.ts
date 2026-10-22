import React from 'react';
import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { loadSavedLetters, saveLetter, deleteSavedLetter, type SavedLetter } from '../../../../shared/letters';
import { requestActivityAssistance, type LetterTakeawayRequest } from '../../assistance/assistanceClient';

export type LetterDraft = { id?: string; title: string; recipient: string; body: string };
export type LetterTakeaway = { need_or_boundary: string; talk_line: string };
export type LetterScreen = 'loading' | 'home' | 'collection' | 'editor' | 'read';

export function useUnsentLetterExperience({ origin, letterId }: { origin: string; letterId?: string }) {
  const [screen, setScreen] = React.useState<LetterScreen>(letterId || origin !== 'talk' ? 'loading' : 'editor');
  const [letters, setLetters] = React.useState<SavedLetter[]>([]);
  const [letter, setLetter] = React.useState<SavedLetter>();
  const [draft, setDraft] = React.useState<LetterDraft>({ title: 'Unsent letter', recipient: '', body: '' });
  const [returnToCollection, setReturnToCollection] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [takeaway, setTakeaway] = React.useState<LetterTakeaway>();
  const [suggesting, setSuggesting] = React.useState(false);
  const clientRunId = React.useState(() => randomUUID())[0];
  const revision = React.useRef(0);
  const requestGeneration = React.useRef(0);
  const controller = React.useRef<AbortController | undefined>(undefined);

  function cancelSuggestion() {
    requestGeneration.current += 1;
    controller.current?.abort(); controller.current = undefined;
    setSuggesting(false);
  }
  React.useEffect(() => () => controller.current?.abort(), []);

  const refresh = React.useCallback(async () => {
    const saved = await loadSavedLetters(); setLetters(saved); return saved;
  }, []);
  React.useEffect(() => {
    let current = true;
    void Promise.resolve().then(refresh).then((saved) => {
      if (!current) return;
      if (letterId) {
        const found = saved.find((item) => item.id === letterId);
        if (found) { setLetter(found); setDraft({ id: found.id, title: found.title, recipient: found.recipient, body: found.body }); setScreen('read'); }
        else { setStatus('This saved letter is no longer available.'); setScreen('home'); }
      } else if (origin !== 'talk') setScreen('home');
    }).catch(() => { if (current) { setStatus('Saved letters could not be loaded. You can still write a new one.'); if (origin !== 'talk') setScreen('home'); } });
    return () => { current = false; };
  }, [letterId, origin, refresh]);

  function createNew() {
    cancelSuggestion(); revision.current += 1;
    setLetter(undefined); setDraft({ title: 'Unsent letter', recipient: '', body: '' }); setStatus(''); setTakeaway(undefined); setReturnToCollection(false); setScreen('editor');
  }
  function openSaved(item: SavedLetter, fromCollection = false) {
    cancelSuggestion(); revision.current += 1;
    setLetter(item); setDraft({ id: item.id, title: item.title, recipient: item.recipient, body: item.body });
    setReturnToCollection(fromCollection); setTakeaway(undefined); setStatus(''); setScreen('read');
  }
  function edit() { cancelSuggestion(); revision.current += 1; setTakeaway(undefined); setStatus(''); setScreen('editor'); }
  function updateDraft(field: keyof LetterDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'body') { revision.current += 1; cancelSuggestion(); setTakeaway(undefined); }
  }
  async function findWhatINeed() {
    if (!draft.body.trim() || suggesting) return;
    cancelSuggestion();
    const abortController = new AbortController(); controller.current = abortController;
    const currentGeneration = ++requestGeneration.current; const currentRevision = revision.current;
    const requestId = randomUUID(); setSuggesting(true); setStatus(''); setTakeaway(undefined);
    const request: LetterTakeawayRequest = { contract_version: 1, request_id: requestId, activity_run_id: clientRunId,
      source_revision: currentRevision, source_text: draft.body, operation: 'letter_takeaway' };
    try {
      const response = await requestActivityAssistance(request, abortController.signal);
      if (abortController.signal.aborted || currentGeneration !== requestGeneration.current || currentRevision !== revision.current || response.operation !== 'letter_takeaway') return;
      setTakeaway({ need_or_boundary: response.need_or_boundary, talk_line: response.talk_line });
    } catch {
      if (!abortController.signal.aborted && currentGeneration === requestGeneration.current) setStatus('The suggestion is unavailable right now. Your letter is still here.');
    } finally { if (controller.current === abortController) controller.current = undefined; setSuggesting(false); }
  }
  async function saveCurrent() {
    if (!draft.body.trim() || saving) { if (!draft.body.trim()) setStatus('Add a few words before saving.'); return; }
    setSaving(true); setStatus('');
    try {
      const saved = await saveLetter(draft);
      setLetter(saved); setDraft({ id: saved.id, title: saved.title, recipient: saved.recipient, body: saved.body });
      setLetters((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setStatus('Saved on this device. It stays inside Unsent Letter.'); setScreen('read');
      return saved;
    } catch { setStatus('The letter could not be saved. Your writing is still here; try again.'); }
    finally { setSaving(false); }
  }
  function confirmRemove(item: SavedLetter) {
    Alert.alert('Delete this letter?', 'This permanently removes it from this device.', [
      { text: 'Keep letter', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteSavedLetter(item.id).then(() => {
        setLetters((current) => current.filter((value) => value.id !== item.id));
        if (letter?.id === item.id) { setLetter(undefined); setDraft({ title: 'Unsent letter', recipient: '', body: '' }); setScreen(returnToCollection ? 'collection' : 'home'); }
      }).catch(() => setStatus('This letter could not be deleted. Try again.')) },
    ]);
  }
  function backFromRead() { cancelSuggestion(); setStatus(''); setScreen(returnToCollection ? 'collection' : 'home'); setLetter(undefined); setTakeaway(undefined); }
  function leaveNewDraft() {
    if (!draft.body.trim()) { setScreen('home'); return; }
    Alert.alert('Discard this draft and close?', 'It has not been saved. This clears it from the activity.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Discard draft', style: 'destructive', onPress: () => { setDraft({ title: 'Unsent letter', recipient: '', body: '' }); setScreen('home'); } },
    ]);
  }
  function discardNewDraft() {
    cancelSuggestion(); setDraft({ title: 'Unsent letter', recipient: '', body: '' }); setTakeaway(undefined); setStatus(''); setScreen('home');
  }
  function closeSavedEditor() {
    if (letter && (draft.title !== letter.title || draft.recipient !== letter.recipient || draft.body !== letter.body)) {
      Alert.alert('Discard unsaved edits?', 'Your saved letter will stay as it was.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard edits', style: 'destructive', onPress: () => { setDraft({ id: letter.id, title: letter.title, recipient: letter.recipient, body: letter.body }); setScreen('read'); } },
      ]);
      return;
    }
    setScreen('read');
  }

  return { screen, setScreen, letters, letter, draft, updateDraft, status, setStatus, saving, takeaway, setTakeaway, suggesting, returnToCollection,
    clientRunId, refresh, createNew, openSaved, edit, saveCurrent, confirmRemove, backFromRead, leaveNewDraft, discardNewDraft, closeSavedEditor,
    findWhatINeed, cancelSuggestion };
}

export type UnsentLetterExperience = ReturnType<typeof useUnsentLetterExperience>;
