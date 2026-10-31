import { getAuthenticatedSession, requestWithRenewal } from '../../../shared/api';

export type DumpSections = { heavy: string; wait: string; thread: string };
export type DumpSectionId = keyof DumpSections;
type RequestBase = {
  contract_version: 1;
  request_id: string;
  activity_run_id: string;
  source_revision: number;
  source_text: string;
};
export type UntangleDumpRequest = RequestBase & { operation: 'untangle_dump' };
export type RefineDumpRequest = RequestBase & {
  operation: 'refine_dump';
  current_sections: DumpSections;
  dismissed_sections: DumpSectionId[];
  instruction: string;
};
export type ShrinkTaskRequest = RequestBase & { operation: 'shrink_task' };
export type ThoughtAnglesRequest = RequestBase & { operation: 'thought_angles'; situation: string; interpretation: string };
export type LetterTakeawayRequest = RequestBase & { operation: 'letter_takeaway' };
export type ReachOutTone = 'casual' | 'direct' | 'warmer' | 'hinglish' | 'no_rush';
export type ReachOutRewriteRequest = RequestBase & { operation: 'reach_out_rewrite'; context: string; tone: ReachOutTone };
export type ActivityAssistanceRequest = UntangleDumpRequest | RefineDumpRequest | ShrinkTaskRequest | ThoughtAnglesRequest | LetterTakeawayRequest | ReachOutRewriteRequest;
export type ActivityAssistanceResponse = (RequestBase & {
  operation: 'untangle_dump' | 'refine_dump';
  sections: DumpSections;
}) | (RequestBase & { operation: 'shrink_task'; suggested_step: string }) |
  (RequestBase & { operation: 'thought_angles'; angle_one: string; angle_two: string }) |
  (RequestBase & { operation: 'letter_takeaway'; need_or_boundary: string; talk_line: string }) |
  (RequestBase & { operation: 'reach_out_rewrite'; suggested_message: string });

export async function requestActivityAssistance(
  request: ActivityAssistanceRequest,
  signal: AbortSignal,
): Promise<ActivityAssistanceResponse> {
  const session = await getAuthenticatedSession();
  const response = await requestWithRenewal<ActivityAssistanceResponse>(
    '/workers/activities/assistance', session, request, 'POST', { signal },
  );
  if (response.contract_version !== 1 || response.request_id !== request.request_id ||
      response.activity_run_id !== request.activity_run_id || response.source_revision !== request.source_revision ||
      response.operation !== request.operation ||
      (request.operation === 'shrink_task'
        ? !('suggested_step' in response) || typeof response.suggested_step !== 'string' || response.suggested_step.length > 500
        : request.operation === 'thought_angles'
          ? !('angle_one' in response) || !('angle_two' in response) || typeof response.angle_one !== 'string' || typeof response.angle_two !== 'string' ||
            !response.angle_one.trim() || !response.angle_two.trim() || response.angle_one.length > 500 || response.angle_two.length > 500 || response.angle_one.trim().toLowerCase() === response.angle_two.trim().toLowerCase()
          : request.operation === 'letter_takeaway'
            ? !('need_or_boundary' in response) || !('talk_line' in response) || typeof response.need_or_boundary !== 'string' || typeof response.talk_line !== 'string' ||
              response.need_or_boundary.length > 500 || response.talk_line.length > 500 || (!response.need_or_boundary.trim() && !response.talk_line.trim())
            : request.operation === 'reach_out_rewrite'
              ? !('suggested_message' in response) || typeof response.suggested_message !== 'string' || !response.suggested_message.trim() || response.suggested_message.length > 2000
              : !('sections' in response) || !isSections(response.sections))) {
    throw new Error('The returned notes did not match this writing.');
  }
  return response;
}

function isSections(value: unknown): value is DumpSections {
  if (!value || typeof value !== 'object') return false;
  const sections = value as Record<string, unknown>;
  return ['heavy', 'wait', 'thread'].every((key) =>
    typeof sections[key] === 'string' && (sections[key] as string).length <= 500);
}
