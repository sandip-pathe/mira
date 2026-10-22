import { activityCapabilities, canonicalActivityId } from '../../../shared/activityRegistry';
import { getBundledIntervention } from '../../activities/data/catalog';
import type { SupportDecision } from '../../../shared/interventions';

const routes = new Set(['listen', 'ask_question', 'offer_intervention', 'human_support']);

/** Accept only the current proposal contract and resolve its activity from the installed catalog. */
export function normalizeSupportDecision(value: unknown): SupportDecision | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const decision = value as Record<string, unknown>;
  if (
    decision.contract_version !== 1 ||
    typeof decision.route !== 'string' || !routes.has(decision.route) ||
    typeof decision.situation_summary !== 'string' || decision.situation_summary.length > 500 ||
    typeof decision.question !== 'string' || decision.question.length > 300 ||
    typeof decision.offer_reason !== 'string' || decision.offer_reason.length > 240 ||
    !Array.isArray(decision.ranked_ids) || decision.ranked_ids.length > 4
  ) return undefined;

  const available = new Set(activityCapabilities().activity_ids);
  const rankedIds = [...new Set(decision.ranked_ids.flatMap((id) => {
    if (typeof id !== 'string') return [];
    const canonicalId = canonicalActivityId(id);
    return canonicalId && available.has(canonicalId) ? [canonicalId] : [];
  }))];

  if (decision.route === 'offer_intervention') {
    if (
      typeof decision.proposal_id !== 'string' || !decision.proposal_id || decision.proposal_id.length > 80 ||
      !decision.intervention || typeof decision.intervention !== 'object' ||
      typeof (decision.intervention as Record<string, unknown>).id !== 'string'
    ) return undefined;
    const activityId = canonicalActivityId((decision.intervention as Record<string, unknown>).id as string);
    if (!activityId || !available.has(activityId) || rankedIds[0] !== activityId) return undefined;
    const intervention = getBundledIntervention(activityId);
    if (!intervention) return undefined;
    return {
      contract_version: 1,
      proposal_id: decision.proposal_id,
      route: 'offer_intervention',
      situation_summary: decision.situation_summary,
      question: decision.question,
      offer_reason: decision.offer_reason,
      ranked_ids: rankedIds,
      intervention,
    };
  }

  if (decision.proposal_id !== null || decision.intervention !== null) return undefined;
  return {
    contract_version: 1,
    proposal_id: null,
    route: decision.route as SupportDecision['route'],
    situation_summary: decision.situation_summary,
    question: decision.question,
    offer_reason: decision.offer_reason,
    ranked_ids: rankedIds,
    intervention: null,
  };
}
