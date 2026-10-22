import data from '../../../../assets/catalog/activities.json';
import type { Intervention } from '../../../shared/interventions';
import {
  ACTIVITY_CATALOG_VERSION,
  canonicalActivityId,
  isCompatibleActivity,
  primaryActivityIds,
  type RegisteredActivityId,
} from '../../../shared/activityRegistry';

const activities = new Map<string, Intervention>();

for (const definition of data.activities) {
  const item = { ...definition, catalog_version: ACTIVITY_CATALOG_VERSION } as Intervention;
  if (activities.has(item.id) || !isCompatibleActivity(item)) {
    throw new Error(`Invalid bundled activity definition: ${item.id}`);
  }
  activities.set(item.id, item);
}

for (const id of [...primaryActivityIds, ...Object.values(data.aliases)]) {
  if (!activities.has(id)) throw new Error(`Missing bundled activity definition: ${id}`);
}

export const activityGroups = data.library_groups.map((group) => ({
  title: group.title,
  ids: group.ids as RegisteredActivityId[],
}));

const libraryIds = activityGroups.flatMap((group) => group.ids);
if (
  libraryIds.length !== primaryActivityIds.length ||
  new Set(libraryIds).size !== libraryIds.length ||
  primaryActivityIds.some((id) => !libraryIds.includes(id))
) {
  throw new Error('Bundled library groups must contain each primary activity exactly once.');
}

/** Return an owned copy so edits in a live activity cannot mutate the bundled catalog. */
export function getBundledIntervention(id: string): Intervention | undefined {
  const canonicalId = canonicalActivityId(id);
  const item = canonicalId ? activities.get(canonicalId) : undefined;
  return item ? (JSON.parse(JSON.stringify(item)) as Intervention) : undefined;
}

export function getBundledActivities(): Intervention[] {
  return primaryActivityIds.map((id) => getBundledIntervention(id)!);
}
