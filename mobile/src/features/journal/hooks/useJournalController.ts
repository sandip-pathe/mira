import { useJournalEditor } from './useJournalEditor';
import { useJournalContext } from './useJournalContext';

export function useJournalController() {
  const editor = useJournalEditor();
  const context = useJournalContext(
    editor.busy,
    editor.report,
    editor.currentJournalId,
  );
  return { ...editor, ...context, busy: editor.busy || context.busy };
}
