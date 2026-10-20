import { withDeviceTransaction } from '../../../shared/storage/database';
import type { ContextMatch } from '../conversation';

export type ApprovedActivityPreference = {
  intervention_id: string;
  rating: string;
  preference: string;
};

export type TalkContextSnapshot = {
  revision: number;
  matches: ContextMatch[];
  preferences: ApprovedActivityPreference[];
};

type Candidate = { score: number; created_at: number; match: ContextMatch };

function words(text: string) {
  return [...new Set(text.toLowerCase().match(/[a-z0-9']+/g) ?? [])].filter((word) => word.length > 2);
}

function score(query: string[], text: string) {
  return query.reduce((total, word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return total + (new RegExp(`\\b${escaped}\\b`, 'i').test(text) ? 1 : 0);
  }, 0);
}

function localDay(timestampSeconds: number) {
  const date = new Date(timestampSeconds * 1000);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function queryDay(query: string[]) {
  if (query.includes('today')) return localDay(Date.now() / 1000);
  if (query.includes('yesterday')) return localDay((Date.now() - 24 * 60 * 60 * 1000) / 1000);
}

/** Reads and ranks only consented context on-device, alongside its revocation revision. */
export function selectTalkContext(queryText: string): Promise<TalkContextSnapshot> {
  const query = words(queryText);
  const requestedDay = queryDay(query);
  return withDeviceTransaction(async (db) => {
    const revision = (await db.getFirstAsync<{ revision: number }>(
      'SELECT revision FROM consent_state WHERE id = 1',
    ))?.revision ?? 0;
    if (!query.length) return { revision, matches: [], preferences: [] };

    const excerpts = await db.getAllAsync<{
      id: string; source_entry_id: string; excerpt: string; created_at: number;
    }>(`SELECT m.id, m.source_entry_id, m.excerpt, j.created_at
        FROM memory_items m JOIN journal_entries j ON j.id = m.source_entry_id
        WHERE m.approved = 1 AND m.revoked = 0`);
    const candidates: Candidate[] = excerpts.flatMap((item) => {
      const points = score(query, item.excerpt) +
        (requestedDay && localDay(item.created_at) === requestedDay ? 3 : 0);
      return points ? [{
        score: points,
        created_at: item.created_at,
        match: { id: item.id, source_type: 'journal', source_id: item.source_entry_id,
          excerpt: item.excerpt, label: 'Journal excerpt' },
      }] : [];
    });

    const saved = await db.getAllAsync<{ id: string; payload: string }>(
      'SELECT id, payload FROM activity_preferences ORDER BY position',
    )
      .then((rows) => rows.map((row) => JSON.parse(row.payload) as {
        id: string; action_id: string; rating: string; helpful_lesson: string; created_at: number;
        reuse_context: number;
      }));
    const preferences = saved.filter((item) => item.reuse_context === 1 && item.helpful_lesson.trim())
      .map((item) => ({ item, score: score(query, `${item.action_id.replace(/_/g, ' ')} ${item.helpful_lesson}`) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.item.created_at - a.item.created_at)
      .slice(0, 3);
    for (const { item, score: points } of preferences) {
      candidates.push({
        score: points,
        created_at: item.created_at,
        match: { id: item.id, source_type: 'feedback', source_id: item.id,
          excerpt: item.helpful_lesson, label: 'Saved activity preference' },
      });
    }
    candidates.sort((a, b) => b.score - a.score || b.created_at - a.created_at);
    return {
      revision,
      matches: candidates.slice(0, 1).map(({ match }) => match),
      preferences: preferences.map(({ item }) => ({
        intervention_id: item.action_id,
        rating: item.rating,
        preference: item.helpful_lesson,
      })),
    };
  });
}

export function currentConsentRevision() {
  return withDeviceTransaction(async (db) =>
    (await db.getFirstAsync<{ revision: number }>(
      'SELECT revision FROM consent_state WHERE id = 1',
    ))?.revision ?? 0,
  );
}
