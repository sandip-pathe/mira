import { withDeviceTransaction } from '../../../../shared/storage/database';

export type MoveChoice = 'walk' | 'move_here' | 'change_spot' | 'custom' | 'stay';
export type MoveScenePreferences = { preferredChoice?: MoveChoice; rememberChoice: boolean; showElapsed: boolean; audioCue: boolean };
const defaults: MoveScenePreferences = { rememberChoice: false, showElapsed: false, audioCue: false };

export async function loadMoveScenePreferences(): Promise<MoveScenePreferences> {
  return withDeviceTransaction(async (db) => {
    const row = await db.getFirstAsync<{ preferred_choice: MoveChoice | null; remember_choice: number; show_elapsed: number; audio_cue: number }>(
      'SELECT preferred_choice, remember_choice, show_elapsed, audio_cue FROM move_scene_preferences WHERE id = 1',
    );
    if (!row) return defaults;
    return { preferredChoice: row.remember_choice === 1 ? row.preferred_choice ?? undefined : undefined,
      rememberChoice: row.remember_choice === 1, showElapsed: row.show_elapsed === 1, audioCue: row.audio_cue === 1 };
  });
}

export async function saveMoveScenePreferences(value: MoveScenePreferences) {
  await withDeviceTransaction((db) => db.runAsync(
    'UPDATE move_scene_preferences SET preferred_choice = ?, remember_choice = ?, show_elapsed = ?, audio_cue = ?, updated_at = ? WHERE id = 1',
    value.rememberChoice ? value.preferredChoice ?? null : null, value.rememberChoice ? 1 : 0,
    value.showElapsed ? 1 : 0, value.audioCue ? 1 : 0, Date.now(),
  ).then(() => undefined));
}
