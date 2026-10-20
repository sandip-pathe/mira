import type { Intervention } from './interventions';
import catalog from '../../assets/catalog/activities.json';

export const ACTIVITY_CLIENT_VERSION = 'activity-ui-11';
export const ACTIVITY_CATALOG_VERSION = catalog.catalog_version;

export const activityRegistry = {
  brain_dump: { pattern: 'capture', group: 'Express' },
  grounding: { pattern: 'grounding', group: 'Follow a guide' },
  paced_breathing: { pattern: 'breathing', group: 'Follow a guide' },
  one_small_step: { pattern: 'sort', group: 'Move forward' },
  task_reset_60s: { pattern: 'sort', group: 'Move forward' },
  name_a_feeling: { pattern: 'steps', group: 'Express' },
  write_100_words: { pattern: 'letter', group: 'Express' },
  unsent_letter: { pattern: 'letter', group: 'Express' },
  reach_out: { pattern: 'steps', group: 'Move forward' },
  short_movement: { pattern: 'steps', group: 'Take a break' },
  one_song_break: { pattern: 'steps', group: 'Take a break' },
  one_song_reset: { pattern: 'steps', group: 'Take a break' },
  unsent_message: { pattern: 'letter', group: 'Express' },
  perspective_shift: { pattern: 'steps', group: 'Express' },
} as const;

export type RegisteredActivityId = keyof typeof activityRegistry;
export const registeredActivityIds = Object.keys(activityRegistry) as RegisteredActivityId[];
export const primaryActivityIds = catalog.primary_activity_ids as RegisteredActivityId[];
const currentActivityIds: RegisteredActivityId[] = [...primaryActivityIds, 'task_reset_60s'];

const legacyIdMap = catalog.aliases as Record<string, RegisteredActivityId>;

export function canonicalActivityId(id: string): RegisteredActivityId | undefined {
  if (Object.hasOwn(legacyIdMap, id)) return legacyIdMap[id];
  if (Object.hasOwn(activityRegistry, id)) return id as RegisteredActivityId;
  return undefined;
}

export function isCompatibleActivity(value: Intervention): boolean {
  const id = canonicalActivityId(value.id);
  if (!id || value.catalog_version !== ACTIVITY_CATALOG_VERSION) return false;
  const expected = activityRegistry[id];
  return value.presentation?.pattern === expected.pattern && value.steps.length > 0;
}

export function activityCapabilities() {
  return {
    client_version: ACTIVITY_CLIENT_VERSION,
    catalog_version: ACTIVITY_CATALOG_VERSION,
    activity_ids: currentActivityIds,
  } as const;
}
