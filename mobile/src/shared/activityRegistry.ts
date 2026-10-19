import type { Intervention } from './interventions';

export const ACTIVITY_CLIENT_VERSION = 'activity-ui-11';
export const ACTIVITY_CATALOG_VERSION = '0.14';

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
export const primaryActivityIds = [
  'grounding',
  'paced_breathing',
  'brain_dump',
  'one_small_step',
  'name_a_feeling',
  'unsent_letter',
  'reach_out',
  'short_movement',
  'one_song_break',
] as const satisfies readonly RegisteredActivityId[];
const currentActivityIds: RegisteredActivityId[] = [...primaryActivityIds, 'task_reset_60s'];

const legacyIdMap: Record<string, RegisteredActivityId> = {
  tiny_next_step: 'task_reset_60s',
  pause_60s: 'paced_breathing',
  one_song_reset: 'one_song_break',
};

export function canonicalActivityId(id: string): RegisteredActivityId | undefined {
  if (id in activityRegistry) return id as RegisteredActivityId;
  return legacyIdMap[id];
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
