import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { emitContextRevoked } from '../../../shared/demoEvents';
import { storageErrorMessage } from '../../../shared/storage/database';
import type { JournalEntry, LocalJournalSession } from '../types';
import {
  appendJournalEntry,
  deleteLocalJournal,
  deleteLocalJournalEntry,
  saveLocalJournal,
} from '../data/journalRepository';
import {
  deleteJournalAttachment,
  retryJournalFileCleanup,
  saveJournalAttachment,
} from '../data/attachmentRepository';
import type { useJournalDraftSession } from './useJournalDraftSession';

type Editing = ReturnType<typeof useJournalDraftSession>['editing'];

export function useJournalMutations({
  editor,
  mounted,
  operation,
  writer,
  audio,
  followUp,
  report,
  applyDocument,
  refreshJournalSessions,
  setSaving,
}: Editing) {
  function begin() {
    if (operation.current || audio.busy || audio.recording) return false;
    operation.current = true;
    setSaving(true);
    return true;
  }
  function end() {
    operation.current = false;
    if (mounted.current) setSaving(false);
    if (!editor.current) void audio.discardPending().catch(() => {});
  }
  async function saveEntry() {
    const active = editor.current;
    if (!active || active.saved || !active.snapshot.text.trim() || !begin()) return;
    const entryId = randomUUID();
    writer.forget(active.snapshot.id);
    followUp.cancelFollowUp();
    let added: LocalJournalSession | undefined;
    try {
      added = await appendJournalEntry(active.snapshot, entryId);
      if (editor.current?.snapshot.id === added.id) {
        applyDocument(added);
        report('Entry saved on this device.');
      }
      void refreshJournalSessions().catch(() => {});
    } catch (failure) {
      writer.queue(active.snapshot);
      report(
        storageErrorMessage(failure, 'Entry was not saved. Your writing is still here; try again.'),
        true,
      );
    } finally {
      end();
    }
    if (added && editor.current?.snapshot.id === added.id)
      void followUp.runFollowUp(added, entryId);
  }
  async function saveCurrentSession(): Promise<boolean> {
    const active = editor.current;
    if (!active || active.saved || audio.uri || !begin()) return false;
    followUp.cancelFollowUp();
    writer.forget(active.snapshot.id);
    try {
      const saved = await saveLocalJournal(active.snapshot, randomUUID());
      if (editor.current?.snapshot.id === saved.id) applyDocument(saved);
      report('Journal session saved on this device.');
      void refreshJournalSessions().catch(() => {});
      return true;
    } catch (failure) {
      writer.queue(active.snapshot);
      report(
        storageErrorMessage(
          failure,
          'Session was not saved. Your writing is still here; try again.',
        ),
        true,
      );
      return false;
    } finally {
      end();
    }
  }
  async function saveVoiceNote() {
    const active = editor.current,
      uri = audio.uri;
    if (!active || active.saved || !uri || !begin()) return;
    writer.forget(active.snapshot.id);
    followUp.cancelFollowUp();
    try {
      const saved = await saveJournalAttachment(active.snapshot, {
        id: randomUUID(),
        uri,
        created_at: Date.now(),
      });
      audio.keep();
      if (editor.current?.snapshot.id === saved.id) applyDocument(saved);
      report('Voice note saved on this device.');
      void refreshJournalSessions().catch(() => {});
    } catch (failure) {
      writer.queue(active.snapshot);
      report(
        storageErrorMessage(
          failure,
          'Voice note was not saved. The recording is still here; try again.',
        ),
        true,
      );
    } finally {
      end();
    }
  }
  async function deleteVoiceNote(id: string) {
    if (!begin()) return;
    followUp.cancelFollowUp();
    try {
      if (editor.current && !(await writer.flush(editor.current.snapshot.id)))
        throw new Error('Draft save failed.');
      const value = await deleteJournalAttachment(id);
      if (value && editor.current?.snapshot.id === value.id) applyDocument(value);
      const cleaned = await retryJournalFileCleanup().catch(() => false);
      report(cleaned ? 'Voice note deleted.' : 'Voice note removed. File cleanup will retry.');
      void refreshJournalSessions().catch(() => {});
    } catch (failure) {
      report(storageErrorMessage(failure, 'Voice note was not deleted. Try again.'), true);
    } finally {
      end();
    }
  }
  function deleteEntry(entry: JournalEntry) {
    Alert.alert(
      'Delete entry?',
      'This removes the entry and its linked excerpts from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void removeEntry(entry.id) },
      ],
    );
  }
  async function removeEntry(id: string) {
    if (!begin()) return;
    followUp.cancelFollowUp();
    try {
      if (editor.current && !(await writer.flush(editor.current.snapshot.id)))
        throw new Error('Draft save failed.');
      const value = await deleteLocalJournalEntry(id);
      if (value && editor.current?.snapshot.id === value.id) applyDocument(value);
      emitContextRevoked();
      report('Entry deleted. Linked excerpts were removed.');
      void refreshJournalSessions().catch(() => {});
    } catch (failure) {
      report(storageErrorMessage(failure, 'Entry was not deleted. Try again.'), true);
    } finally {
      end();
    }
  }
  function deleteJournal(id: string) {
    Alert.alert(
      'Delete this Journal session?',
      'This removes its writing, saved voice notes, and linked excerpts from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void removeJournal(id) },
      ],
    );
  }
  async function removeJournal(id: string) {
    if (!begin()) return;
    followUp.cancelFollowUp();
    const pending = writer.snapshots().find((item) => item.id === id);
    writer.forget(id);
    try {
      await deleteLocalJournal(id);
      emitContextRevoked();
      const cleaned = await retryJournalFileCleanup().catch(() => false);
      report(
        cleaned
          ? 'Journal session deleted.'
          : 'Journal session deleted. Voice file cleanup will retry.',
      );
      void refreshJournalSessions().catch(() => {});
    } catch (failure) {
      if (pending) writer.queue(pending);
      report(
        storageErrorMessage(failure, 'Journal session could not be deleted. Try again.'),
        true,
      );
    } finally {
      end();
    }
  }

  return {
    saveEntry,
    saveCurrentSession,
    saveVoiceNote,
    deleteVoiceNote,
    deleteEntry,
    deleteJournal,
  };
}
