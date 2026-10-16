import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { DemoSession, request } from '../../shared/api';
import { useJournalRecording } from './hooks/useJournalRecording';
import { clearContinueItems } from '../../shared/interventions';
import { ActionButton, Eyebrow, StatusPill, Surface, ui } from '../../components/ui';
import { JournalEntries } from './components/JournalEntries';
import { MemorySections } from './components/MemorySections';
import { FeedbackSection } from './components/FeedbackSection';
import { FeedbackItem, JournalEntry as Entry, MemoryItem } from './types';

export function Journal({
  draft,
  setDraft,
  getSession,
  visible,
  onReset,
  onContextRevoked,
}: {
  draft: string;
  setDraft: (text: string) => void;
  getSession: () => Promise<DemoSession>;
  visible: boolean;
  onReset: () => void;
  onContextRevoked: () => void;
}) {
  const [saving, setBusy] = useState(false);
  const [status, setStatus] = useState(
    'Use synthetic demo text. Review and edit the transcript here.',
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry>();
  const [excerpt, setExcerpt] = useState('');
  const [voiceDraft, setVoiceDraft] = useState(false);
  const audio = useJournalRecording({ visible, getSession, setDraft, setVoiceDraft, setStatus });
  const { recording, uri, start, stop, transcribe } = audio;
  const busy = saving || audio.busy;

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void getSession()
      .then(async (session) => {
        const [journal, context] = await Promise.all([
          request<{ entries: Entry[] }>(`/sessions/${session.session_id}/journal`, session),
          request<{ items: MemoryItem[]; feedback: FeedbackItem[] }>(
            `/sessions/${session.session_id}/memory`,
            session,
          ),
        ]);
        if (!cancelled) {
          setEntries(journal.entries);
          setMemories(context.items);
          setFeedback(context.feedback);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('Mira is temporarily offline. Your draft stays here.');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, getSession]);

  async function saveEntry() {
    const text = draft.trim();
    if (!text || busy || recording) return;
    setBusy(true);
    setStatus('Saving journal entry…');
    try {
      const session = await getSession();
      const entry = await request<Entry>(`/sessions/${session.session_id}/journal`, session, {
        text,
        input_type: voiceDraft ? 'voice' : 'text',
      });
      setEntries((items) => [entry, ...items]);
      setDraft('');
      setVoiceDraft(false);
      setStatus('Entry saved on this demo server. You can choose an excerpt for Talk below.');
    } catch {
      setStatus('Entry was not saved. Your draft is kept; try again.');
    } finally {
      setBusy(false);
    }
  }

  async function createMemory() {
    if (!selectedEntry || !excerpt.trim() || busy || recording) return;
    setBusy(true);
    try {
      const session = await getSession();
      const item = await request<MemoryItem>(`/sessions/${session.session_id}/memory`, session, {
        source_entry_id: selectedEntry.id,
        excerpt: excerpt.trim(),
      });
      setMemories((values) => [item, ...values]);
      setSelectedEntry(undefined);
      setStatus('Excerpt saved as pending. Approve it separately before Talk can use it.');
    } catch {
      setStatus('Excerpt was not saved. Your entry is unchanged; try again.');
    } finally {
      setBusy(false);
    }
  }

  async function memoryAction(id: string, action: 'approve' | 'revoke' | 'delete') {
    if (busy || recording) return;
    setBusy(true);
    try {
      const session = await getSession();
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
      if (action !== 'approve') {
        onContextRevoked();
        setStatus(
          'Context removed from future use. Prior Talk history was cleared on this device to prevent reuse.',
        );
      }
    } catch {
      setStatus('Context was not changed. Try again when Mira is online.');
    } finally {
      setBusy(false);
    }
  }

  async function feedbackAction(id: string, action: 'reuse' | 'delete', enabled?: boolean) {
    if (busy || recording) return;
    setBusy(true);
    try {
      const session = await getSession();
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
      if (action === 'delete' || !enabled) onContextRevoked();
    } catch {
      setStatus('Feedback context was not changed. Try again when Mira is online.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(id: string) {
    if (busy || recording) return;
    setBusy(true);
    try {
      const session = await getSession();
      await request(`/sessions/${session.session_id}/journal/${id}`, session, undefined, 'DELETE');
      setEntries((items) => items.filter((item) => item.id !== id));
      setMemories((items) => items.filter((item) => item.source_entry_id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(undefined);
        setExcerpt('');
      }
      onContextRevoked();
      setStatus('Entry deleted. Linked context was removed from future use.');
    } catch {
      setStatus('Entry was not deleted. Try again when Mira is online.');
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo() {
    if (busy || recording) return;
    setBusy(true);
    try {
      const session = await getSession();
      await request(`/sessions/${session.session_id}/reset`, session, {});
      setEntries([]);
      setMemories([]);
      setFeedback([]);
      setSelectedEntry(undefined);
      setExcerpt('');
      setDraft('');
      setVoiceDraft(false);
      onReset();
      try {
        await clearContinueItems();
      } catch {
        setStatus(
          'Server data cleared. Saved Actions items could not be cleared on this device; retry Reset.',
        );
        return;
      }
      const cleaned = audio.discard();
      setStatus(
        cleaned
          ? 'Demo data cleared.'
          : 'Saved data cleared. The local recording could not be deleted; retry Discard.',
      );
    } catch {
      setStatus('Demo data was not cleared. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 18 }}>
      <Surface style={{ gap: 14, padding: 18 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Eyebrow>A PRIVATE NOTE</Eyebrow>
          <StatusPill tone={recording ? 'warn' : 'neutral'}>
            {recording ? 'Recording' : voiceDraft ? 'Voice draft' : 'Draft'}
          </StatusPill>
        </View>
        <Text style={ui.heading}>What’s on your mind?</Text>
        <Text accessibilityLiveRegion="polite" style={ui.muted}>
          {status}
        </Text>
        <TextInput
          accessibilityLabel="Editable journal draft"
          multiline
          value={draft}
          onChangeText={setDraft}
          editable={!busy && !recording}
          placeholder="A few words about your day…"
          style={ui.input}
        />
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <ActionButton
            label="Save entry"
            loading={busy && !recording}
            disabled={recording || !draft.trim()}
            onPress={() => void saveEntry()}
            style={{ flex: 1 }}
          />
          <ActionButton
            label={recording ? 'Stop' : 'Record'}
            variant="secondary"
            loading={audio.busy && recording}
            disabled={busy || !!uri}
            onPress={() => void (recording ? stop() : start())}
            style={{ flex: 1 }}
          />
        </View>
        {uri && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ActionButton
              label="Retry transcription"
              variant="secondary"
              loading={busy}
              onPress={() => void transcribe(uri)}
              style={{ flex: 1 }}
            />
            <ActionButton
              label="Discard"
              variant="quiet"
              disabled={busy}
              onPress={() => {
                if (audio.discard()) setStatus('Recording discarded. Your text draft is kept.');
              }}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Surface>
      <JournalEntries
        entries={entries}
        busy={busy}
        recording={recording}
        onChoose={(entry) => {
          setSelectedEntry(entry);
          setExcerpt(entry.text.slice(0, 500));
        }}
        onDelete={(id) => void deleteEntry(id)}
      />
      <MemorySections
        selectedEntry={selectedEntry}
        excerpt={excerpt}
        setExcerpt={setExcerpt}
        memories={memories}
        busy={busy}
        recording={recording}
        onSaveExcerpt={() => void createMemory()}
        onCancel={() => setSelectedEntry(undefined)}
        onAction={(id, action) => void memoryAction(id, action)}
      />
      <FeedbackSection
        items={feedback}
        busy={busy}
        recording={recording}
        onAction={(id, action, enabled) => void feedbackAction(id, action, enabled)}
      />
      <ActionButton
        label="Reset demo data"
        variant="quiet"
        disabled={busy || recording}
        onPress={() =>
          Alert.alert(
            'Reset this demo?',
            'This deletes saved journal entries, approved context, action runs, and feedback from this demo.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => void resetDemo() },
            ],
          )
        }
      />
      <View style={{ gap: 8, paddingTop: 4 }}>
        <Eyebrow>ABOUT YOUR NOTES</Eyebrow>
        <Text style={ui.muted}>
          Notes stay private until you share an excerpt with Talk. Voice notes go to OpenAI for
          transcription. The transcript stays a draft until you save it.
        </Text>
        <Text style={ui.muted}>
          Recordings are deleted after transcription or discard. If transcription or deletion fails,
          retry or discard the recording.
        </Text>
      </View>
      {!!memories.length && (
        <Text style={ui.muted}>
          Revoking or deleting context blocks future retrieval. A source already used in the active
          Talk session may remain until that session ends.
        </Text>
      )}
    </View>
  );
}
