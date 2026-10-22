import type { VoiceState } from '../../shared/voice';

export function talkPresentation(state: VoiceState, sessionEnded: boolean, error: string) {
  if (sessionEnded) return { title: 'Voice is off.', subtitle: 'Hold the mic when you’re ready.' };
  switch (state) {
    case 'starting': return { title: 'Turning the mic on…', subtitle: 'Keep holding to speak.' };
    case 'recording': return { title: 'I’m listening.', subtitle: 'Let go to send.' };
    case 'finalizing':
    case 'processing': return { title: 'One sec…', subtitle: '' };
    case 'speaking': return { title: 'Mira’s speaking', subtitle: 'Hold the mic to jump in.' };
    case 'connecting': return { title: 'Getting voice ready…', subtitle: '' };
    case 'reconnecting': return { title: 'Reconnecting voice…', subtitle: 'Your conversation is still here.' };
    case 'error':
    case 'failed':
    case 'turn_error': return {
      title: /temporarily offline/i.test(error) ? 'Mira’s temporarily offline.' : 'Let’s try voice again.',
      subtitle: 'Hold the mic, or type instead.',
    };
    default: return { title: 'Hey. What’s on your mind?', subtitle: 'No need to make it sound neat.' };
  }
}
