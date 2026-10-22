import { withDeviceTransaction } from './database';
import type { ThemeId } from '../../components/ui/themeTokens';

const validThemes: ThemeId[] = ['warm-light', 'forest-dark', 'blackout'];

export function loadThemePreference(): Promise<ThemeId> {
  return withDeviceTransaction(async (db) => {
    const row = await db.getFirstAsync<{ theme_id: string }>(
      'SELECT theme_id FROM app_preferences WHERE id = 1',
    );
    return validThemes.includes(row?.theme_id as ThemeId) ? row!.theme_id as ThemeId : 'warm-light';
  });
}

export function saveThemePreference(themeId: ThemeId): Promise<void> {
  return withDeviceTransaction(async (db) => {
    await db.runAsync('UPDATE app_preferences SET theme_id = ? WHERE id = 1', themeId);
  });
}
