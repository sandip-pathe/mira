import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { emitContextRevoked } from '../../../shared/demoEvents';
import { storageErrorMessage } from '../../../shared/storage/database';
import type { JournalEntry } from '../types';
import {
  deleteLocalJournal,
  deleteLocalJournalEntry,
  saveLocalJournal,
} from '../data/journalRepository';
import { retryJournalFileCleanup } from '../data/attachmentRepository';
import type { useJournalDraftSession } from './useJournalDraftSession';

type Editing = ReturnType<typeof useJournalDraftSession>['editing'];

export function useJournalMutations({
  editor,
  mounted,
  operation,
  writer,
  report,
  applyDocument,
  refreshJournalSessions,
  setSaving,
}: Editing) {
  function begin() {
    if (operation.current) return false;
    operation.current = true;
    setSaving(true);
    return true;
  }
  function end() {
    operation.current = false;
    if (mounted.current) setSaving(false);
  }
  async function saveCurrentSession(): Promise<boolean> {
    const active = editor.current;
    if (!active || active.saved || !begin()) return false;
    writer.forget(active.snapshot.id);
    try {
      const lines = active.snapshot.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const saved = await saveLocalJournal(active.snapshot, lines.map(() => randomUUID()));
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
    saveCurrentSession,
    deleteEntry,
    deleteJournal,
  };
}
