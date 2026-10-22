import { withDeviceTransaction } from '../../../../shared/storage/database';

export type BreathingRhythm = 'equal' | 'longer_exhale' | 'double_inhale' | 'own_pace';
export type BreathingPreferences = { defaultRhythm: BreathingRhythm; touchCue: boolean; audioCue: boolean };
const defaults: BreathingPreferences = { defaultRhythm: 'equal', touchCue: false, audioCue: false };

export async function loadBreathingPreferences(): Promise<BreathingPreferences> {
  return withDeviceTransaction(async (db) => {
    const row = await db.getFirstAsync<{ default_rhythm: BreathingRhythm; touch_cue: number; audio_cue: number }>(
      'SELECT default_rhythm, touch_cue, audio_cue FROM breathing_preferences WHERE id = 1',
    );
    return row ? { defaultRhythm: row.default_rhythm, touchCue: row.touch_cue === 1, audioCue: row.audio_cue === 1 } : defaults;
  });
}

export async function saveBreathingDefault(rhythm: BreathingRhythm) {
  await withDeviceTransaction((db) => db.runAsync(
    'UPDATE breathing_preferences SET default_rhythm = ?, updated_at = ? WHERE id = 1', rhythm, Date.now(),
  ).then(() => undefined));
}

export async function saveBreathingCues(cues: Pick<BreathingPreferences, 'touchCue' | 'audioCue'>) {
  await withDeviceTransaction((db) => db.runAsync(
    'UPDATE breathing_preferences SET touch_cue = ?, audio_cue = ?, updated_at = ? WHERE id = 1',
    cues.touchCue ? 1 : 0, cues.audioCue ? 1 : 0, Date.now(),
  ).then(() => undefined));
}
