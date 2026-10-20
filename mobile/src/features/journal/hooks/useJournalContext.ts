import React from 'react';
import { onContextRevoked } from '../../../shared/demoEvents';
import { storageErrorMessage } from '../../../shared/storage/database';
import {
  changeActivityPreference,
  loadActivityPreferences,
  onActivityPreferencesChanged,
} from '../../actions/data/preferenceRepository';
import { changeLocalMemory, createLocalMemory, listLocalMemories } from '../data/memoryRepository';
import type { FeedbackItem, JournalEntry, MemoryItem } from '../types';

export function useJournalContext(
  blocked: boolean,
  report: (message: string, failed?: boolean) => void,
  sessionId?: string,
) {
  const [memories, setMemories] = React.useState<MemoryItem[]>([]);
  const [feedback, setFeedback] = React.useState<FeedbackItem[]>([]);
  const [selection, setSelection] = React.useState<{
    sessionId?: string;
    entry?: JournalEntry;
    excerpt: string;
  }>({ excerpt: '' });
  const selectedEntry = selection.sessionId === sessionId ? selection.entry : undefined;
  const excerpt = selection.sessionId === sessionId ? selection.excerpt : '';
  function setSelectedEntry(entry?: JournalEntry) {
    setSelection((value) => ({
      sessionId,
      entry,
      excerpt: value.sessionId === sessionId ? value.excerpt : '',
    }));
  }
  function setExcerpt(text: string) {
    setSelection((value) => ({
      sessionId,
      entry: value.sessionId === sessionId ? value.entry : undefined,
      excerpt: text,
    }));
  }
  const [busy, setBusy] = React.useState(false);
  const pending = React.useRef(false);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    const refreshMemories = () => {
      void listLocalMemories()
        .then((items) => {
          if (mounted.current) {
            setMemories(items);
            setSelection({ excerpt: '' });
          }
        })
        .catch((error) =>
          report(storageErrorMessage(error, 'Saved excerpts could not be opened.'), true),
        );
    };
    const refreshPreferences = () => {
      void loadActivityPreferences()
        .then((items) => {
          if (mounted.current) setFeedback(items);
        })
        .catch((error) =>
          report(storageErrorMessage(error, 'Saved preferences could not be opened.'), true),
        );
    };
    refreshMemories();
    refreshPreferences();
    const unsubscribeContext = onContextRevoked(refreshMemories);
    const unsubscribePreferences = onActivityPreferencesChanged(refreshPreferences);
    return () => {
      mounted.current = false;
      unsubscribeContext();
      unsubscribePreferences();
    };
  }, [report]);

  async function change(work: () => Promise<void>, success: string) {
    if (blocked || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await work();
      report(success);
    } catch (error) {
      report(
        storageErrorMessage(
          error,
          'This change was not saved. Check device storage and try again.',
        ),
        true,
      );
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function saveExcerpt() {
    if (!selectedEntry || !excerpt.trim()) return;
    const source = selectedEntry,
      text = excerpt;
    await change(async () => {
      const item = await createLocalMemory(source.id, text);
      if (mounted.current) {
        setMemories((items) => [item, ...items]);
        setSelectedEntry(undefined);
        setExcerpt('');
      }
    }, 'Excerpt saved on this device as pending. Approve it separately for Talk.');
  }
  async function memoryAction(id: string, action: 'approve' | 'revoke' | 'delete') {
    await change(
      async () => {
        await changeLocalMemory(id, action);
        if (mounted.current)
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
                        revoked: action === 'revoke' ? 1 : 0,
                      },
                    ],
            ),
          );
      },
      action === 'approve'
        ? 'Excerpt approved for Talk on this device.'
        : 'Future use of this excerpt was removed.',
    );
  }
  async function feedbackAction(id: string, action: 'reuse' | 'delete', enabled?: boolean) {
    await change(
      async () => {
        await changeActivityPreference(id, action, enabled);
        if (mounted.current)
          setFeedback((items) =>
            items.flatMap((item) =>
              item.id !== id
                ? [item]
                : action === 'delete'
                  ? []
                  : [{ ...item, reuse_context: enabled ? 1 : 0 }],
            ),
          );
      },
      action === 'delete' || !enabled
        ? 'Future use of this preference was removed.'
        : 'Preference saved on this device.',
    );
  }

  return {
    memories,
    feedback,
    selectedEntry,
    setSelectedEntry,
    excerpt,
    setExcerpt,
    saveExcerpt,
    memoryAction,
    feedbackAction,
    busy,
  };
}
