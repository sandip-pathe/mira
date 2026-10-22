import { selectContext } from './contextRepository';
import type { ContextSnapshot } from './contracts';

export type ContextPurpose = 'talk' | 'activity_selection' | 'activity_assistance' | 'personalization';
export type ContextScope = 'shared_context' | 'reuse_preference';
export type ScopedContextSnapshot = ContextSnapshot & {
  purpose: ContextPurpose;
  scopesRead: readonly ContextScope[];
};

const purposeScopes: Record<ContextPurpose, readonly ContextScope[]> = {
  talk: ['shared_context', 'reuse_preference'],
  activity_selection: ['shared_context', 'reuse_preference'],
  activity_assistance: ['shared_context', 'reuse_preference'],
  personalization: ['reuse_preference'],
};

/** Purpose-scoped entry point. Its source adapter only reads approved excerpts and explicit reuse preferences. */
export async function getContextSnapshot(
  purpose: ContextPurpose,
  queryText = '',
): Promise<ScopedContextSnapshot> {
  const scopesRead = purposeScopes[purpose];
  const snapshot = await selectContext(queryText, {
    sharedContext: scopesRead.includes('shared_context'),
    reusePreferences: scopesRead.includes('reuse_preference'),
  });
  return { ...snapshot, purpose, scopesRead };
}
