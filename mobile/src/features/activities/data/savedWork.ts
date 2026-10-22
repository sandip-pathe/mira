import { canonicalActivityId, type RegisteredActivityId } from '../../../shared/activityRegistry';
import { loadContinueItems, type ContinueItem } from '../../../shared/interventions';
import { loadSavedLetters, type SavedLetter } from '../../../shared/letters';
import { loadSavedTakeaways, type SavedTakeaway } from '../../../shared/savedTakeaways';
import { loadSavedActions, type SavedAction } from '../../../shared/savedActions';
import { loadSavedWordings, type SavedWording } from '../../../shared/savedWordings';
import { loadReachOutDrafts, type ReachOutDraft } from '../../../shared/reachOutDrafts';

/** Content-bearing records have an explicit scope; only shared-context records may enter retrieval. */
export type ActivityDataScope = 'shared_context' | 'private_work' | 'temporary_session';

export type SavedWorkRecord =
  | {
      kind: 'letter';
      scope: 'private_work';
      state: 'saved';
      activityId: 'unknown_legacy';
      savedAt: number;
      record: SavedLetter;
    }
  | {
      kind: 'continue';
      scope: 'private_work' | 'temporary_session';
      state: 'unfinished';
      activityId: RegisteredActivityId;
      savedAt: number;
      record: ContinueItem;
    }
  | {
      kind: 'takeaway';
      scope: 'private_work' | 'shared_context';
      state: 'saved';
      activityId: 'brain_dump';
      savedAt: number;
      record: SavedTakeaway;
    }
  | {
      kind: 'small_action';
      scope: 'private_work';
      state: 'saved';
      activityId: 'one_small_step';
      savedAt: number;
      record: SavedAction;
    }
  | {
      kind: 'selected_wording';
      scope: 'private_work';
      state: 'saved';
      activityId: 'name_a_feeling';
      savedAt: number;
      record: SavedWording;
    }
  | {
      kind: 'reach_out_draft';
      scope: 'private_work';
      state: 'saved';
      activityId: 'reach_out';
      savedAt: number;
      record: ReachOutDraft;
    };

export async function loadSavedWork(): Promise<SavedWorkRecord[]> {
  const [letters, continueRecords, takeaways, actions, wordings, reachOutDrafts] = await Promise.all([
    loadSavedLetters(), loadContinueWork(), loadSavedTakeaways(), loadSavedActions(), loadSavedWordings(), loadReachOutDrafts(),
  ]);
  const letterRecords: SavedWorkRecord[] = letters.map((record) => ({
    kind: 'letter',
    scope: 'private_work',
    state: 'saved',
    activityId: 'unknown_legacy',
    savedAt: record.updatedAt,
    record,
  }));
  const takeawayRecords: SavedWorkRecord[] = takeaways.map((record) => ({
    kind: 'takeaway', scope: 'private_work', state: 'saved', activityId: 'brain_dump', savedAt: record.createdAt, record,
  }));
  const actionRecords: SavedWorkRecord[] = actions.map((record) => ({
    kind: 'small_action', scope: 'private_work', state: 'saved', activityId: 'one_small_step', savedAt: record.updatedAt, record,
  }));
  const wordingRecords: SavedWorkRecord[] = wordings.map((record) => ({
    kind: 'selected_wording', scope: 'private_work', state: 'saved', activityId: 'name_a_feeling', savedAt: record.createdAt, record,
  }));
  const reachOutRecords: SavedWorkRecord[] = reachOutDrafts.map((record) => ({
    kind: 'reach_out_draft', scope: 'private_work', state: 'saved', activityId: 'reach_out', savedAt: record.updatedAt, record,
  }));
  return [...letterRecords, ...continueRecords, ...takeawayRecords, ...actionRecords, ...wordingRecords, ...reachOutRecords].sort((a, b) => b.savedAt - a.savedAt);
}

export async function loadContinueWork(): Promise<Extract<SavedWorkRecord, { kind: 'continue' }>[]> {
  const items = await loadContinueItems();
  return items.flatMap((record) => {
    const activityId = canonicalActivityId(record.intervention_id);
    if (!activityId) return [];
    return [{
      kind: 'continue' as const,
      scope: activityId === 'brain_dump' ? 'temporary_session' as const : 'private_work' as const,
      state: 'unfinished' as const,
      activityId,
      savedAt: record.created_at,
      record,
    }];
  });
}

/** Never pass private work or temporary session content to general context retrieval. */
export function sharedContextSources(records: SavedWorkRecord[]) {
  return records.filter((record) => record.scope === 'shared_context');
}
