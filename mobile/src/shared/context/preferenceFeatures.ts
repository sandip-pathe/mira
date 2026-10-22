import { canonicalActivityId, type RegisteredActivityId } from '../activityRegistry';

export type ActivityPreferenceRecord = {
  id: string;
  action_id: string;
  rating: string;
  reuse_context: number;
  helpful_lesson: string;
  created_at: number;
  deleted?: boolean;
};

export type ActivityPreferenceFeature = {
  activityId: RegisteredActivityId;
  rating: string;
  reuse: boolean;
  lesson: string;
  createdAt: number;
  sourceId: string;
};

/** Latest state wins per canonical activity, including explicit removal markers. */
export function latestActivityPreferenceFeatures(records: ActivityPreferenceRecord[]) {
  const latest = new Map<RegisteredActivityId, ActivityPreferenceRecord>();
  for (const record of records) {
    const activityId = canonicalActivityId(record.action_id);
    if (!activityId) continue;
    const previous = latest.get(activityId);
    if (!previous || record.created_at > previous.created_at) latest.set(activityId, record);
  }
  return [...latest.entries()].map(([activityId, record]) => ({
    activityId,
    rating: record.rating,
    reuse: !record.deleted && record.reuse_context === 1,
    lesson: record.deleted ? '' : record.helpful_lesson,
    createdAt: record.created_at,
    sourceId: record.id,
  }));
}

export function rankPromotedActivities(
  records: ActivityPreferenceRecord[],
  stableCatalogOrder: readonly RegisteredActivityId[],
) {
  const order = new Map(stableCatalogOrder.map((id, index) => [id, index]));
  return latestActivityPreferenceFeatures(records)
    .filter((feature) => feature.reuse)
    .sort((a, b) => b.createdAt - a.createdAt || (order.get(a.activityId) ?? Infinity) - (order.get(b.activityId) ?? Infinity));
}

/** Compact, explicit preferences remain available even without a keyword match. */
export function contextPreferenceFeatures(records: ActivityPreferenceRecord[], limit = 3) {
  return latestActivityPreferenceFeatures(records)
    .filter((feature) => feature.reuse && feature.lesson.trim())
    .sort((a, b) => b.createdAt - a.createdAt || a.activityId.localeCompare(b.activityId))
    .slice(0, limit);
}
