import { useJournalDraftSession } from './useJournalDraftSession';
import { useJournalMutations } from './useJournalMutations';

export function useJournalEditor() {
  const { state, editing } = useJournalDraftSession();
  const mutations = useJournalMutations(editing);
  return { ...state, ...mutations };
}
