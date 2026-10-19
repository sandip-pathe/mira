import React from 'react';
import { Alert, Keyboard } from 'react-native';
import { DemoSession, getDemoSession, request } from '../../../shared/api';
import { FeedbackItem, JournalEntry, JournalMessage, JournalSession, JournalSessionSummary, MemoryItem } from '../types';
import { useJournalRecording } from './useJournalRecording';
import { emitContextRevoked } from '../../../shared/demoEvents';
import { COLOR_PAIRS, PROMPT_GROUPS, type ColorPair } from '../components/journalConstants';

export function useJournalController() {
  const [session, setSession] = React.useState<DemoSession>();
  const [journalSessions, setJournalSessions] = React.useState<JournalSessionSummary[]>([]);
  const [currentJournalId, setCurrentJournalId] = React.useState<string>();
  const [currentSaved, setCurrentSaved] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<JournalMessage[]>([]);
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [memories, setMemories] = React.useState<MemoryItem[]>([]);
  const [feedback, setFeedback] = React.useState<FeedbackItem[]>([]);
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry>();
  const [excerpt, setExcerpt] = React.useState('');
  const [voiceNotes, setVoiceNotes] = React.useState<
    { id: string; uri: string; created_at: number }[]
  >([]);
  const [selectedPrompt, setSelectedPrompt] = React.useState(PROMPT_GROUPS[0].prompts[0]);
  const [draft, setDraft] = React.useState('');
  const [palette, setPalette] = React.useState<ColorPair>(COLOR_PAIRS[0]);
  const [fontSize, setFontSize] = React.useState(17);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState(false);
  const audio = useJournalRecording({ visible: editorOpen && !currentSaved, setStatus });
  const busy = saving || audio.busy;

  const background = palette.light;
  const foreground = '#111111';
  const subtle = '#5F5A55';

  React.useEffect(() => {
    let current = true;
    void getDemoSession()
      .then(async (value) => {
        const [journal, context] = await Promise.all([
          request<{ sessions: JournalSessionSummary[] }>(`/sessions/${value.session_id}/journal-sessions`, value),
          request<{ items: MemoryItem[]; feedback: FeedbackItem[] }>(
            `/sessions/${value.session_id}/memory`,
            value,
          ),
        ]);
        if (current) {
          setSession(value);
          setJournalSessions(journal.sessions);
          setMemories(context.items);
          setFeedback(context.feedback);
        }
      })
      .catch(() => {
        if (current) {
          setError(true);
          setStatus('');
        }
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, []);

  const refreshJournalSessions = React.useCallback(async (active = session) => {
    if (!active) return;
    const result = await request<{ sessions: JournalSessionSummary[] }>(
      `/sessions/${active.session_id}/journal-sessions`, active,
    );
    setJournalSessions(result.sessions);
  }, [session]);

  async function openJournal(id: string): Promise<boolean> {
    if (!session) return false;
    setLoading(true);
    try {
      const journal = await request<JournalSession>(
        `/sessions/${session.session_id}/journal-sessions/${id}`, session,
      );
      setCurrentJournalId(journal.id);
      setCurrentSaved(journal.saved);
      setMessages(journal.messages);
      setEntries(journal.messages.flatMap((message) => message.role === 'user' && message.entry_id
        ? [{ id: message.entry_id, text: message.content, input_type: 'text' as const, created_at: message.created_at }]
        : []));
      const lastPrompt = [...journal.messages].reverse().find((message) => message.role === 'assistant');
      if (lastPrompt) setSelectedPrompt(lastPrompt.content);
      setDraft('');
      setVoiceNotes([]);
      setEditorOpen(true);
      setError(false);
      return true;
    } catch {
      setError(true);
      setStatus('Journal session could not be opened. Try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  const startJournal = React.useCallback(() => {
    setCurrentJournalId(undefined);
    setCurrentSaved(false);
    setMessages([{ id: 'initial', journal_session_id: '', role: 'assistant', content: selectedPrompt, created_at: Date.now() / 1000 }]);
    setEntries([]);
    setDraft('');
    setVoiceNotes([]);
    setEditorOpen(true);
  }, [selectedPrompt]);

  function closeJournal() {
    Keyboard.dismiss();
    setEditorOpen(false);
    setCurrentJournalId(undefined);
    setCurrentSaved(false);
    setMessages([]);
    setEntries([]);
    setSelectedEntry(undefined);
    setExcerpt('');
    if (session) void refreshJournalSessions(session).catch(() => {});
  }

  async function saveCurrentSession(): Promise<boolean> {
    if (!session || !currentJournalId || !entries.length || busy) return false;
    setSaving(true);
    try {
      await request(`/sessions/${session.session_id}/journal-sessions/${currentJournalId}/save`, session, {});
      setStatus('Journal session saved.');
      setEditorOpen(false);
      setCurrentJournalId(undefined);
      setCurrentSaved(false);
      setMessages([]);
      setEntries([]);
      await refreshJournalSessions(session);
      return true;
    } catch {
      setError(true);
      setStatus('Session was not saved. Your entries are still here; try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEntry() {
    const responseText = draft.trim();
    if (!responseText || busy || audio.recording || currentSaved) return;
    setSaving(true);
    setStatus('Thinking of a follow-up…');
    try {
      const activeSession = session ?? (await getDemoSession());
      setSession(activeSession);
      let journalId = currentJournalId;
      if (!journalId) {
        const created = await request<JournalSession>(
          `/sessions/${activeSession.session_id}/journal-sessions`,
          activeSession,
          { title: `Journal · ${new Date().toLocaleDateString()}`, initial_prompt: selectedPrompt },
        );
        journalId = created.id;
        setCurrentJournalId(created.id);
        setMessages(created.messages);
      }
      const turn = await request<{ entry: JournalEntry; messages: JournalMessage[] }>(
        `/sessions/${activeSession.session_id}/journal-sessions/${journalId}/turn`,
        activeSession,
        { text: responseText },
      );
      setEntries((previous) => [...previous, turn.entry]);
      setMessages((previous) => [...previous, ...turn.messages]);
      setDraft('');
      setStatus('Follow-up ready. Save the session when you’re finished.');
      setError(false);
      setSelectedEntry(undefined);
      await refreshJournalSessions(activeSession);
    } catch {
      setError(true);
      setStatus('A follow-up could not be generated. Your writing is still here; try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntryById(id: string) {
    if (!session || busy || audio.recording) return;
    setSaving(true);
    try {
      await request(`/sessions/${session.session_id}/journal/${id}`, session, undefined, 'DELETE');
      setEntries((items) => items.filter((entry) => entry.id !== id));
      setMessages((items) => items.filter((message) => message.entry_id !== id));
      setMemories((items) => items.filter((item) => item.source_entry_id !== id));
      if (selectedEntry?.id === id) setSelectedEntry(undefined);
      emitContextRevoked();
      setStatus('Entry deleted. Linked context was removed from future use.');
      await refreshJournalSessions(session);
    } catch {
      setError(true);
      setStatus('Entry was not deleted. Try again when Mira is online.');
    } finally {
      setSaving(false);
    }
  }

  async function saveExcerpt() {
    if (!session || !selectedEntry || !excerpt.trim() || busy || audio.recording) return;
    setSaving(true);
    try {
      const item = await request<MemoryItem>(`/sessions/${session.session_id}/memory`, session, {
        source_entry_id: selectedEntry.id,
        excerpt: excerpt.trim(),
      });
      setMemories((items) => [item, ...items]);
      setSelectedEntry(undefined);
      setExcerpt('');
      setStatus('Excerpt saved as pending. Approve it separately before Talk can use it.');
    } catch {
      setError(true);
      setStatus('Excerpt was not saved. Your entry is unchanged; try again.');
    } finally {
      setSaving(false);
    }
  }

  async function memoryAction(id: string, action: 'approve' | 'revoke' | 'delete') {
    if (!session || busy || audio.recording) return;
    setSaving(true);
    try {
      await request(
        `/sessions/${session.session_id}/memory/${id}${action === 'delete' ? '' : `/${action}`}`,
        session,
        undefined,
        action === 'delete' ? 'DELETE' : 'POST',
      );
      setMemories((items) =>
        items.flatMap((item) =>
          item.id !== id
            ? [item]
            : action === 'delete'
              ? []
              : [
                  {
                    ...item,
                    approved: action === 'approve' ? 1 : 0,
                    revoked: action === 'revoke' ? 1 : item.revoked,
                  },
                ],
        ),
      );
      if (action !== 'approve') emitContextRevoked();
      setStatus(
        action === 'approve'
          ? 'Excerpt approved for Talk.'
          : 'Future use of this context was removed.',
      );
    } catch {
      setError(true);
      setStatus('Context was not changed. Try again when Mira is online.');
    } finally {
      setSaving(false);
    }
  }

  async function feedbackAction(id: string, action: 'reuse' | 'delete', enabled?: boolean) {
    if (!session || busy || audio.recording) return;
    setSaving(true);
    try {
      await request(
        `/sessions/${session.session_id}/feedback/${id}${action === 'reuse' ? `/reuse?reuse_context=${!!enabled}` : ''}`,
        session,
        undefined,
        action === 'delete' ? 'DELETE' : 'PATCH',
      );
      setFeedback((items) =>
        items.flatMap((item) =>
          item.id !== id
            ? [item]
            : action === 'delete'
              ? []
              : [{ ...item, reuse_context: enabled ? 1 : 0 }],
        ),
      );
      if (action === 'delete' || !enabled) emitContextRevoked();
      setStatus(
        action === 'delete' || !enabled
          ? 'Future use of this preference was removed.'
          : 'Preference saved for similar moments.',
      );
    } catch {
      setError(true);
      setStatus('Preference was not changed. Try again when Mira is online.');
    } finally {
      setSaving(false);
    }
  }

  function saveVoiceNote() {
    const uri = audio.keep();
    if (!uri) return;
    setVoiceNotes((items) => [{ id: `${Date.now()}`, uri, created_at: Date.now() }, ...items]);
    setStatus('Voice note saved on this device.');
  }

  async function choosePrompt(prompt: string): Promise<boolean> {
    if (currentJournalId && entries.length === 0 && session) {
      try {
        await request(`/sessions/${session.session_id}/journal-sessions/${currentJournalId}/prompt`, session, { prompt }, 'PATCH');
      } catch {
        setError(true);
        setStatus('Prompt could not be changed. Try again.');
        return false;
      }
    }
    setSelectedPrompt(prompt);
    setMessages((items) => items.length === 1 && items[0].role === 'assistant'
      ? [{ ...items[0], content: prompt }]
      : items);
    Keyboard.dismiss();
    return true;
  }

  function deleteEntry(entry: JournalEntry) {
    Alert.alert('Delete entry?', 'This entry will be removed from your journal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteEntryById(entry.id),
      },
    ]);
  }

  return {
    session, journalSessions, currentJournalId, currentSaved, editorOpen, messages, entries,
    memories, feedback, selectedEntry, setSelectedEntry, excerpt, setExcerpt, voiceNotes,
    setVoiceNotes, selectedPrompt, draft, setDraft, palette, setPalette, fontSize, setFontSize,
    loading, saving, status, error,
    audio, busy, background, foreground, subtle, openJournal, startJournal, closeJournal,
    refreshJournalSessions, saveCurrentSession, saveEntry, saveExcerpt, memoryAction, feedbackAction, saveVoiceNote,
    choosePrompt, deleteEntry,
  };
}
