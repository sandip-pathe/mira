export type { ContextMatch } from '../../shared/context/contracts';

export type MomentState = {
  what_happened: string;
  current_need: string;
  what_is_unclear: string;
  support_mode:
    | 'listen_more'
    | 'clarify'
    | 'offer_action'
    | 'continue_action'
    | 'check_outcome'
    | 'suggest_human_support';
  suggested_action: string;
  previously_helpful: string;
};

export const blankMoment = (): MomentState => ({
  what_happened: '',
  current_need: '',
  what_is_unclear: '',
  support_mode: 'listen_more',
  suggested_action: '',
  previously_helpful: '',
});

// Preserve the existing recognition rules until voice confirmation is decided.
export function proposalResponse(text: string): 'accept' | 'decline' | undefined {
  const response = text.trim();
  if (/^(no|not now|maybe later|i don't want|i do not want)\b/i.test(response)) return 'decline';
  if (/^(yes|yeah|yep|sure|okay|ok|let's try|try it)\b/i.test(response)) return 'accept';
}
