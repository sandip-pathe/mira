import {
  mutateDeviceCollection,
  readDeviceCollection,
  type CollectionSource,
} from '../../../shared/storage/collectionStore';
import type { LocalActivityRun } from '../../activities/runtime/activityEngine';
import type { Rating } from '../../activities/data/activityFeedback';
import { emitContextRevoked } from '../../../shared/demoEvents';

export type LocalActivityPreference = {
  id: string;
  action_id: string;
  rating: Rating;
  reuse_context: number;
  helpful_lesson: string;
  created_at: number;
  storage: 'device';
  deleted?: boolean;
};

const listeners = new Set<() => void>();

function valid(value: unknown): value is LocalActivityPreference {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<LocalActivityPreference>;
  return (
    typeof item.id === 'string' &&
    !!item.id &&
    typeof item.action_id === 'string' &&
    ['no', 'a_little', 'yes', 'not_sure'].includes(item.rating ?? '') &&
    [0, 1].includes(item.reuse_context ?? -1) &&
    typeof item.helpful_lesson === 'string' &&
    (item.deleted === true || !!item.helpful_lesson.trim()) &&
    (item.deleted === undefined || typeof item.deleted === 'boolean') &&
    typeof item.created_at === 'number' &&
    Number.isFinite(item.created_at) &&
    item.storage === 'device'
  );
}

const preferenceSource: CollectionSource<LocalActivityPreference> = {
  table: 'activity_preferences',
  legacyFilename: 'mira.activity-preferences.v1.json',
  decode(value) {
    if (!Array.isArray(value) || !value.every(valid)) {
      throw new Error(
        'Saved preferences could not be imported safely. Your original file is unchanged.',
      );
    }
    return value;
  },
};

export function loadActivityPreferences() {
  return readDeviceCollection(preferenceSource).then((items) => items.filter((item) => !item.deleted));
}

/** Includes compact removal markers so older choices cannot silently become active again. */
export function loadActivityPreferenceRecords() {
  return readDeviceCollection(preferenceSource);
}

export function onActivityPreferencesChanged(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function mutate<T>(
  update: (items: LocalActivityPreference[]) => { items: LocalActivityPreference[]; result: T },
) {
  return mutateDeviceCollection(preferenceSource, update, async (db) => {
    await db.runAsync('UPDATE consent_state SET revision = revision + 1 WHERE id = 1');
  }).then((result) => {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        /* An observer cannot undo a successful commit. */
      }
    });
    return result;
  });
}

/** Call only after the person confirms the exact future-use preference. */
export function saveActivityPreference(run: LocalActivityRun, rating: Rating, lesson: string) {
  if (run.state === 'started' || !lesson.trim())
    throw new Error('Finish the activity and review the preference first.');
  return mutate((items) => {
    const existing = items.find((item) => item.id === run.id);
    // A retry must not overwrite a later revocation.
    if (existing) return { items, result: existing };
    const item: LocalActivityPreference = {
      id: run.id,
      action_id: run.action_id,
      rating,
      reuse_context: 1,
      helpful_lesson: lesson.trim(),
      created_at: Math.max(Date.now(), ...items.map((item) => item.created_at + 1)),
      storage: 'device',
    };
    return { items: [item, ...items], result: item };
  });
}

export function changeActivityPreference(id: string, action: 'reuse' | 'delete', enabled = false) {
  return mutate((items) => {
    if (!items.some((item) => item.id === id)) throw new Error('This preference no longer exists.');
    const changedAt = Math.max(Date.now(), ...items.map((item) => item.created_at + 1));
    return {
      items:
      action === 'delete'
          ? items.map((item) => item.id === id
            ? { ...item, reuse_context: 0, helpful_lesson: '', created_at: changedAt, deleted: true }
            : item)
          : items.map((item) =>
              item.id === id ? { ...item, reuse_context: enabled ? 1 : 0, created_at: changedAt } : item,
            ),
      result: undefined,
    };
  }).then((result) => {
    if (action === 'delete' || !enabled) emitContextRevoked();
    return result;
  });
}
