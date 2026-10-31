import { withDeviceTransaction } from './database';

export function hasCompletedWelcome(): Promise<boolean> {
  return withDeviceTransaction(async (db) => {
    const row = await db.getFirstAsync<{ welcome_completed: number }>(
      'SELECT welcome_completed FROM app_preferences WHERE id = 1',
    );
    return row?.welcome_completed === 1;
  });
}

export function completeWelcome(): Promise<void> {
  return withDeviceTransaction(async (db) => {
    await db.runAsync('UPDATE app_preferences SET welcome_completed = 1 WHERE id = 1');
  });
}
