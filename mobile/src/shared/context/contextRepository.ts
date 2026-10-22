import { withDeviceTransaction } from '../storage/database';
import { contextPreferenceFeatures, type ActivityPreferenceRecord } from './preferenceFeatures';
import type { ContextMatch, ContextSnapshot } from './contracts';

type Candidate = { score: number; created_at: number; match: ContextMatch };

function words(text: string) {
  return [...new Set(text.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[\p{L}\p{N}']+/gu) ?? [])]
    .filter((word) => word.length > 2);
}

function score(query: string[], text: string) {
  const candidates = new Set(words(text));
  return query.reduce((total, word) => total + (candidates.has(word) ? 1 : 0), 0);
}

function localDay(timestampSeconds: number) {
  const date = new Date(timestampSeconds * 1000);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function queryDay(query: string[]) {
  if (query.includes('today')) return localDay(Date.now() / 1000);
  if (query.includes('yesterday')) return localDay((Date.now() - 24 * 60 * 60 * 1000) / 1000);
}

/** Reads approved shared excerpts and explicit reuse preferences. Private activity content is never queried. */
export function selectContext(
  queryText: string,
  scopes: { sharedContext?: boolean; reusePreferences?: boolean } = {},
): Promise<ContextSnapshot> {
  const includeSharedContext = scopes.sharedContext !== false;
  const includeReusePreferences = scopes.reusePreferences !== false;
  const query = words(queryText);
  const requestedDay = queryDay(query);
  return withDeviceTransaction(async (db) => {
    const revision = (await db.getFirstAsync<{ revision: number }>(
      'SELECT revision FROM consent_state WHERE id = 1',
    ))?.revision ?? 0;
    const excerpts = query.length && includeSharedContext ? await db.getAllAsync<{
      id: string; source_entry_id: string; excerpt: string; created_at: number;
    }>(`SELECT m.id, m.source_entry_id, m.excerpt, j.created_at
        FROM memory_items m JOIN journal_entries j ON j.id = m.source_entry_id
        WHERE m.approved = 1 AND m.revoked = 0`) : [];
    const candidates: Candidate[] = excerpts.flatMap((item) => {
      const points = score(query, item.excerpt) +
        (requestedDay && localDay(item.created_at) === requestedDay ? 3 : 0);
      return points ? [{
        score: points,
        created_at: item.created_at,
        match: { id: item.id, source_type: 'journal', source_id: item.source_entry_id,
          excerpt: item.excerpt, label: 'Journal excerpt', scope: 'shared_context' },
      }] : [];
    });

    const saved = includeReusePreferences ? await db.getAllAsync<{ id: string; payload: string }>(
      'SELECT id, payload FROM activity_preferences ORDER BY position',
    ).then((rows) => rows.map((row) => JSON.parse(row.payload) as ActivityPreferenceRecord)) : [];
    const preferences = contextPreferenceFeatures(saved);
    for (const item of preferences) {
      const points = score(query, `${item.activityId.replace(/_/g, ' ')} ${item.lesson}`);
      if (!points) continue;
      candidates.push({
        score: points,
        created_at: item.createdAt,
        match: { id: item.sourceId, source_type: 'feedback', source_id: item.sourceId,
          excerpt: item.lesson, label: 'Saved activity preference', scope: 'reuse_preference' },
      });
    }
    candidates.sort((a, b) => b.score - a.score || b.created_at - a.created_at);
    return {
      revision,
      matches: candidates.slice(0, 1).map(({ match }) => match),
      preferences: preferences.map((item) => ({
        intervention_id: item.activityId,
        rating: item.rating,
        preference: item.lesson,
      })),
    };
  });
}

export function currentContextRevision() {
  return withDeviceTransaction(async (db) =>
    (await db.getFirstAsync<{ revision: number }>(
      'SELECT revision FROM consent_state WHERE id = 1',
    ))?.revision ?? 0,
  );
}
