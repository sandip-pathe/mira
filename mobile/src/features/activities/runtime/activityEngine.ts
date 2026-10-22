import { canonicalActivityId } from '../../../shared/activityRegistry';

export type LocalActivityRun = {
  id: string;
  action_id: string;
  state: 'started' | 'completed' | 'skipped' | 'stopped';
};

export function createLocalActivityRun(id: string, activityId: string): LocalActivityRun {
  const canonicalId = canonicalActivityId(activityId);
  if (!id || !canonicalId) throw new Error('Invalid local activity run.');
  return { id, action_id: canonicalId, state: 'started' };
}

/** Terminal transitions are idempotent: repeated presses cannot change an outcome. */
export function finishLocalActivityRun(
  run: LocalActivityRun,
  state: Exclude<LocalActivityRun['state'], 'started'>,
): LocalActivityRun {
  return run.state === 'started' ? { ...run, state } : run;
}
