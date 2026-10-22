import React from 'react';
import { useFocusEffect } from 'expo-router';
import { removeContinueItem, type ContinueItem } from '../../../shared/interventions';
import { deleteTakeaway, loadSavedTakeaways, type SavedTakeaway } from '../../../shared/savedTakeaways';
import { deleteSavedAction, loadSavedActions, type SavedAction } from '../../../shared/savedActions';
import { deleteSavedWording, loadSavedWordings, type SavedWording } from '../../../shared/savedWordings';
import { deleteReachOutDraft, loadReachOutDrafts, type ReachOutDraft } from '../../../shared/reachOutDrafts';
import { loadContinueWork } from '../../activities/data/savedWork';
import {
  loadActivityPreferenceRecords,
  onActivityPreferencesChanged,
  type LocalActivityPreference,
} from '../data/preferenceRepository';

type LibraryData = {
  items: ContinueItem[];
  takeaways: SavedTakeaway[];
  savedActions: SavedAction[];
  savedWordings: SavedWording[];
  messageDrafts: ReachOutDraft[];
  preferences: LocalActivityPreference[];
};
export type SavedCollection = Exclude<keyof LibraryData, 'preferences'>;

const emptyData: LibraryData = {
  items: [], takeaways: [], savedActions: [], savedWordings: [], messageDrafts: [], preferences: [],
};
const removers = {
  items: removeContinueItem,
  takeaways: deleteTakeaway,
  savedActions: deleteSavedAction,
  savedWordings: deleteSavedWording,
  messageDrafts: deleteReachOutDraft,
};

/** Saved extras never gate the bundled catalog or require a server. */
export function useActivityLibrary() {
  const [data, setData] = React.useState<LibraryData>(emptyData);
  const [status, setStatus] = React.useState('');

  useFocusEffect(React.useCallback(() => {
    let active = true;
    let revision = 0;
    async function refresh() {
      const request = ++revision;
      const results = await Promise.allSettled([
        loadContinueWork().then((work) => work.map((entry) => entry.record)),
        loadSavedTakeaways(), loadSavedActions(), loadSavedWordings(),
        loadReachOutDrafts(), loadActivityPreferenceRecords(),
      ]);
      if (!active || request !== revision) return;
      const [items, takeaways, savedActions, savedWordings, messageDrafts, preferences] = results;
      setData({
        items: items.status === 'fulfilled' ? items.value : [],
        takeaways: takeaways.status === 'fulfilled' ? takeaways.value : [],
        savedActions: savedActions.status === 'fulfilled' ? savedActions.value : [],
        savedWordings: savedWordings.status === 'fulfilled' ? savedWordings.value : [],
        messageDrafts: messageDrafts.status === 'fulfilled' ? messageDrafts.value : [],
        preferences: preferences.status === 'fulfilled' ? preferences.value : [],
      });
      setStatus(results.some((result) => result.status === 'rejected')
        ? 'Some saved items could not be loaded. You can still choose an activity.' : '');
    }
    void refresh();
    const unsubscribe = onActivityPreferencesChanged(() => void refresh());
    return () => { active = false; unsubscribe(); };
  }, []));

  async function remove(collection: SavedCollection, id: string) {
    try {
      await removers[collection](id);
      setData((current) => ({
        ...current,
        [collection]: current[collection].filter((item) => item.id !== id),
      }));
    } catch {
      setStatus('This item could not be removed. Try again.');
    }
  }

  return { ...data, status, remove };
}

export type ActivityLibrary = ReturnType<typeof useActivityLibrary>;
