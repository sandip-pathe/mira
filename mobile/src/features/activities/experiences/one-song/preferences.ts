import { withDeviceTransaction } from '../../../../shared/storage/database';
import type { SoundscapeId } from './soundscapeData';

export async function loadPreferredSoundscape(): Promise<SoundscapeId | undefined> {
  return withDeviceTransaction(async (db) => {
    const row = await db.getFirstAsync<{ preferred_scene: SoundscapeId | null }>(
      'SELECT preferred_scene FROM soundscape_preferences WHERE id = 1',
    );
    return row?.preferred_scene ?? undefined;
  });
}

export async function savePreferredSoundscape(id: SoundscapeId | undefined) {
  await withDeviceTransaction((db) => db.runAsync(
    'UPDATE soundscape_preferences SET preferred_scene = ?, updated_at = ? WHERE id = 1', id ?? null, Date.now(),
  ).then(() => undefined));
}
