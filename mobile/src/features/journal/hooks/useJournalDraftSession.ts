import React from 'react';
import { AppState, Keyboard } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { storageErrorMessage } from '../../../shared/storage/database';
import { COLOR_PAIRS, PROMPT_GROUPS, type ColorPair } from '../components/journalConstants';
import type { JournalDraftSnapshot, JournalSessionSummary, LocalJournalSession } from '../types';
import { getLocalJournal, listLocalJournals, persistJournalDraft } from '../data/journalRepository';
import { retryJournalFileCleanup } from '../data/attachmentRepository';
import { JournalDraftWriter } from '../data/draftWriter';

type Editor = { snapshot: JournalDraftSnapshot; saved: boolean; persisted: boolean };
function mergeDrafts(sessions: JournalSessionSummary[], drafts: JournalDraftSnapshot[]) {
  const rows = new Map(sessions.map((item) => [item.id, item]));
  for (const snapshot of drafts) {
    if (!snapshot.text.trim()) continue;
    const prior = rows.get(snapshot.id);
    rows.set(snapshot.id, {
      ...prior,
      id: snapshot.id,
      title: prior?.title ?? 'Journal draft',
      initial_prompt: snapshot.prompt,
      created_at: prior?.created_at ?? Date.now() / 1000,
      updated_at: Date.now() / 1000,
      saved: false,
      preview: snapshot.text,
      entry_count: prior?.entry_count ?? 0,
    });
  }
  return [...rows.values()].sort((a, b) => b.updated_at - a.updated_at);
}

export function useJournalDraftSession() {
  const [document, setDocument] = React.useState<LocalJournalSession>();
  const [currentJournalId, setCurrentJournalId] = React.useState<string>();
  const [journalSessions, setJournalSessions] = React.useState<JournalSessionSummary[]>([]);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [draft, setDraftText] = React.useState('');
  const [selectedPrompt, setPrompt] = React.useState(PROMPT_GROUPS[0].prompts[0]);
  const [palette, setPaletteState] = React.useState<ColorPair>(COLOR_PAIRS[0]);
  const [fontSize, setFontSizeState] = React.useState(17);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState(false);
  const editor = React.useRef<Editor | undefined>(undefined);
  const mounted = React.useRef(true);
  const operation = React.useRef(false);
  const navigation = React.useRef(0);
  const settings = React.useRef({
    prompt: PROMPT_GROUPS[0].prompts[0],
    palette: COLOR_PAIRS[0],
    fontSize: 17,
  });
  const report = React.useCallback((message: string, failed = false) => {
    if (mounted.current) {
      setStatus(message);
      setError(failed);
    }
  }, []);
  const [writer] = React.useState(() => new JournalDraftWriter(persistJournalDraft));
  React.useLayoutEffect(() => {
    writer.setFailureHandler((_snapshot, failure) =>
      report(
        storageErrorMessage(
          failure,
          'Your draft is still in memory. Local saving failed; try saving again.',
        ),
        true,
      ),
    );
  }, [writer, report]);

  const applyDocument = React.useCallback((value: LocalJournalSession) => {
    editor.current = {
      snapshot: {
        id: value.id,
        prompt: value.initial_prompt,
        text: value.draft,
        revision: value.revision,
        presentation: value.presentation,
      },
      saved: value.saved,
      persisted: true,
    };
    settings.current = { prompt: value.initial_prompt, ...value.presentation };
    setDocument(value);
    setCurrentJournalId(value.id);
    setDraftText(value.draft);
    setPrompt(value.initial_prompt);
    setPaletteState(value.presentation.palette);
    setFontSizeState(value.presentation.fontSize);
  }, []);
  const refreshJournalSessions = React.useCallback(async () => {
    try {
      const rows = await listLocalJournals();
      if (mounted.current) setJournalSessions(mergeDrafts(rows, writer.snapshots()));
    } catch (failure) {
      if (mounted.current) setJournalSessions((rows) => mergeDrafts(rows, writer.snapshots()));
      report(
        storageErrorMessage(failure, 'Journal could not be opened on this device. Try again.'),
        true,
      );
      throw failure;
    }
  }, [writer, report]);

  React.useEffect(() => {
    mounted.current = true;
    void refreshJournalSessions()
      .catch(() => {})
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    void retryJournalFileCleanup().catch(() => {});
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void writer.flushAll();
    });
    return () => {
      mounted.current = false;
      listener.remove();
      void writer.flushAll();
    };
  }, [refreshJournalSessions, writer]);

  const startJournal = React.useCallback(() => {
    if (operation.current) return;
    navigation.current += 1;
    void writer.flushAll();
    const { prompt, palette: nextPalette, fontSize: nextSize } = settings.current;
    editor.current = {
      snapshot: {
        id: randomUUID(),
        prompt,
        text: '',
        revision: 0,
        presentation: { palette: nextPalette, fontSize: nextSize },
      },
      saved: false,
      persisted: false,
    };
    setCurrentJournalId(editor.current.snapshot.id);
    setDocument(undefined);
    setDraftText('');
    setPrompt(prompt);
    setEditorOpen(true);
    setLoading(false);
    setStatus('');
    setError(false);
  }, [writer]);

  function updateSnapshot(
    patch: Partial<Pick<JournalDraftSnapshot, 'text' | 'prompt' | 'presentation'>>,
  ) {
    const active = editor.current;
    if (!active || active.saved || operation.current) return false;
    const next = { ...active.snapshot, ...patch, revision: active.snapshot.revision + 1 };
    editor.current = { ...active, snapshot: next };
    writer.queue(next);
    return true;
  }
  function setDraft(text: string) {
    if (text.length <= 12000 && updateSnapshot({ text })) setDraftText(text);
  }
  function setPalette(value: ColorPair) {
    const active = editor.current;
    if (
      active &&
      updateSnapshot({ presentation: { ...active.snapshot.presentation, palette: value } })
    ) {
      settings.current.palette = value;
      setPaletteState(value);
    }
  }
  function setFontSize(value: number) {
    const active = editor.current;
    if (
      active &&
      updateSnapshot({ presentation: { ...active.snapshot.presentation, fontSize: value } })
    ) {
      settings.current.fontSize = value;
      setFontSizeState(value);
    }
  }
  async function choosePrompt(prompt: string) {
    if (document?.entries.length || !updateSnapshot({ prompt })) return false;
    settings.current.prompt = prompt;
    setPrompt(prompt);
    Keyboard.dismiss();
    return true;
  }

  function closeJournal() {
    navigation.current += 1;
    Keyboard.dismiss();
    const active = editor.current;
    if (active && !active.saved && (active.persisted || active.snapshot.text)) {
      writer.queue(active.snapshot);
    }
    if (active)
      void writer
        .flush(active.snapshot.id)
        .then(() => refreshJournalSessions())
        .catch(() => {});
    editor.current = undefined;
    setCurrentJournalId(undefined);
    setEditorOpen(false);
  }
  async function openJournal(id: string): Promise<boolean> {
    if (operation.current) return false;
    const attempt = ++navigation.current;
    setLoading(true);
    try {
      await writer.flushAll();
      if (attempt !== navigation.current) return false;
      const pending = writer.snapshots().find((item) => item.id === id);
      const value = await getLocalJournal(id);
      if (attempt !== navigation.current) return false;
      if (!value && pending) {
        applyDocument({
          id,
          title: 'Journal draft',
          initial_prompt: pending.prompt,
          created_at: Date.now() / 1000,
          updated_at: Date.now() / 1000,
          saved: false,
          entry_count: 0,
          entries: [],
          voice_notes: [],
          draft: pending.text,
          revision: pending.revision,
          presentation: pending.presentation,
        });
        setEditorOpen(true);
        report('Your draft is open in memory. Local saving needs retry.', true);
        return true;
      }
      if (!value) throw new Error('This Journal session no longer exists.');
      applyDocument(
        pending && !value.saved
          ? {
              ...value,
              draft: pending.text,
              revision: pending.revision,
              presentation: pending.presentation,
            }
          : value,
      );
      setEditorOpen(true);
      report('');
      return true;
    } catch (failure) {
      report(
        storageErrorMessage(
          failure,
          'Journal could not be opened. Your local data is unchanged; try again.',
        ),
        true,
      );
      return false;
    } finally {
      if (mounted.current && attempt === navigation.current) setLoading(false);
    }
  }

  return {
    state: {
      journalSessions,
      currentJournalId,
      currentSaved: document?.saved ?? false,
      editorOpen,
      entries: document?.entries ?? [],
      draft,
      setDraft,
      selectedPrompt,
      choosePrompt,
      palette,
      setPalette,
      fontSize,
      setFontSize,
      loading,
      saving,
      status,
      error,
      busy: saving,
      background: palette.light,
      startJournal,
      closeJournal,
      openJournal,
      refreshJournalSessions,
      report,
    },
    editing: {
      editor,
      mounted,
      operation,
      writer,
      report,
      applyDocument,
      refreshJournalSessions,
      setSaving,
    },
  };
}
