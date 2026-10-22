import type { ReachOutTone } from '../../assistance/assistanceClient';

export type ReachOutIntent = 'listen' | 'company' | 'practical' | 'own';
export const reachOutIntents: { id: ReachOutIntent; label: string }[] = [
  { id: 'listen', label: 'Ask someone to listen' },
  { id: 'company', label: 'Ask for some company' },
  { id: 'practical', label: 'Ask for practical help' },
  { id: 'own', label: 'Write my own message' },
];
export const reachOutTones: { id: ReachOutTone; label: string }[] = [
  { id: 'casual', label: 'Casual' }, { id: 'direct', label: 'Direct' }, { id: 'warmer', label: 'Warmer' },
  { id: 'hinglish', label: 'Hinglish' }, { id: 'no_rush', label: 'No-rush' },
];

const starters: Record<Exclude<ReachOutIntent, 'own'>, Record<ReachOutTone, string>> = {
  listen: {
    casual: 'Hey, got a few minutes to talk sometime?',
    direct: 'I could use someone to listen for a bit. Are you available?',
    warmer: 'Hey, if you have a little time, it would mean a lot to talk.',
    hinglish: 'Hey, thoda time milega baat karne ke liye? I could use a listener.',
    no_rush: 'Hey, I could use someone to listen for a bit. Whenever you have time is okay.',
  },
  company: {
    casual: 'Hey, are you free to hang out or catch up sometime soon?',
    direct: 'I would like some company. Are you available sometime soon?',
    warmer: 'Hey, I would love to spend a little time together if you are free.',
    hinglish: 'Hey, milne ka time hoga? It would be nice to catch up.',
    no_rush: 'Hey, would you be up for catching up sometime? No rush to reply.',
  },
  practical: {
    casual: 'Hey, could I get your help thinking through something practical?',
    direct: 'I need help with something practical. Would you have a few minutes?',
    warmer: 'Hey, if you have time, I would appreciate your help with something practical.',
    hinglish: 'Hey, ek practical cheez mein help karoge? A few minutes would help.',
    no_rush: 'Hey, could you help me think through something practical when you have a moment?',
  },
};

export function localToneVariant(intent: ReachOutIntent, tone: ReachOutTone, current: string) {
  if (intent !== 'own') return starters[intent][tone];
  const text = current.trim();
  if (!text) return '';
  const withoutNoRush = text.replace(/\s*No pressure if now isn't a good time\.?$/i, '').trim();
  if (tone === 'no_rush') return `${withoutNoRush}${withoutNoRush.endsWith('.') ? '' : '.'} No pressure if now isn't a good time.`;
  if (tone === 'direct') return withoutNoRush.replace(/^(hey|hi)[,!]?\s*/i, '').trim();
  if (tone === 'casual') return /^(hey|hi)[,!]?\s/i.test(withoutNoRush) ? withoutNoRush : `Hey, ${withoutNoRush.charAt(0).toLowerCase()}${withoutNoRush.slice(1)}`;
  if (tone === 'hinglish') return `Hey, thoda time milega? ${withoutNoRush}`;
  return `Hey, I wanted to reach out. ${withoutNoRush}`;
}
